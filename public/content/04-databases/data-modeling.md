# Data Modeling & Normalization

Before writing a single query, you design *how your data is shaped* — the tables, their columns, and how they relate. Good modeling prevents a whole category of future bugs. This is one of the highest-leverage skills in backend.

## Tables, columns, keys

- **Table** — a collection of one kind of thing (`users`, `orders`).
- **Column** — an attribute (`email`, `created_at`) with a type.
- **Primary key** — a column that uniquely identifies each row (usually `id`).
- **Foreign key** — a column pointing to another table's primary key (a relationship).

```sql
CREATE TABLE users (
  id    SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name  TEXT NOT NULL
);

CREATE TABLE orders (
  id       SERIAL PRIMARY KEY,
  user_id  INTEGER NOT NULL REFERENCES users(id),  -- foreign key
  total    NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Relationships

- **One-to-many** — one user has many orders. (FK on the "many" side: `orders.user_id`.)
- **Many-to-many** — students ↔ courses. Needs a **join table** (`enrollments` with `student_id` + `course_id`).
- **One-to-one** — a user has one profile. (FK with a UNIQUE constraint.)

## Normalization: store each fact once

**Normalization** organizes data so every fact lives in exactly one place. The enemy is **duplication**, which leads to **update anomalies**.

❌ Denormalized — the user's name is copied into every order:

| order_id | user_name | total |
|---|---|---|
| 1 | Ada Lovelace | 79 |
| 2 | Ada Lovelace | 40 |

If Ada changes her name, you must update *every* row — miss one and your data lies.

✅ Normalized — store the name once in `users`, reference it by `user_id`:

```
users:  (1, "Ada Lovelace")
orders: (1, user_id=1, 79), (2, user_id=1, 40)
```

Now her name lives in one row. Change it once, everywhere is correct.

## When to denormalize (on purpose)

Normalization is the default, but sometimes you *deliberately* duplicate data for **read speed** — e.g. storing an `order_count` on the user so you don't recount every time. That's a conscious trade-off (faster reads, more care on writes), not an accident.

## Key takeaways

- Model data as **tables + columns**, linked by **primary/foreign keys**.
- Know the three relationship types; many-to-many needs a **join table**.
- **Normalize** so each fact lives once — prevents update anomalies.
- **Denormalize deliberately** only to optimize specific reads.
