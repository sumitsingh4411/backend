# SQL vs NoSQL

A database is where your data lives *durably* — surviving restarts, crashes, and deploys. The first big decision is the **type** of database. It splits into two families.

## SQL (relational) databases

Data lives in **tables** with rows and columns and a fixed **schema**. Tables relate to each other via keys. You query with **SQL**.

> Examples: PostgreSQL, MySQL, SQLite, SQL Server.

```sql
-- Structured, related, queryable
SELECT u.name, COUNT(o.id) AS orders
FROM users u
JOIN orders o ON o.user_id = u.id
GROUP BY u.name;
```

**Strengths:** strong consistency, powerful queries/joins, enforced structure, transactions (ACID). **The safe default for most apps.**

## NoSQL databases

An umbrella for non-relational stores, each optimized for a shape of data:

- **Document** (MongoDB) — flexible JSON-like documents. Great when structure varies.
- **Key-value** (Redis, DynamoDB) — blazing-fast lookups by key. Great for caching/sessions.
- **Wide-column** (Cassandra) — massive write-heavy scale.
- **Graph** (Neo4j) — data that's all about relationships (social networks).

```js
// Document store — no fixed schema, nested data
db.users.insertOne({
  name: "Ada",
  roles: ["admin"],
  address: { city: "London" }   // nested, flexible
});
```

**Strengths:** flexible schema, horizontal scaling, high throughput for specific patterns.

## How to choose

| Prefer SQL when… | Prefer NoSQL when… |
|---|---|
| Data is structured & related | Schema varies or evolves fast |
| Consistency is critical (money) | Extreme scale / throughput needed |
| You need complex queries/joins | Access is simple key lookups |
| You're not sure (great default) | You have a specific proven pattern |

## The honest truth

**Start with a relational database (PostgreSQL) unless you have a concrete reason not to.** It handles the vast majority of apps, and modern Postgres even stores JSON when you need flexibility. Reach for NoSQL to solve a *specific* problem (caching → Redis, huge write volume → Cassandra), often *alongside* SQL, not instead of it.

## Key takeaways

- **SQL** = structured tables, relationships, strong consistency, rich queries — the default.
- **NoSQL** = a family (document, key-value, wide-column, graph) each tuned for a pattern.
- Choose by data shape, consistency needs, and scale — not fashion.
- Most systems use SQL as the source of truth plus NoSQL for specific jobs.
