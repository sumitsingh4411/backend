# Transactions & ACID

Some operations must happen **completely or not at all**. Transferring money is the classic case: deduct from A *and* add to B. If the server crashes in between, you must never end up with money vanishing.

A **transaction** groups multiple statements into one all-or-nothing unit.

```sql
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;  -- take from A
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;  -- give to B
COMMIT;   -- both applied together

-- If anything fails:
ROLLBACK; -- neither is applied. The world is unchanged.
```

## ACID — the four guarantees

**A — Atomicity.** All-or-nothing. The transaction fully commits or fully rolls back. Never half-applied.

**C — Consistency.** The database moves from one valid state to another; constraints (foreign keys, uniqueness, checks) are never violated.

**I — Isolation.** Concurrent transactions don't step on each other. It's *as if* they ran one at a time.

**D — Durability.** Once committed, it survives a crash or power loss — it's written to disk, not just memory.

## Isolation is the subtle one

When transactions run at the same time, things can go wrong. Databases offer **isolation levels** trading safety for speed:

| Level | Prevents |
|---|---|
| Read Uncommitted | (almost nothing — avoid) |
| Read Committed | dirty reads *(common default)* |
| Repeatable Read | + non-repeatable reads |
| Serializable | + phantom reads (strictest, slowest) |

Classic anomalies:
- **Dirty read** — you read another transaction's uncommitted change.
- **Non-repeatable read** — you read the same row twice and get different values.
- **Phantom read** — a re-run query returns new rows that appeared meanwhile.

## The race condition you'll actually hit

```
Two requests both read stock = 1, both decide "in stock", both sell it.
→ You just sold the last item twice.
```

Fix it with a transaction plus **row locking** (`SELECT ... FOR UPDATE`) or an atomic conditional update:

```sql
-- Atomic: only succeeds if stock is still > 0
UPDATE products SET stock = stock - 1
WHERE id = 42 AND stock > 0;
-- Check "rows affected" — if 0, it was out of stock.
```

## In code

```js
// JavaScript (node-postgres)
await client.query("BEGIN");
try {
  await client.query("UPDATE accounts SET balance = balance - $1 WHERE id=$2", [100, 1]);
  await client.query("UPDATE accounts SET balance = balance + $1 WHERE id=$2", [100, 2]);
  await client.query("COMMIT");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
}
```

```python
# Python (SQLAlchemy) — context manager commits or rolls back
with session.begin():
    a.balance -= 100
    b.balance += 100
```

```java
// Java (Spring) — declarative
@Transactional
public void transfer(long from, long to, BigDecimal amt) {
    accounts.debit(from, amt);
    accounts.credit(to, amt);   // any exception → automatic rollback
}
```

## Key takeaways

- A **transaction** = all-or-nothing group of statements (`BEGIN`…`COMMIT`/`ROLLBACK`).
- **ACID**: Atomicity, Consistency, Isolation, Durability.
- **Isolation levels** trade correctness for concurrency; know dirty/non-repeatable/phantom reads.
- Use transactions + locking (or atomic updates) to kill race conditions.
