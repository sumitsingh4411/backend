# Queries & Joins

Storing data is half the job; **retrieving exactly what you need** is the other half. SQL is a small, powerful language for asking questions of your data.

## CRUD in SQL

The four basic operations map to four statements:

```sql
-- Create
INSERT INTO users (email, name) VALUES ('ada@x.com', 'Ada');

-- Read
SELECT id, name FROM users WHERE email = 'ada@x.com';

-- Update
UPDATE users SET name = 'Ada L.' WHERE id = 1;

-- Delete
DELETE FROM users WHERE id = 1;
```

## Shaping a SELECT

```sql
SELECT name, total
FROM orders
WHERE total > 50            -- filter rows
ORDER BY total DESC         -- sort
LIMIT 10;                   -- paginate
```

Common clauses: `WHERE` (filter), `ORDER BY` (sort), `LIMIT`/`OFFSET` (page), `GROUP BY` + aggregates (`COUNT`, `SUM`, `AVG`).

## Joins: combining related tables

Because normalized data is split across tables, you **join** them back together on a shared key.

```sql
-- Every order with its user's name
SELECT o.id, u.name, o.total
FROM orders o
JOIN users u ON u.id = o.user_id;
```

### Join types (know these)

- **INNER JOIN** — only rows that match in *both* tables.
- **LEFT JOIN** — all rows from the left table, plus matches (NULLs where none). "All users, even those with no orders."
- **RIGHT JOIN** — the mirror of LEFT.
- **FULL JOIN** — everything from both sides.

```sql
-- Users and how many orders each has (including zero)
SELECT u.name, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.name;
```

## The N+1 problem (a classic trap)

Fetching a list, then looping to fetch each item's relation, fires **1 + N** queries:

```
❌ 1 query for 100 users, then 100 queries for their orders = 101 round trips
✅ 1 query with a JOIN (or a single "WHERE user_id IN (...)") 
```

This is the #1 performance bug beginners ship. Watch for loops that query the database.

## Always parameterize

Never build SQL by string-concatenating user input — that's **SQL injection**. Use parameters:

```js
// ✅ parameterized — the driver escapes input safely
db.query("SELECT * FROM users WHERE email = $1", [email]);
// ❌ never: `SELECT * FROM users WHERE email = '${email}'`
```

## Key takeaways

- CRUD = `INSERT` / `SELECT` / `UPDATE` / `DELETE`.
- Shape reads with `WHERE`, `ORDER BY`, `LIMIT`, `GROUP BY`.
- **JOINs** recombine normalized tables; know INNER vs LEFT.
- Avoid the **N+1** query trap; always **parameterize** to prevent injection.
