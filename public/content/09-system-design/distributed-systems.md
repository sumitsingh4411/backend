# Distributed Systems Concepts

The moment your system spans **more than one machine**, a new class of problems appears — ones that simply don't exist in a single process. This lesson is the mental toolkit for reasoning about them.

## The fallacies of distributed computing

Engineers new to distributed systems assume things that are **all false**:

1. The network is reliable. ❌
2. Latency is zero. ❌
3. Bandwidth is infinite. ❌
4. The network is secure. ❌
5. Topology doesn't change. ❌
6. There is one administrator. ❌
7. Transport cost is zero. ❌
8. The network is homogeneous. ❌

Every distributed bug you'll ever debug traces back to believing one of these.

## The fundamental problem: you cannot distinguish "slow" from "dead"

You call service B. No answer after 5 seconds. **What happened?**

- B never got the request? (Request lost.)
- B is processing it slowly?
- B did the work, and the *response* was lost?
- B crashed halfway through?

**You genuinely cannot tell.** This uncertainty is the root of nearly everything hard here — and it's exactly why **idempotency** matters: you must retry, but retrying must be safe.

## Consistency models

- **Strong consistency** — every read sees the latest write. Simple to reason about, costs latency and availability.
- **Eventual consistency** — replicas converge over time; a read may be briefly stale. Scales beautifully. (Your like count being 2 seconds old is fine.)
- **Causal consistency** — related events stay ordered (you never see a reply before the message it replies to), even if unrelated ones don't.

**Pick per data type, not per system.** Account balance → strong. View count → eventual.

## Patterns that keep you alive

### Retries with exponential backoff + jitter
Retry, but wait longer each time — and add **randomness**:

```js
const delay = Math.min(baseMs * 2 ** attempt, maxMs);
const jittered = delay * (0.5 + Math.random() / 2);   // ← the jitter matters
```

Without **jitter**, every client retries at the *same* instant, creating a **thundering herd** that re-kills the service the moment it recovers.

### Circuit breaker
If a dependency is clearly down, **stop calling it**. Hammering a dying service prevents its recovery and burns your own threads waiting on timeouts.

```
CLOSED  → calls flow normally
   ↓ (failures cross a threshold)
OPEN    → fail instantly, don't even try  ← gives the service room to recover
   ↓ (after a cooldown)
HALF-OPEN → let one probe through. Success → CLOSED. Failure → OPEN.
```

### Timeouts — always
A call with no timeout can hang forever, holding a connection and a thread. Under load, that **exhausts your pool** and one slow dependency takes down your entire service. **Every network call gets a timeout.**

### Graceful degradation
If the recommendations service is down, show a generic list — don't fail the whole page. Decide upfront which dependencies are **critical** vs **optional**.

### Bulkheads
Isolate resources (separate connection pools per dependency) so one failing dependency can't consume every thread and sink the ship.

## Distributed transactions: the Saga pattern

You can't run an ACID transaction across services with separate databases. Instead, a **saga** is a sequence of local transactions, each with a **compensating action** to undo it.

```
1. Reserve inventory   ✅
2. Charge payment      ✅
3. Schedule shipping   ❌ FAILS
   ↓ compensate, in reverse:
   → Refund payment
   → Release inventory
```

There's no rollback button — **you write the undo yourself.** This is a major hidden cost of microservices, and a strong argument for keeping things in one database until you truly must split.

## Consensus (know it exists)

How do multiple nodes agree on one value (like "who is the leader?") when messages can be lost and nodes can crash? Algorithms like **Raft** and **Paxos** solve this. You'll rarely implement one — you'll **use** systems built on them (etcd, ZooKeeper, Consul).

The practical takeaway: consensus requires a **quorum** (a majority). That's why clusters have an **odd number of nodes** (3, 5) — so a majority always exists and **split-brain** is impossible.

## Key takeaways

- The **fallacies**: the network is unreliable, slow, and changing — design for that.
- You **cannot distinguish slow from dead** → retries are unavoidable → **operations must be idempotent**.
- Choose the **consistency model per data type** (strong for money, eventual for counters).
- Survival kit: **timeouts on everything**, **backoff + jitter**, **circuit breakers**, **bulkheads**, **graceful degradation**.
- Cross-service transactions need **sagas with compensating actions** — you write the undo yourself.
