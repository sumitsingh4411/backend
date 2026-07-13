# Indexes

An **index** is the single biggest lever you have on query speed. Understanding them turns a 4-second query into a 4-millisecond one.

## The problem: full table scans

Without an index, finding a row means checking **every row** in the table:

```sql
SELECT * FROM users WHERE email = 'ada@x.com';
-- With 10 million rows and no index → the DB reads all 10 million. Slow.
```

## The fix: an index

An index is a **sorted lookup structure** (usually a B-tree) that maps a column's values to the rows containing them. Instead of scanning everything, the database jumps straight to the answer.

> **Analogy:** The index at the back of a textbook. Without it, you read all 900 pages to find "TCP." With it, you look up "TCP → p. 412" instantly.

```sql
CREATE INDEX idx_users_email ON users(email);
-- Now the same query is near-instant.
```

## What to index

- Columns in **`WHERE`** clauses (`email`, `status`).
- **Foreign keys** used in `JOIN`s (`orders.user_id`) — very commonly missed!
- Columns you **`ORDER BY`** frequently.
- Primary keys are indexed automatically.

## The trade-off (this is the key insight)

Indexes are **not free**:

| | Effect |
|---|---|
| Reads | ✅ Much faster |
| Writes (INSERT/UPDATE/DELETE) | ❌ Slower — every index must be updated too |
| Storage | ❌ More disk used |

So: **index what you query, not everything.** A table with 15 indexes will have painfully slow writes.

## Composite indexes and column order

An index on multiple columns is a **composite** index — and **order matters**:

```sql
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at);
```

This helps `WHERE user_id = ?`, and `WHERE user_id = ? ORDER BY created_at`. It does **not** efficiently help a query on `created_at` alone — think of it like sorting by last name, then first name: you can't jump to a first name without the last name.

## Prove it with EXPLAIN

Never guess — ask the database what it's doing:

```sql
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'ada@x.com';
-- Look for "Index Scan" (good) vs "Seq Scan" (a full scan — likely missing an index)
```

## Key takeaways

- An index turns a **full table scan** into a fast lookup.
- Index columns used in `WHERE`, `JOIN` (foreign keys!), and `ORDER BY`.
- Trade-off: **faster reads, slower writes, more storage** — don't index everything.
- Composite index **column order matters**; use `EXPLAIN` to verify.
