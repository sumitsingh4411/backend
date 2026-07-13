# Design: Chat System

Design something like WhatsApp/Slack. This one is special because it breaks the request/response model you've relied on all roadmap — the **server must push**, and connections are **stateful**.

## Requirements

**Functional:** 1-to-1 messaging, group chats, online presence, message history, delivery receipts (sent/delivered/read), push notifications when offline.

**Non-functional:** **low latency** (< 100ms), messages must **never be lost**, ordering must be consistent, and it must scale to millions of *concurrent connections*.

## The core challenge

HTTP is client-initiated: the server can't speak first. But chat is fundamentally **server-push**. So:

- ❌ **Polling** — laggy and wasteful (mostly empty responses).
- ✅ **WebSockets** — a persistent, bidirectional connection. Server pushes instantly.

**This creates the central difficulty: WebSockets are *stateful*.** Every other service you've built was stateless and interchangeable. Here, a user's connection lives **on one specific server**, in memory. That single fact drives the whole architecture.

## The problem it causes

```
Alice is connected to chat-server-1
Bob   is connected to chat-server-3

Alice sends "hi Bob"  →  arrives at server-1
                          ...but Bob's socket is on server-3.
                          Server-1 has no way to reach him. ❌
```

## The solution: a pub/sub backbone

Servers don't talk to each other directly (that's O(n²) and brittle). Instead they **publish to a shared broker**, and each server **subscribes** to the users it currently holds.

```
Alice ──▶ [chat-server-1] ──publish "user:bob"──▶ ┌──────────────┐
                                                   │  Redis /     │
                                                   │  Kafka       │
Bob   ◀── [chat-server-3] ◀──subscribed to────────│  (pub/sub)   │
                                "user:bob"         └──────────────┘
```

1. Server-1 receives Alice's message, persists it, and **publishes** to channel `user:bob`.
2. Server-3 — which holds Bob's socket and **subscribed** to `user:bob` when he connected — receives it and pushes it down the WebSocket. ⚡

Servers stay ignorant of each other. Add or remove servers freely. **This decoupling is the key insight.**

## A service registry

You also need to know *whether* a user is online and where. Keep a lightweight map in Redis:

```
user:bob → { server: "chat-server-3", status: "online", lastSeen: ... }
```

Written on connect, deleted on disconnect (with a TTL/heartbeat so crashed servers don't leave ghosts). This powers **presence** ("Bob is online") *and* tells you when to fall back to a **push notification** instead.

## The message flow, end to end

```
1. Alice's client  ──WebSocket──▶  chat-server-1
2. Server: authenticate, validate, assign a message ID
3. PERSIST to the database  ← do this BEFORE acking. Durability first.
4. ACK back to Alice ("sent" ✓)
5. Look up Bob in the registry:
      online?  → publish to pub/sub → his server pushes it  ("delivered" ✓✓)
      offline? → send a push notification (APNs/FCM); he'll fetch on reconnect
```

> **Persist before you acknowledge.** If you ack first and then crash, the message is gone and Alice believes it was sent. Durability beats a few milliseconds of latency.

## Storing messages

The access pattern is: *"give me the last 50 messages in this conversation."* That's a **time-ordered range query within a partition** — exactly what a **wide-column store** (Cassandra) is built for. It also handles enormous write volume.

```
Partition key:  conversation_id      ← all of a chat's messages live together
Clustering key: message_id / timestamp (descending)   ← sorted, cheap range reads
```

Messages are **append-only and immutable** — never updated, only inserted. That's what makes this scale.

## Ordering: harder than it looks

Server clocks drift, so timestamps alone can't order messages reliably.

- Within one conversation, have **one authority** assign a **monotonic sequence number** (or use **Snowflake IDs** — time-sortable and globally unique).
- Clients sort by that sequence, not by arrival time.
- Clients also send a **temporary local ID** so a message can be shown instantly ("optimistic UI") and reconciled when the server's real ID arrives.

## Group chats

**Fan-out on write:** when a message lands, publish it to each member's channel.
- Fine for small groups (Slack channels, family chats).
- ❌ Breaks for huge groups — a 100,000-member channel means 100,000 publishes per message.
- **Fix for large groups:** members subscribe to a **`conversation:{id}`** channel directly — publish once, everyone listening gets it. (Fan-out on *read*.)

## Scaling connections

A WebSocket is an **open TCP connection held in memory** — you're limited by memory and file descriptors, not CPU (typically ~10k–100k per server).

- Scale **horizontally** — many chat servers behind a load balancer that supports WebSockets (L4, or L7 with upgrade support).
- **Heartbeats/pings** detect dead connections (a client that lost signal never sends a FIN — you'd leak the socket forever).
- On reconnect, the client sends its **last received message ID** and the server replays anything missed.

## Key takeaways

- Chat needs **server push** → **WebSockets**, which makes connections **stateful** — the crux of the whole design.
- Users on different servers can't reach each other directly → use a **pub/sub broker** (Redis/Kafka) as the backbone.
- Keep a **presence registry** (user → server) in Redis; offline → **push notification**.
- **Persist before acknowledging**; store messages append-only, partitioned by conversation, ordered by a **monotonic/Snowflake ID**.
- Fan-out on write for small groups; **subscribe to a conversation channel** for huge ones.
