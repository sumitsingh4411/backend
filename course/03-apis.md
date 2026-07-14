<div align="center">

<sub>[← BackendPath](../README.md)</sub>

# 🔌 Part 3 · APIs

**Designing a contract other people build on.**

<sub>`4 min read`</sub>

</div>

---

### In this part

- [3.1 REST that doesn't fight you](#31-rest-that-doesnt-fight-you)
- [3.2 🚨 Never return an unbounded list](#32--never-return-an-unbounded-list)
- [3.3 🚨 Idempotency keys — how you stop double charges](#33--idempotency-keys--how-you-stop-double-charges)
- [3.4 Errors people can act on](#34-errors-people-can-act-on)
- [3.5 Versioning — you cannot un-ship a field](#35-versioning--you-cannot-un-ship-a-field)
- [3.6 CORS — what it actually is](#36-cors--what-it-actually-is)
- [3.7 REST vs GraphQL vs gRPC](#37-rest-vs-graphql-vs-grpc)

---

## 3.1 REST that doesn't fight you

Resources are **nouns**. HTTP methods are the **verbs**.

```diff
+ GET    /users          list
+ POST   /users          create
+ GET    /users/42       read one
+ PATCH  /users/42       update
+ DELETE /users/42       delete
+ GET    /users/42/orders   a sub-resource

- POST /getUser              ← the verb is already GET
- POST /createUserV2
- POST /updateUserEmailNow
- GET  /getAllOrdersForUser?id=42
```

Plural nouns. Lowercase, hyphenated paths. **Nest one level deep, maximum** — `/users/42/orders/7/items/3` is a URL nobody can maintain.

## 3.2 🚨 Never return an unbounded list

`GET /users` with no limit works beautifully with 50 users in dev, and **takes the database down** the day a customer has 400,000.

**Every collection endpoint has a default limit and a maximum limit.** From day one. No exceptions.

Then: **use cursor pagination, not offset.**

```sql
-- ❌ OFFSET: the database must WALK AND DISCARD 100,000 rows to get to page 5001
SELECT * FROM posts ORDER BY created_at DESC LIMIT 20 OFFSET 100000;

-- ✅ CURSOR ("keyset"): jumps straight there via the index
SELECT * FROM posts
 WHERE (created_at, id) < ($1, $2)     -- the cursor from the last page
 ORDER BY created_at DESC, id DESC
 LIMIT 20;
-- Same speed on page 1 and page 50,000.
```

Offset also has a **correctness** bug, not just a speed one: if someone inserts a row while the user is paging, every row shifts down — and page 2 shows an item they already saw on page 1. A cursor is anchored to a *row*, so it can't skip or duplicate.

## 3.3 🚨 Idempotency keys — how you stop double charges

This is the bug, and it is **not** the one you think:

```
Client → POST /payments  ────────────►  Server charges the card ✅
Client ✗ connection drops  ◄───────✗    (response never arrives)

The client has NO WAY to know whether it worked.
So it retries. The customer is charged TWICE.
```

The request wasn't lost. **The response was.** You cannot fix this with retries — you fix it by making the operation safe to repeat:

```js
// The client generates a UUID and sends the SAME key on every retry:
//   POST /payments    Idempotency-Key: 4f8c...e21

app.post("/payments", async (req, res) => {
  const key = req.header("Idempotency-Key");
  if (!key) return res.status(400).json({ error: "Idempotency-Key required" });

  const existing = await db.idempotency.find(key);
  if (existing) return res.status(existing.status).json(existing.response); // replay!

  const result = await charge(req.body);
  await db.idempotency.insert({ key, status: 201, response: result });
  res.status(201).json(result);
});
```

Store the key **and the response**, so a retry replays the original result instead of doing the work again. A `UNIQUE` constraint on the key column is what makes it a real guarantee rather than a hope. This is exactly how Stripe works.

## 3.4 Errors people can act on

```jsonc
// ✅
{
  "error": {
    "type": "validation_error",
    "message": "Email is already registered.",
    "fields": { "email": "already_taken" },
    "request_id": "req_01HZX9"        // ← the highest-leverage field in your API
  }
}

// ❌ useless
{ "error": "Something went wrong" }

// ❌ useless AND a security leak
{ "error": "PG::UniqueViolation: duplicate key violates users_email_key at /app/db/users.rb:42" }
```

> **`request_id` is worth more than any other field.** Put the same id in the response body, a response header, and **every log line** for that request. Now a user pastes `req_01HZX9` into a support ticket and you find that exact request across five services in one search. Without it, debugging is archaeology.

## 3.5 Versioning — you cannot un-ship a field

Web clients update when you deploy. **Mobile apps don't.** Someone's 2021 build is still calling you and always will be.

| Change | Breaking? |
|---|:--|
| Add an **optional** response field | ✅ safe |
| Add a new endpoint | ✅ safe |
| **Remove or rename** a field | ❌ **breaks** |
| Change a type (`string` → `number`) | ❌ **breaks** |
| Make an optional param required | ❌ **breaks** |
| Change a default value | ❌ **breaks** (silently!) |

Start with **URL versioning** (`/v1/users`) — ugly, obvious, easy to operate. Better still: **only ever make additive changes**, and you never need v2. That discipline is how Stripe has run one API for a decade.

## 3.6 CORS — what it actually is

> **CORS is a browser rule. It is not a security feature of your API.**

The same-origin policy stops JavaScript on `evil.com` from *reading* a response from `your-api.com`. CORS headers are how your server says "this origin may read me."

It is enforced **by the browser, for browsers**. `curl`, Postman, a Go service, and an attacker's script **ignore it completely**.

So CORS protects your **users**. It does nothing to protect your **API**. **Auth protects your API.** People confuse these two constantly.

## 3.7 REST vs GraphQL vs gRPC

| | REST | GraphQL | gRPC |
|---|---|---|---|
| **Best for** | public APIs, CRUD | many clients, varied data shapes | service-to-service |
| **Transport** | HTTP/JSON | HTTP/JSON | HTTP/2 + protobuf (binary) |
| **Caching** | **free** (HTTP) | you build it | you build it |
| **Browser** | native | native | needs a proxy |

> **GraphQL's hidden cost:** every field is a resolver, so **N+1 queries are the default**. You need **DataLoader** from day one, plus depth and cost limits — otherwise one malicious query melts your database.

---

<div align="center">

[← 🖥️ Part 2 · Servers & concurrency](02-servers-and-concurrency.md) · [**Contents**](../README.md#contents) · [🗄️ Part 4 · Databases →](04-databases.md)

<sub><a href="#top">↑ back to top</a></sub>

</div>
