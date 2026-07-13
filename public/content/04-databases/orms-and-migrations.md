# ORMs & Migrations

Two practical tools you'll use every day: **ORMs** (talk to the DB in your language) and **migrations** (evolve the schema safely).

## ORMs: objects instead of SQL strings

An **ORM** (Object-Relational Mapper) maps database rows to objects in your language, so you write code instead of raw SQL.

```js
// JavaScript (Prisma)
const user = await prisma.user.findUnique({
  where: { email: "ada@x.com" },
  include: { orders: true },      // JOIN handled for you
});
```

```python
# Python (SQLAlchemy)
user = session.query(User).filter_by(email="ada@x.com").first()
```

```go
// Go (GORM)
var user User
db.Preload("Orders").Where("email = ?", "ada@x.com").First(&user)
```

```java
// Java (JPA / Hibernate)
User user = repository.findByEmail("ada@x.com");
```

**Pros:** less boilerplate, type safety, automatic parameterization (kills SQL injection), portable across databases.

**Cons:** it hides the SQL. That's fine — until it generates something horrible.

## The ORM traps

- **N+1 queries** — looping over results and lazily loading a relation fires a query per row. Use eager loading (`include`, `Preload`, `JOIN FETCH`).
- **Over-fetching** — `SELECT *` when you needed two columns.
- **Losing touch with SQL** — you still must understand the query it generates. Log it. Read it. `EXPLAIN` it.

> **Rule:** Use an ORM for the 90% of ordinary queries. Drop to raw SQL for the 10% that are performance-critical or genuinely complex. Both are fine — a good ORM lets you.

## Migrations: version control for your schema

Your schema will change — new column, new table, new index. You can't just edit the production database by hand: every environment (local, staging, prod) and every teammate must end up with the *same* schema.

A **migration** is a versioned, ordered script that changes the schema. Tools run them in sequence and record which have been applied.

```sql
-- migrations/003_add_phone_to_users.sql
ALTER TABLE users ADD COLUMN phone TEXT;
```

```bash
# Typical workflow
npx prisma migrate dev --name add_phone   # generate from schema change
npx prisma migrate deploy                 # apply pending migrations in prod
```

## Migration rules that save you

- **Always forward.** Write a new migration to fix a mistake; never edit an applied one.
- **Commit them to git** — they're code, and the ordering matters.
- **Make them backward-compatible during deploys.** Adding a nullable column is safe; dropping a column the running code still reads will break it. Do it in two steps: deploy code that stops using it → then drop it.
- **Never hand-edit production.** It will drift and you'll be debugging ghosts.

## Key takeaways

- An **ORM** maps rows ↔ objects: less boilerplate, safe parameterization — but watch **N+1** and know the SQL it emits.
- Use the ORM for the common path; raw SQL when it matters.
- **Migrations** are versioned schema changes committed to git and applied in order.
- Migrate forward-only, and make schema changes deploy-safe.
