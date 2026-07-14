<div align="center">

<sub>[← BackendPath](../README.md)</sub>

# 🕸️ Part 8 · Reliability

**The network will fail. Design like it already has.**

<sub>`3 min read`</sub>

</div>

---

### In this part

- [8.1 Timeouts — the default is "wait forever"](#81-timeouts--the-default-is-wait-forever)
- [8.2 Retries — necessary, and dangerous](#82-retries--necessary-and-dangerous)
- [8.3 Circuit breakers — stop kicking a service that's down](#83-circuit-breakers--stop-kicking-a-service-thats-down)
- [8.4 Graceful degradation](#84-graceful-degradation)
- [8.5 CAP — you don't get to keep all three](#85-cap--you-dont-get-to-keep-all-three)
- [8.6 🚨 The dual-write problem](#86--the-dual-write-problem)

---

## 8.1 Timeouts — the default is "wait forever"

> ### 🚨 One slow dependency becomes a total outage
>
> A downstream service hangs. Your requests to it don't *error* — they **wait**. Each waiting request holds a thread and a connection. Within seconds **every worker is stuck**, your pool is exhausted, and **your whole service is down — because something else was slow.**

**Set an explicit timeout on every network call. No exceptions.** A request with no deadline is a resource leak waiting for a bad day.

And **budget timeouts down the chain**: if the user's request has 3s, a call three services deep cannot also get 3s.

## 8.2 Retries — necessary, and dangerous

```js
// exponential backoff + JITTER. The jitter is not optional.
async function withRetry(fn, max = 4) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= max || !isRetriable(err)) throw err;   // never retry a 4xx
      const base = Math.min(1000 * 2 ** attempt, 20_000);   // 1s, 2s, 4s, 8s… capped
      await sleep(Math.random() * base);                    // ← spreads the herd
    }
  }
}
```

> **Retries without jitter cause a thundering herd.** A service blips, and 10,000 clients all retry at exactly 1s, then 2s, then 4s — synchronised waves that hammer the recovering service **back into the ground**.

Rules: **only retry idempotent operations** (retrying a payment charges twice) and **never retry a 4xx** — the request was wrong and will be wrong again.

## 8.3 Circuit breakers — stop kicking a service that's down

```
         failures exceed threshold
  CLOSED ───────────────────────────▶ OPEN
   ▲  (normal: requests flow)      (fail FAST — don't even try.
   │                                give it room to recover)
   │  success                          │ after a cooldown
   │                                   ▼
   └──────────────────────────── HALF-OPEN
        (let ONE test request through; ok → CLOSED, fail → OPEN)
```

A retry says "try again". A circuit breaker says **"stop trying for a while."** When open, it fails instantly — no threads pile up waiting — and you serve a **fallback** (a cached value, a default, a graceful "try later") instead of hanging.

## 8.4 Graceful degradation

**Rank your features.** Checkout is critical. Recommendations are not.

When recommendations are down, **show the page without them**. Never fail the whole page for a nice-to-have. *Degrade, don't die.*

## 8.5 CAP — you don't get to keep all three

Partitions **will** happen. So the real, unavoidable choice is: when the network splits, do you…

- **CP** — refuse to answer rather than risk a **wrong** answer → **money, inventory, bookings**
- **AP** — answer with possibly-stale data rather than **fail** → **feeds, likes, counts**

**This is a per-field decision, not a company religion.** The bank balance is CP. The "last seen" timestamp next to it is AP.

## 8.6 🚨 The dual-write problem

```js
await db.orders.insert(order);        // ✅ committed
await kafka.publish("order.created"); // 💥 app crashes here

// The order EXISTS but no downstream ever hears about it.
// No email. No fulfilment. No analytics. Silently.
```

There is **no shared transaction** across a database and a message broker. So this *will* happen.

**The fix — the transactional outbox:**

```sql
BEGIN;
  INSERT INTO orders (id, ...) VALUES (...);
  INSERT INTO outbox (topic, payload)         -- SAME transaction
         VALUES ('order.created', '{...}');
COMMIT;   -- both land, or neither does

-- A separate relay polls the outbox and publishes, marking rows sent.
-- Crash mid-publish? It re-sends → at-least-once → consumers must dedupe.
```

---

<div align="center">

[← ⚡ Part 7 · Performance](07-performance.md) · [**Contents**](../README.md#contents) · [🚀 Part 9 · DevOps & deploys →](09-devops.md)

<sub><a href="#top">↑ back to top</a></sub>

</div>
