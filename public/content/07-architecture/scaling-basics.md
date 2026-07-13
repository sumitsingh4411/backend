# Scaling: Vertical vs Horizontal

Your app works with 100 users. Will it work with 10 million? **Scaling** is how you handle growing load — and there are exactly two directions to grow.

## Vertical scaling (scale up)

**Make one machine bigger.** More CPU, more RAM, faster disk.

- ✅ **Dead simple** — change an instance size, no code changes. Your app doesn't even know.
- ❌ There's a **ceiling** — you can't buy an infinitely big machine.
- ❌ It's a **single point of failure** — that one box dies, you're down.
- ❌ Cost grows **non-linearly** — the biggest machines are wildly expensive.

## Horizontal scaling (scale out)

**Add more machines** and spread the load across them with a load balancer.

- ✅ **Near-unlimited** — keep adding boxes.
- ✅ **Fault tolerant** — one dies, the others serve.
- ✅ Cost is roughly **linear** — commodity machines.
- ❌ Requires your app to be **stateless** (the hard part).

```
Vertical:                    Horizontal:
   ┌────────┐                   ┌──── server 1
   │ BIGGER │                LB ├──── server 2
   │ SERVER │                   └──── server 3
   └────────┘
 simple, has a ceiling        scales forever, needs statelessness
```

## The prerequisite: statelessness

This is the whole ballgame. If a server stores state **in its own memory**, horizontal scaling breaks:

```
❌ User logs in → server A stores the session in local memory
   Next request → load balancer routes to server B → "who are you?" → logged out
```

**Fix: move state out of the app servers.** Keep them interchangeable — any server can handle any request.

- Sessions → **Redis** (shared) or a signed **JWT** (no server storage).
- Uploaded files → **object storage** (S3), never the local disk.
- Cache → **Redis**, not an in-process map.
- Background jobs → a **queue**, not an in-memory array.

> **The test:** *Can I kill any server at random and lose nothing?* If yes, you can scale horizontally.

## Scale the database too

App servers are easy — they're stateless. The **database is usually the real bottleneck**, because it's inherently stateful. Your toolkit, in order of cost:

1. **Add indexes / fix N+1 queries** — free, and usually the actual problem.
2. **Cache** reads (Redis) — takes huge pressure off the DB.
3. **Read replicas** — send reads to copies (next lesson).
4. **Sharding** — split the data across DBs. Powerful, complex, last resort.

## Don't scale prematurely

Real advice: **most apps never need to scale beyond one decent server plus a database.** Before adding machines:

- **Measure.** Find the actual bottleneck (it's usually one bad query).
- **Optimize.** An index can be 1000× cheaper than a fleet of servers.
- **Cache.** Then scale.

Premature scaling adds complexity, cost, and new failure modes to solve a problem you don't have.

## Key takeaways

- **Vertical** = bigger machine (simple, capped, single point of failure). **Horizontal** = more machines (scales, resilient, needs statelessness).
- Horizontal scaling requires **stateless app servers** — push sessions, files, and cache to shared services.
- The **database** is usually the real bottleneck: index → cache → replicate → shard.
- **Measure before you scale.** Most bottlenecks are one bad query, not too few servers.
