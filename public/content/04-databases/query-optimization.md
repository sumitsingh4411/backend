# Query Optimization & EXPLAIN

Your app is slow. Almost always, it's **one query**. This lesson teaches you to *find* it and *fix* it, instead of guessing.

> **Rule zero: never optimize without measuring.** The bottleneck is essentially never where you assume it is.

## EXPLAIN: ask the database what it's doing

`EXPLAIN` shows the **query plan** — the strategy the DB will use. `EXPLAIN ANALYZE` actually *runs* it and shows real timings.

```sql
EXPLAIN ANALYZE
SELECT * FROM orders WHERE user_id = 42;
```

```text
Seq Scan on orders  (cost=0.00..18584.00 rows=12 width=52)
                    (actual time=0.031..142.882 rows=12 loops=1)
  Filter: (user_id = 42)
  Rows Removed by Filter: 999988          ← 🚨 read a million rows to return 12
Execution Time: 142.9 ms
```

Read it **bottom-up, inside-out**. The story here is damning: it scanned a million rows and threw away 999,988 of them.

Add the index:

```sql
CREATE INDEX idx_orders_user_id ON orders(user_id);
```

```text
Index Scan using idx_orders_user_id on orders  (actual time=0.021..0.043 rows=12 loops=1)
  Index Cond: (user_id = 42)
Execution Time: 0.06 ms          ← 2,300× faster. One line of SQL.
```

## The scan types (what you're looking for)

| Plan node | Meaning | Verdict |
|---|---|---|
| **Seq Scan** | Reads every row | 🚨 Bad on a big table — usually a missing index |
| **Index Scan** | Seeks the index, fetches rows | ✅ Good |
| **Index Only Scan** | Answered *entirely* from the index | ✅✅ Best |
| **Bitmap Heap Scan** | Index → collect many rows | 👍 Fine for medium selectivity |
| **Nested Loop** | For each row in A, look up B | ✅ Good if A is small; 🚨 disaster if A is huge |
| **Hash Join** | Build a hash of one side | ✅ Good for big joins |

> A Seq Scan isn't *always* bad! On a small table, or when you're reading most of the rows anyway, it's the *right* choice. Context matters.

## The numbers that matter

- **`rows` estimated vs `actual`** — if the planner guesses 10 and reality is 500,000, it picked the wrong strategy. Fix with `ANALYZE table_name` (refreshes statistics).
- **`Rows Removed by Filter`** — high means you're reading and discarding. Index the filter column.
- **`loops=N`** — a nested node running 10,000 times. **This is often an N+1 in disguise.**
- **`actual time`** — where the milliseconds truly go.

## The killers (and their fixes)

### 1. The N+1 query — the #1 backend performance bug

```js
// ❌ 1 + 100 = 101 round trips
const users = await db.users.findAll();               // 1 query
for (const u of users) {
  u.orders = await db.orders.findByUser(u.id);        // 100 queries!
}
```

Each query might be only 2ms — but 101 × (2ms + network) ≈ **half a second**. Fix it with **one** query:

```js
// ✅ 1 query
const users = await db.query(`
  SELECT u.*, o.* FROM users u
  LEFT JOIN orders o ON o.user_id = u.id
`);
// or with an ORM: include / preload / JOIN FETCH
```

**Detection:** log your queries in dev. If a page fires 100 near-identical queries, you found it.

### 2. Functions on indexed columns

```sql
-- ❌ The index on `email` is USELESS here
SELECT * FROM users WHERE LOWER(email) = 'ada@x.com';
```

The index stores raw `email` values — sorted by the *original* string. Wrap the column in a function and the DB can no longer seek; it must compute `LOWER()` for every row. **Same trap:** `WHERE DATE(created_at) = '2026-07-12'`.

```sql
-- ✅ Option A: index the expression itself
CREATE INDEX idx_users_email_lower ON users (LOWER(email));

-- ✅ Option B: keep the column bare, transform the *input*
SELECT * FROM users WHERE email = 'ada@x.com';       -- store emails lowercased
SELECT * FROM orders                                  -- range instead of DATE()
 WHERE created_at >= '2026-07-12' AND created_at < '2026-07-13';
```

> **Rule: keep the indexed column naked on the left side of the comparison.**

### 3. `SELECT *`

Fetching 30 columns when you need 2 wastes I/O and network — and it **prevents an Index Only Scan**, which could have answered the query without touching the table at all.

```sql
-- ✅ With an index on (user_id, status), this never touches the table
SELECT user_id, status FROM orders WHERE user_id = 42;
```

### 4. Leading wildcards

```sql
WHERE name LIKE '%smith'   -- ❌ index unusable (can't seek without a prefix)
WHERE name LIKE 'smith%'   -- ✅ index works fine
```

For real text search, use a proper **full-text index** (`tsvector` in Postgres), not `LIKE '%…%'`.

### 5. Deep `OFFSET`

`OFFSET 100000` makes the DB walk and discard 100,000 rows. Use **cursor pagination** instead (see *API Design*).

## Find the slow query in production

Don't hunt blindly — make the database tell you:

```sql
-- Postgres: the top 10 queries by total time consumed
SELECT
  substring(query, 1, 60) AS q,
  calls,
  round(mean_exec_time::numeric, 2) AS avg_ms,
  round(total_exec_time::numeric, 2) AS total_ms
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

> Sort by **total time**, not average. A 5ms query called 2 million times is a far bigger problem than a 3-second report run once a day.

Also enable slow-query logging:

```sql
ALTER SYSTEM SET log_min_duration_statement = 200;  -- log anything over 200ms
```

## The optimization ladder

1. **Measure** — `pg_stat_statements`, slow logs, APM. Find the *actual* offender.
2. **EXPLAIN ANALYZE** it. Look for Seq Scans, bad row estimates, high `loops`.
3. **Add the missing index.** (This solves the majority of cases, for free.)
4. **Rewrite the query** — kill the N+1, drop `SELECT *`, unwrap functions from columns.
5. **Cache** the result if it's read-heavy and stable.
6. **Then** consider replicas, bigger hardware, denormalization.

Most engineers jump to step 6. The wins are almost always at steps 3 and 4.

## Key takeaways

- **`EXPLAIN ANALYZE` is your microscope.** Seq Scan on a big table + high "Rows Removed by Filter" = missing index.
- The **N+1 query** is the most common backend performance bug — one JOIN replaces 100 queries.
- **Never wrap an indexed column in a function** (`LOWER(email)`, `DATE(created_at)`) — it disables the index. Keep the column naked.
- Avoid `SELECT *`, leading `%` wildcards, and deep `OFFSET`.
- Find the real offender with **`pg_stat_statements`**, sorted by **total** time. Index and rewrite before you scale hardware.
