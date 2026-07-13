# Concurrency Control & Locking

Two users click "Buy" on the last item at the same millisecond. Both requests read `stock = 1`. Both conclude "in stock." Both sell it.

**You just sold one item twice.** Welcome to concurrency control — where the bugs are invisible in testing and inevitable in production.

## The lost update problem

```
Time    Request A                 Request B
────────────────────────────────────────────────────
 t1     read stock → 1
 t2                               read stock → 1     ← both see 1!
 t3     if (1 > 0) ✅
 t4                               if (1 > 0) ✅
 t5     write stock = 0
 t6                               write stock = 0    ← A's update is LOST
```

Both succeed. Stock is 0. **Two customers were charged. One item exists.**

Notice this can't be fixed by "being careful" in application code — the gap between **read** and **write** is where the race lives. You need the *database* to help.

---

## Strategy 1: Pessimistic locking — "assume conflict, lock first"

Lock the row **before** reading it. Anyone else who wants it **waits**.

```sql
BEGIN;
  SELECT stock FROM products WHERE id = 42 FOR UPDATE;   -- 🔒 lock the row
  -- Request B now BLOCKS here until we commit.

  UPDATE products SET stock = stock - 1 WHERE id = 42;
COMMIT;                                                   -- 🔓 lock released
```

`FOR UPDATE` is the workhorse. B waits, then re-reads and correctly sees `stock = 0`.

- ✅ **Guaranteed correct.** Simple to reason about.
- ❌ **Blocking** — throughput drops under contention.
- ❌ Risk of **deadlocks** (see below).
- ❌ Hold the lock across a slow operation (a payment API call!) and you'll stall everyone.

> **Use when:** conflicts are **likely** and correctness is critical — inventory, seat booking, account balances.

⚠️ **Never hold a database lock while calling an external API.** A 30-second Stripe timeout becomes a 30-second lock on your hottest row, and your entire connection pool drains.

---

## Strategy 2: Optimistic locking — "assume no conflict, verify at the end"

Don't lock. Read freely, but **detect** at write time whether anyone changed the row underneath you — using a **version** column.

```sql
-- 1. Read (no lock)
SELECT stock, version FROM products WHERE id = 42;   -- stock=1, version=7

-- 2. Write, but ONLY if the version is still what we read
UPDATE products
   SET stock = stock - 1,
       version = version + 1
 WHERE id = 42
   AND version = 7;         -- 🔑 the guard
```

Then **check the affected row count**:

```js
const { rowCount } = await db.query(sql, [42, 7]);

if (rowCount === 0) {
  // Someone else updated it first (version is now 8).
  // Our read is stale → retry the whole operation with fresh data.
  throw new ConflictError("Item was updated, please retry");
}
```

That single `AND version = 7` collapses the read-check-write race into **one atomic statement**. Request B's update matches **0 rows** and it knows to retry.

