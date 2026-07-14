<div align="center">

<sub>[← BackendPath](../README.md)</sub>

# 🗄️ Part 4 · Databases

**Modelling, indexes, EXPLAIN, transactions, race conditions.**

<sub>`8 min read`</sub>

</div>

---

### In this part

- [4.0 Which database?](#40-which-database)
- [4.1 Indexes — the single biggest win](#41-indexes--the-single-biggest-win)
- [4.2 Reading an EXPLAIN plan](#42-reading-an-explain-plan)
- [4.3 The N+1 query — the most common bug in backend code](#43-the-n1-query--the-most-common-bug-in-backend-code)
- [4.4 Transactions and ACID](#44-transactions-and-acid)
- [4.5 🚨 The lost update — a race condition you WILL write](#45--the-lost-update--a-race-condition-you-will-write)
- [4.6 Isolation levels](#46-isolation-levels)
- [4.7 🚨 Connection pooling — the one that takes down production](#47--connection-pooling--the-one-that-takes-down-production)
- [4.8 Scaling — in this exact order](#48-scaling--in-this-exact-order)

---

**This is the part that matters most.** Most "our app is slow" tickets end here.

## 4.0 Which database?

> **Start with PostgreSQL.** Unless you have a specific, *measured* reason not to.

You get transactions, joins, constraints, JSONB when you want schemaless, full-text search, geospatial — and it scales far past where most products ever get. A single well-indexed Postgres box comfortably serves thousands of requests per second.

"We'll need to scale, so let's use NoSQL" is a decision about a problem you don't have, and it costs you **correctness today**.

| Store | Reach for it when |
|---|---|
| **PostgreSQL** | almost always — the default |
| **Redis** | cache, rate limits, sessions, queues, leaderboards |
| **MongoDB** | records genuinely differ in shape, and you never join |
| **Cassandra / DynamoDB** | huge write volume, one known query pattern |
| **Elasticsearch** | search — **never** as your source of truth |
| **ClickHouse** | analytics over billions of rows |

The real question is never "SQL or NoSQL?" It's **"what is my access pattern?"** How you *read* the data decides the store.

## 4.1 Indexes — the single biggest win

An index is a **sorted lookup structure**. Like the index at the back of a book: you don't read all 900 pages to find "mitochondria".

- **Without an index:** find `email = 'a@b.com'` → read **every row** (a *sequential scan*).
- **With a B-tree index:** walk a shallow tree. **10 million rows ≈ 3–4 hops.**

That's the difference between **800ms and 0.2ms**.

**The cost:** every `INSERT`/`UPDATE`/`DELETE` must update *every* index on the table. Indexes trade **write speed for read speed**. They are never free.

### What to index

| Index this | Why |
|---|---|
| **Foreign keys** | Postgres does **not** do it for you, and every join needs it |
| **Selective `WHERE` columns** | an index on `is_active` where 95% are active is **useless** — the planner will ignore it, correctly |
| **`ORDER BY` + `LIMIT` columns** | the index returns rows *already sorted* — turns "sort 2M rows, keep 20" into "read 20 rows" |

### Composite indexes and the leftmost-prefix rule

```sql
CREATE INDEX ON orders (tenant_id, created_at DESC);
```

This index serves:
- ✅ `WHERE tenant_id = ?`
- ✅ `WHERE tenant_id = ? ORDER BY created_at`
- ❌ `WHERE created_at > ?` **on its own** — it can't. The index is sorted by `tenant_id` *first*.

**Column order is the whole game.** Think of a phone book sorted by (last name, first name): brilliant for "find Smith", useless for "find everyone called John".

## 4.2 Reading an EXPLAIN plan

Stop guessing. **Ask the database what it's doing.**

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE user_id = 42 ORDER BY created_at DESC LIMIT 20;
```

```diff
- ❌ BEFORE
  Limit  (actual time=142.318..142.325 rows=20)
    ->  Sort
          ->  Seq Scan on orders                  ← read the WHOLE table
                Filter: (user_id = 42)
                Rows Removed by Filter: 1988688   ← threw away 2 MILLION rows 😱
  Execution Time: 142.401 ms
```

```sql
CREATE INDEX ON orders (user_id, created_at DESC);
```

```diff
+ ✅ AFTER
  Limit  (actual time=0.031..0.038 rows=20)
    ->  Index Scan using orders_user_id_created_at_idx on orders
          Index Cond: (user_id = 42)              ← walked straight to them
  Execution Time: 0.061 ms                        ← 2,300× faster
```

| You see | It means |
|---|---|
| **`Seq Scan`** on a big table | 🚨 no usable index — **this is your bug** |
| `Index Scan` | ✅ what you want |
| `Index Only Scan` | ✅✅ answered from the index; never touched the table |
| `Rows Removed by Filter: <huge>` | 🚨 you read rows just to throw them away |
| `actual rows` ≫ `estimated rows` | stale statistics — run `ANALYZE` |

### Finding *which* query is slow

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT substring(query, 1, 60), calls,
       round(mean_exec_time::numeric, 2) AS avg_ms,
       round(total_exec_time::numeric)   AS total_ms
FROM pg_stat_statements
ORDER BY total_exec_time DESC     -- ← TOTAL, not average
LIMIT 10;
```

> **Sort by total time, not average.** A 2-second report run once a day is *not* your problem. A **40ms query called 200,000 times an hour** is — that's 2.2 hours of database CPU per hour. The average hides it. The total exposes it.

## 4.3 The N+1 query — the most common bug in backend code

```js
// ❌ 1 + N queries. You have written this.
const posts = await db.posts.findAll();        // 1 query
for (const p of posts) {                       // + 100 queries
  p.author = await db.users.find(p.userId);
}
// 101 round trips × 1ms = 101ms of pure waiting
```

```sql
-- ✅ 1 query
SELECT * FROM posts JOIN users ON users.id = posts.user_id;
```

Your ORM does this **silently** every time you touch a lazy relation inside a loop. The fix is `include` / `joinedload` / `preload`, or a **DataLoader** that batches the ids into one `WHERE id = ANY($1)`.

> Turn on SQL logging in dev for one afternoon. You will find several. Everyone does.

## 4.4 Transactions and ACID

A transaction is **all or nothing**.

```sql
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;   -- both happen, or neither. Never just the first one.
```

- **A**tomic — all or nothing
- **C**onsistent — constraints always hold
- **I**solated — concurrent transactions don't see each other's half-finished work
- **D**urable — once committed, it survives a crash (this is what the *write-ahead log* is for)

## 4.5 🚨 The lost update — a race condition you WILL write

```
Two requests spend from the same wallet (balance = 100):

  T1: SELECT balance → 100      ┐
  T2: SELECT balance → 100      │  both read the same value
  T1: UPDATE balance = 100 - 60 │
  T2: UPDATE balance = 100 - 80 ┘  last writer wins

  Final balance = 20.
  You just paid out 140 from a wallet holding 100.
```

Your code was "correct". Your test passed. It only breaks under concurrency — which is to say, in production.

**Three correct fixes, best first:**

```sql
-- 1) ATOMIC UPDATE — the database does read+write as ONE indivisible step.
UPDATE wallets SET balance = balance - 60
 WHERE id = 1 AND balance >= 60;
-- 0 rows updated → insufficient funds. No race. No locks to manage.

-- 2) PESSIMISTIC LOCK — when you must read, think, then write.
BEGIN;
  SELECT balance FROM wallets WHERE id = 1 FOR UPDATE;  -- others WAIT here
  -- ... your logic ...
  UPDATE wallets SET balance = balance - 60 WHERE id = 1;
COMMIT;

-- 3) OPTIMISTIC LOCK — when conflicts are rare.
UPDATE wallets SET balance = 40, version = version + 1
 WHERE id = 1 AND version = 7;
-- 0 rows updated → someone beat you → re-read and retry.
```

## 4.6 Isolation levels

| Level | Still lets through | Use for |
|---|---|---|
| Read uncommitted | dirty reads | nothing. ever. |
| **Read committed** *(default)* | non-repeatable reads, phantoms | 99% of queries |
| Repeatable read | phantoms / write skew | self-consistent reports |
| **Serializable** | nothing — but **expect retries** | money, inventory, bookings |

Under `SERIALIZABLE`, Postgres may **abort** your transaction. That's not a bug — that's the guarantee working. **Your code must retry it.**

## 4.7 🚨 Connection pooling — the one that takes down production

**Postgres connections are processes, not threads.** Each costs ~5–10MB. Postgres tops out around 100–500 of them.

Now do the maths nobody does until the incident:

```
Your app runs 20 instances × a pool of 20 connections each
                = 400 connections the moment traffic spikes
                = refused connections
                = failed health checks
                = instances restart
                = the restart storm makes it worse
```

> **Your real pool size is `pool × instances`.** Do that multiplication *before* you deploy.

**Fixes:** put **PgBouncer** (transaction mode) in front — hundreds of app connections multiplex onto a few dozen real ones. And note the rule of thumb: `connections ≈ (2 × cores)`. On most boxes that's **10–30**, not 300. **More connections past that point makes throughput *worse*, not better.**

## 4.8 Scaling — in this exact order

| # | Do this | Cost |
|:--|---|---|
| 1 | **Add the index** | free, instant, usually the whole answer |
| 2 | **Fix the N+1s** | free, often bigger than the index |
| 3 | **Cache the hot reads** | cheap — but you now own invalidation |
| 4 | **Read replicas** | scales reads; costs you replication lag |
| 5 | **Partition big tables** | one machine still; drop old data instantly |
| 6 | **Shard** | scales writes; costs you cross-shard joins and your weekends |

**Almost nobody needs step 6.** Sharding first is the most expensive mistake in this document.

> ### 🚨 Replica lag: "I saved my profile and it didn't save"
>
> The user writes (→ primary), you redirect, the read hits a **replica 200ms behind**, and they see the **old** name. So they save again.
>
> **Fix:** after a user writes, route *their* reads to the primary for a few seconds. Replicas are for *other people's* data.

---

<div align="center">

[← 🔌 Part 3 · APIs](03-apis.md) · [**Contents**](../README.md#contents) · [🔐 Part 5 · Security →](05-security.md)

<sub><a href="#top">↑ back to top</a></sub>

</div>
