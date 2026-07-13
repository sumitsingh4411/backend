# CAP Theorem & Idempotency

Two ideas that separate engineers who *use* distributed systems from those who *understand* them.

---

# Part 1: The CAP Theorem

In a distributed system you want three things:

- **C — Consistency**: every read gets the most recent write. Everyone sees the same data.
- **A — Availability**: every request gets a (non-error) response.
- **P — Partition tolerance**: the system keeps working when the network between nodes breaks.

**CAP says: you can only have two.**

## The insight everyone misses

In the real world, **networks fail**. Cables get cut, packets drop, a data center goes dark. So **P is not optional** — you *must* tolerate partitions.

Which means CAP is really a much simpler question:

> **When the network splits, do you choose Consistency or Availability?**

## The choice, made concrete

Two nodes can't talk to each other. A write lands on node A. Now a read arrives at node B, which has no idea about it.

- **Choose C (CP):** node B **refuses to answer** rather than return stale data. The system is *correct but unavailable*.
  > Banks, inventory, anything where wrong data is worse than no data. *(e.g. traditional SQL with strict consistency, ZooKeeper, etcd)*

- **Choose A (AP):** node B **answers with possibly stale data**. The system stays *up but temporarily wrong*, converging later.
  > Social feeds, product catalogs, likes. A slightly stale like count is fine; an error page is not. *(e.g. Cassandra, DynamoDB)*

## Eventual consistency

Most large systems pick **AP** and embrace **eventual consistency**: replicas may briefly disagree, but with no new writes they all **converge** to the same value.

That's not a bug — it's a deliberate trade for availability and scale. Your job is to know **which data can tolerate it** (view counts: yes) and which cannot (account balance: no).

---

# Part 2: Idempotency

**An idempotent operation has the same effect whether you run it once or a hundred times.**

## Why this is essential, not academic

Networks are unreliable. A client sends `POST /charge`, the server charges the card — and then **the response is lost in transit**. The client sees a timeout and does the natural thing: **retries**.

```
Attempt 1: POST /charge $100  → charged ✅ → response LOST 📉
Attempt 2: POST /charge $100  → charged AGAIN ❌  → customer billed $200
```

The client can never know whether a timeout meant "it failed" or "it worked but I didn't hear back." **Retries are inevitable** — so operations must be safe to repeat.

Same problem with queues: brokers guarantee **at-least-once** delivery, so a worker *will* occasionally process the same message twice.

## Which operations are naturally idempotent?

- **GET** — reading changes nothing. ✅
- **PUT** — "set the name to Ada." Do it twice, same result. ✅
- **DELETE** — deleting twice still leaves it deleted. ✅
- **POST** — "create a new order." Twice = **two orders**. ❌ **This is the dangerous one.**

## The fix: idempotency keys

The client generates a unique key per *logical* operation and sends it. The server records which keys it has processed, and on a repeat it **returns the original result instead of doing the work again**.

```http
POST /charges
Idempotency-Key: 7c9e-4f21-a3b8      ← same key on every retry
{ "amount": 100 }
```

```js
async function charge({ amount, idempotencyKey }) {
  // Did we already handle this exact request?
  const existing = await db.idempotency.find(idempotencyKey);
  if (existing) return existing.result;          // ✅ safe replay — no double charge

  const result = await paymentProvider.charge(amount);
  await db.idempotency.save(idempotencyKey, result);   // remember it
  return result;
}
```

This is exactly how Stripe's API works — and why you can safely retry a payment.

## Other ways to get idempotency

- **Natural unique keys** — a DB `UNIQUE` constraint on `order_id` makes a duplicate insert fail harmlessly.
- **Conditional updates** — `UPDATE ... WHERE status = 'pending'` runs once; the second time it matches 0 rows.
- **Upserts** — "insert or update" converges to the same state either way.

## Key takeaways

- **CAP**: partitions are unavoidable, so the real choice is **Consistency vs Availability** when the network splits.
- **CP** = correct but may reject requests (money). **AP** = always answers, may be stale (feeds) → **eventual consistency**.
- **Idempotency** means repeating an operation is harmless — essential because **retries are inevitable**.
- GET/PUT/DELETE are naturally idempotent; **POST is not** → use **idempotency keys**, unique constraints, or conditional updates.