- ✅ **No locks, no blocking** → excellent throughput.
- ✅ Safe across long "think time" (a user editing a form for 10 minutes — you'd never hold a lock that long).
- ❌ Wasted work on conflict (you must retry).
- ❌ Bad under **high** contention — everyone retries, nobody wins (livelock).

> **Use when:** conflicts are **rare** — document editing, user profiles, most CRUD. This is what your ORM's `@Version` annotation does.

---

## Strategy 3: Just make it atomic (the underrated answer)

Often you don't need *either* strategy. Let the database do the read-modify-write in **one statement**:

```sql
-- The database locks the row internally for the duration of this ONE statement
UPDATE products
   SET stock = stock - 1
 WHERE id = 42
   AND stock > 0;        -- 🔑 the condition IS the guard
```

Check `rowCount`: **1** = you got it; **0** = it was out of stock. No race is possible — there is no gap between read and write.

```js
// Redis equivalent — INCR/DECR are atomic
const remaining = await redis.decr("stock:42");
if (remaining < 0) {
  await redis.incr("stock:42");   // put it back
  throw new OutOfStockError();
}
```

> **Try this first.** If a single atomic statement expresses your intent, you don't need locks *or* versions. Most "concurrency bugs" are really "I did a read-modify-write in application code" bugs.

---

## Deadlocks

Two transactions each hold what the other needs. Both wait. Forever.

```
Transaction A            Transaction B
──────────────────────────────────────────
lock row 1  🔒
                         lock row 2  🔒
wants row 2 ⏳           wants row 1 ⏳
        ↑                        ↑
        └──── circular wait ─────┘   💀 DEADLOCK
```

Databases **detect** this and kill one transaction (`deadlock detected`). Your app must be ready to **catch that error and retry**.

### 🔑 The prevention: consistent lock ordering

Deadlock needs a **cycle**. Remove the cycle and it becomes impossible:

```js
// ❌ A locks (1,2); B locks (2,1) → cycle → deadlock
// ✅ EVERYONE locks in ascending id order → no cycle can ever form
const ids = [fromAccount, toAccount].sort((a, b) => a - b);
for (const id of ids) {
  await tx.query("SELECT * FROM accounts WHERE id = $1 FOR UPDATE", [id]);
}
```

**Always acquire locks in a globally consistent order.** This is the single most useful rule in this lesson.

Also:
- **Keep transactions short** — less time holding locks, less chance of overlap.
- **Touch tables in a consistent order** across your codebase.
- **Always be able to retry** — deadlocks can't be fully eliminated, so handle them gracefully.

---

## Lock granularity

| Level | Concurrency | Overhead |
|---|---|---|
| **Row** lock | ✅ High | More locks to track |
| **Page** lock | Medium | Medium |
| **Table** lock | ❌ Terrible | Cheap |

Row-level is the default in Postgres/MySQL(InnoDB) and what you want. But careless DDL takes **table** locks — `ALTER TABLE` on a hot table can freeze your entire application. (Hence `CREATE INDEX CONCURRENTLY` from the deployment lesson.)

**Shared vs Exclusive:**
- **Shared (read)** — many readers can hold it simultaneously.
- **Exclusive (write)** — only one, and it excludes all others.

*(In Postgres, thanks to MVCC, plain readers don't take blocking locks at all — readers never block writers.)*

---

## Distributed locks — and why they're dangerous

Locking a database row is easy: one authority (the DB) arbitrates. But locking across *services*, with no shared database?

```js
// The naive Redis lock
const ok = await redis.set("lock:job", token, { NX: true, EX: 30 });
if (!ok) return;              // someone else holds it
try {
  await doWork();
} finally {
  await redis.del("lock:job");   // ⚠️ see the bug below
}
```

**Two serious bugs lurk here:**

1. **You might delete someone else's lock.** Your process stalls (GC pause, slow disk) for 35 seconds. Your lock **expires at 30s**. Another worker acquires it. Then you wake up and run `DEL` — deleting *their* lock.
   → **Fix:** only delete if the token is still yours, atomically (a Lua script comparing the value first).

2. **The lock expires while you're still working.** Two workers now believe they hold it *simultaneously*. Your "mutual exclusion" is a fiction.
   → There is **no timeout that fixes this.** You cannot distinguish a slow process from a dead one (remember the distributed-systems lesson).

> 🚨 **The uncomfortable truth: a distributed lock cannot guarantee mutual exclusion** in an asynchronous network. Martin Kleppmann's article on this is essential reading.

**So what do you do?**
- **Make the protected operation idempotent anyway.** Then a double-execution is *harmless*, and the lock becomes a performance optimization (avoiding duplicate work) rather than a correctness guarantee. **This is the pragmatic answer.**
- Or use a **fencing token**: the lock hands out a monotonically increasing number, and the downstream resource rejects any write carrying an old token.
- For true correctness, use a system built on consensus (**etcd**, **ZooKeeper**), not a plain Redis key.

---

## Choosing

| Situation | Use |
|---|---|
| Read-modify-write on one row | **Atomic UPDATE with a condition** |
| High contention, must not oversell | **Pessimistic** (`FOR UPDATE`) |
| Low contention, long think-time (form editing) | **Optimistic** (version column) |
| Counters | Atomic `INCR` / `UPDATE … SET x = x + 1` |
| Cross-service coordination | Idempotency **+** a lock — never a lock alone |

## Key takeaways

- The **lost update** race lives in the gap between **read** and **write**. Application-level "care" cannot close it.
- **Pessimistic** (`SELECT … FOR UPDATE`) locks up front — correct, but blocks. **Optimistic** (version column, `WHERE version = 7`) detects conflict at write time and retries — no blocking.
- ✅ **Best of all: a single atomic conditional `UPDATE`** (`WHERE stock > 0`) — no gap, so no race. Try this first.
- **Deadlocks** come from circular waits → **always acquire locks in a consistent order**, keep transactions short, and be ready to retry.
- 🚨 **Distributed locks cannot guarantee mutual exclusion.** Make the operation **idempotent** so a double-run is harmless, and treat the lock as an optimization.
