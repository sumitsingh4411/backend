<div align="center">

# ⚡ BackendPath

### Learn backend engineering, from zero to system design — right here.

**You don't need to go anywhere else. The whole course is on this page.**

Every concept is language-agnostic. Every trap is one that takes down real production systems.

<br />

![React](https://img.shields.io/badge/Read%20time-~90%20min-6366f1?style=for-the-badge)
![Level](https://img.shields.io/badge/Level-Beginner%20→%20Pro-10b981?style=for-the-badge)
![Prereqs](https://img.shields.io/badge/Prerequisites-none-64748b?style=for-the-badge)

</div>

---

## How to use this page

Read it **top to bottom once**, even the parts that feel too advanced — you'll understand the shape of the thing. Then come back and use it as a **reference**.

If you only have 20 minutes, read these three sections and nothing else:

1. **[Indexes](#41-indexes--the-single-biggest-win)** — missing indexes cause more slowness than everything else combined
2. **[The N+1 query](#43-the-n1-query--the-most-common-bug-in-backend-code)** — you have written this bug; you just don't know it yet
3. **[Timeouts](#81-timeouts--the-default-is-wait-forever)** — one slow dependency takes down your whole service without them

---

## Contents

| | Part | You'll learn |
|:--|---|---|
| **0** | [Foundations](#part-0--foundations) | What a backend actually is, and what happens when you type a URL |
| **1** | [HTTP](#part-1--http) | Requests, responses, methods, status codes, cookies |
| **2** | [Servers & concurrency](#part-2--servers--concurrency) | How one machine serves thousands of people at once |
| **3** | [APIs](#part-3--apis) | Designing a contract other people build on |
| **4** | [Databases](#part-4--databases) | Modelling, **indexes**, EXPLAIN, transactions, race conditions |
| **5** | [Security](#part-5--security) | Auth, passwords, JWT, OAuth, and the bugs that cause breaches |
| **6** | [Caching & queues](#part-6--caching--queues) | Serve it fast, do slow work later |
| **7** | [Performance](#part-7--performance) | p95/p99, profiling, and where the time actually goes |
| **8** | [Reliability](#part-8--reliability) | The network will fail. Design like it already has. |
| **9** | [DevOps](#part-9--devops--deploys) | Containers, CI/CD, zero-downtime deploys |
| **10** | [System design](#part-10--system-design) | The method, the maths, and the classic problems worked through |
| 📋 | [Cheat sheets](#-cheat-sheets) | Status codes, latency numbers, red flags |
| 📚 | [Where to go next](#-where-to-go-next) | The best free resources, curated |

---
---

# Part 0 · Foundations

## 0.1 What is a backend?

The **frontend** is what the user sees. The **backend** is everything they don't:

- It **stores** data that must outlive the browser tab (your account, your orders).
- It **decides** things the user isn't allowed to decide (are you allowed to see this? did your card actually clear?).
- It **shares** state between people (you post, I see it).

> **The rule that explains everything:** anything the user could tamper with must be decided on the server. The frontend is a *suggestion*. The backend is the *truth*.
>
> A user can open DevTools and change `isAdmin: false` to `true`. If your backend believes them, you don't have a bug — you have a breach.

## 0.2 What happens when you type a URL

This one question contains most of backend engineering. Follow it carefully:

```
1. DNS          "example.com" → 93.184.216.34
                Your computer asks a DNS resolver "what's the IP?"
                Cached at every layer, which is why it's usually instant.

2. TCP          Your machine opens a connection to that IP on port 443.
                A three-way handshake: SYN → SYN-ACK → ACK.

3. TLS          They exchange certificates and agree on encryption keys.
                This is the "S" in HTTPS. Now nobody in between can read it.

4. HTTP         Your browser sends:  GET / HTTP/1.1
                                     Host: example.com

5. Server       A load balancer picks one of N identical servers.
                That server runs your code.

6. Database     Your code asks the database for data. ← usually the slow part

7. Response     HTTP/1.1 200 OK  + the HTML/JSON body

8. Render       The browser paints it.
```

**Every part of this course is one of those steps in more depth.** Steps 4–7 are "the backend".

## 0.3 The client–server model

A **client** asks. A **server** answers. That's it.

The important consequence: **the server has no idea who you are between requests.** HTTP is *stateless*. Every request arrives as a stranger. That's why we invented cookies, sessions, and tokens — to re-answer "who is this?" on every single request. ([Part 5](#part-5--security).)

---

# Part 1 · HTTP

## 1.1 A request and a response, in full

```http
GET /api/users/42 HTTP/1.1          ← method, path, version
Host: api.example.com               ← which site (one IP hosts many)
Authorization: Bearer eyJhbGci...   ← who I am
Accept: application/json            ← what I can understand
User-Agent: Mozilla/5.0 ...
```

```http
HTTP/1.1 200 OK                     ← status line ← THE MOST IMPORTANT LINE
Content-Type: application/json      ← what I'm sending back
Cache-Control: max-age=60           ← how long you may reuse this
Set-Cookie: session=abc; HttpOnly   ← remember this and send it back

{"id": 42, "name": "Ada"}           ← the body
```

## 1.2 The methods, and the property that matters

| Method | Safe? | **Idempotent?** | Means |
|---|:--|:--|---|
| `GET` | ✅ | ✅ | Read. Never changes anything. |
| `PUT` | ❌ | ✅ | Replace the whole resource. |
| `PATCH` | ❌ | usually | Change some fields. |
| `DELETE` | ❌ | ✅ | Gone. Deleting twice is still gone. |
| `POST` | ❌ | **❌ NO** | Create / do. **The dangerous one.** |

> **Idempotent = doing it twice has the same effect as doing it once.**
>
> This is not trivia. Networks are flaky, so clients **retry**. A retried `GET` is harmless. A retried `POST /payments` **charges the card twice**. Everything except POST is naturally safe to repeat — POST needs help, and that help is called an [idempotency key](#33--idempotency-keys--how-you-stop-double-charges).

## 1.3 Status codes that mean something

| Code | Say it when |
|---|---|
| `200 OK` | It worked, here's the body |
| `201 Created` | You made something (return it + a `Location` header) |
| `202 Accepted` | Queued — it'll happen later |
| `204 No Content` | It worked, nothing to send back |
| `400 Bad Request` | Malformed / invalid input |
| `401 Unauthorized` | **I don't know who you are** (really: *unauthenticated*) |
| `403 Forbidden` | **I know who you are, and no** |
| `404 Not Found` | No such thing — also the right way to *hide* a thing |
| `409 Conflict` | Clashes with current state (duplicate, version mismatch) |
| `422 Unprocessable` | Syntax fine, meaning wrong (email already taken) |
| `429 Too Many Requests` | Rate limited — **always** add `Retry-After` |
| `500 Internal` | We broke. Never leak the stack trace. |
| `503 Unavailable` | Overloaded / down |

> ### 🚨 `200 OK { "error": true }` is the worst thing you can do
>
> Every client, proxy, retry policy, monitor and alert in the world reads **the status code**. Lie in it and none of them work: your error rate shows 0%, your dashboards are green, your users are stuck, and nobody gets paged.
>
> **The status line is part of your API.** It is not decoration.

## 1.4 Cookies, and the flags that are free security

The server says `Set-Cookie: session=abc`. The browser sends it back on **every** subsequent request. That's how a stateless protocol remembers you.

| Flag | What it buys you |
|---|---|
| `HttpOnly` | JavaScript **can't read it** → an XSS bug can't steal the session |
| `Secure` | Sent only over HTTPS → never leaks in plaintext |
| `SameSite=Lax` | Not sent on cross-site requests → blocks most CSRF |

> **Put your auth token in an `HttpOnly` cookie, not `localStorage`.** Anything in `localStorage` is readable by any script on the page — one XSS, or one compromised npm package, and the token walks out the door.

## 1.5 HTTP/1.1 vs 2 vs 3 (the 30-second version)

- **HTTP/1.1** — one request at a time per connection. Slow things block fast things (head-of-line blocking).
- **HTTP/2** — many requests **multiplexed** over one connection. Binary, header compression. Big win.
- **HTTP/3** — same, but over **QUIC (UDP)** instead of TCP, so a single lost packet doesn't stall every stream. Better on flaky mobile networks.

You rarely choose this. Your load balancer does. Just know *why* it got faster.

---

# Part 2 · Servers & concurrency

## 2.1 What a "server" actually is

A program in an infinite loop, listening on a port, waiting for connections.

```js
// This is a web server. That's genuinely all one is.
import http from "node:http";

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ hello: "world" }));
}).listen(3000);
```

## 2.2 The same endpoint in four languages

Notice how little the *concepts* change. Frameworks are a detail.

<details open>
<summary><b>JavaScript</b> — Express</summary>

```js
import express from "express";
const app = express();

app.get("/users/:id", async (req, res) => {
  const user = await db.users.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "not_found" });
  res.json(user);
});

app.listen(3000);
```
</details>

<details>
<summary><b>Python</b> — FastAPI</summary>

```python
from fastapi import FastAPI, HTTPException

app = FastAPI()

@app.get("/users/{user_id}")
async def get_user(user_id: int):
    user = await db.users.find_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="not_found")
    return user
```
</details>

<details>
<summary><b>Go</b> — net/http</summary>

```go
func getUser(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    user, err := db.FindUserByID(id)
    if err != nil {
        http.Error(w, `{"error":"not_found"}`, http.StatusNotFound)
        return
    }
    json.NewEncoder(w).Encode(user)
}
```
</details>

<details>
<summary><b>Java</b> — Spring Boot</summary>

```java
@RestController
class UserController {
    @GetMapping("/users/{id}")
    ResponseEntity<User> getUser(@PathVariable Long id) {
        return userRepo.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}
```
</details>

**Four languages. One idea:** match a route → load the thing → 404 if missing → serialise it.

## 2.3 How one server handles thousands of users

The key insight: **your server spends almost all its time waiting**, not computing. Waiting on the database. Waiting on an API. Waiting on disk.

| Approach | How it works | Used by |
|---|---|---|
| **Process per request** | Heavy. Real memory each. Doesn't scale far. | old CGI |
| **Thread per request** | Lighter. But 10k threads = 10k stacks + context switching. | Java (classic), Rails |
| **Event loop** | **One thread**, never blocks. Registers a callback, moves on. | Node.js, nginx |
| **Green threads** | Cheap "threads" the *runtime* schedules. Thousands are free. | Go, Java 21+ virtual threads |

> ### 🚨 The classic Node.js mistake
>
> The event loop is **one thread**. If you do something CPU-heavy on it — resize an image, hash a huge file, parse a 50MB JSON — **the entire server freezes for every user** until it finishes.
>
> - **I/O-bound** (waiting on DB/network) → async is perfect. This is 95% of web apps.
> - **CPU-bound** (actually computing) → async does nothing. Move it to a **worker thread** or a **job queue**.

## 2.4 Stateless servers — the thing that lets you scale

Ask yourself one question:

> **Can I kill any server at random and lose nothing?**

If yes, you can scale horizontally: just add more boxes behind a load balancer. If no, find what's stuck in that server's memory and move it out:

| Don't keep in the server | Put it here instead |
|---|---|
| Sessions in memory | Redis, or a signed token |
| Uploaded files on local disk | S3 / object storage |
| A cache in a local `Map` | Redis |
| A background `setInterval` | A job queue or a real scheduler |

---

# Part 3 · APIs

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

# Part 4 · Databases

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

# Part 5 · Security

## 5.1 The two questions, on every request

- **Authentication (AuthN)** — *who are you?* Answered **once**, at the door.
- **Authorization (AuthZ)** — *are you allowed to do this?* Checked on **every** action, for **this specific** resource.

> ### 🚨 The #1 web vulnerability is an authorization bug
>
> **Broken access control** tops the OWASP list. It is almost always this:
>
> ```js
> // ❌ You checked that they're logged in. You didn't check that it's THEIRS.
> app.get("/orders/:id", requireLogin, async (req, res) => {
>   const order = await db.orders.find(req.params.id);
>   res.json(order);          // user 42 just typed /orders/43 and read someone else's invoice
> });
>
> // ✅ Scope the query itself. Put the check IN the query.
> const order = await db.orders.findOne({
>   id: req.params.id,
>   user_id: req.user.id,     // ← the whole fix
> });
> ```
>
> This is called **IDOR**, and it is *everywhere*.

## 5.2 The three rules everything else follows from

1. **Never trust input.** Every byte from a client is hostile until validated. Validate against an **allowlist** of what's permitted, not a blocklist of what's banned — you cannot enumerate every bad input.
2. **Least privilege.** Every user, token and DB account gets the *minimum* access it needs. When something is compromised, this decides whether it's an incident or a catastrophe.
3. **Defense in depth.** No single control is trusted to hold.

## 5.3 Passwords — hash, never encrypt

> **Encryption is reversible. That is exactly what you don't want.** If *you* can decrypt a password, so can whoever steals your key. You must never be *able* to recover a password.

| Algorithm | Verdict |
|---|---|
| **Argon2id** | ✅ best choice today (memory-hard) |
| **bcrypt** | ✅ fine, battle-tested |
| `SHA-256`, `MD5` | ❌ **built for speed = built for cracking** |

Why slow ones? A GPU tries **billions** of fast hashes per second. A memory-hard function tuned to ~100ms makes mass cracking economically hopeless.

**Modern rules (NIST 800-63B):**
- ✅ Require **length**, not gibberish. A passphrase beats `P@ss1!`.
- ❌ **Drop composition rules.** "1 upper, 1 symbol" just produces `Password1!` on every site.
- ✅ **Check against breached lists** (Have I Been Pwned). This blocks more real attacks than any complexity rule.
- ❌ **No forced 90-day rotation.** It trains people to write passwords down and increment a digit.

## 5.4 Sessions vs JWT — the trade-off nobody tells you

| | **Server sessions** | **JWT (stateless)** |
|---|---|---|
| How | random id in a cookie; data in Redis | a signed token the server verifies with no lookup |
| **Revoke** | ✅ **instant** — delete the row | ❌ **you cannot un-issue it.** Valid until it expires. |
| Cost | one Redis lookup per request (trivial) | none |
| Verdict | **the safe default** | great for scale, but "logout" and "ban this user" become genuinely hard |

**If you use JWT, use the two-token pattern:** a short-lived **access token** (5–15 min, stateless) + a long-lived **refresh token** that *is* stored server-side and *can* be revoked.

**JWT footguns:** never accept `alg: none`; never let the client choose the algorithm (the RS256→HS256 attack); the payload is **only base64 — anyone can read it**, so it is not secret.

## 5.5 OAuth / "Sign in with Google", decoded

1. Your app redirects to Google with `client_id`, `scope`, `redirect_uri`, **`state`**, and a PKCE challenge.
2. The user logs in **at Google**. Your app **never sees the password**.
3. Google redirects back with a short-lived, single-use **authorization code**.
4. Your **server** exchanges that code (+ client secret + PKCE verifier) for tokens.
5. You get an **id token** (who they are) → you create a session.

**Non-negotiable:** the `state` parameter (that's your CSRF protection for the callback), and **exact-match** the `redirect_uri` against an allowlist. Loose matching there is the classic account takeover.

## 5.6 Injection — untrusted data becoming code

```js
// ❌ The data becomes SQL.
db.query("SELECT * FROM users WHERE email = '" + email + "'");
//  email = "' OR '1'='1' --"   → returns EVERY user. Or drops your table.

// ✅ Parameterised. The value can NEVER cross into the query grammar.
db.query("SELECT * FROM users WHERE email = $1", [email]);
```

> **Parameterised queries fix SQL injection *completely*** — not "mostly", completely. The same idea applies anywhere untrusted data meets an interpreter: shell commands, `eval`, LDAP, XPath. **Never build any of them by string concatenation.**

## 5.7 The rest of the roll-call

| Attack | In one line | Defence |
|---|---|---|
| **XSS** | attacker's script runs on your page | escape on output; sanitize HTML; **CSP** as the safety net |
| **CSRF** | another site makes the browser POST **as the logged-in user** | `SameSite` cookies + CSRF token |
| **SSRF** | you fetch a user-supplied URL → they point it at `169.254.169.254` and steal your **cloud credentials** | allowlist hosts; block internal IP ranges |
| **Mass assignment** | client sends `{is_admin: true}` and your ORM saves it | explicitly pick allowed fields |
| **Path traversal** | filename `../../etc/passwd` | resolve the path, confirm it's still inside the root |

*(SSRF is how the Capital One breach happened.)*

## 5.8 🚨 Secrets — the trap everyone falls into once

> You commit an API key, notice, and remove it in the next commit.
>
> **That does nothing.** It's still in the git history, on every clone, in every fork, in GitHub's cache — **forever**. Bots scrape public commits for keys within *seconds*.
>
> **The only fix is to rotate the key. Immediately.** The commit is a lost cause; the live credential is what matters.

Secrets come from the **environment** or a secret manager — never from source, never from a committed `.env`. Add `.env` to `.gitignore` on line one of a new project. **Never log secrets, tokens, or PII** — a logged token is a leaked token.

---

# Part 6 · Caching & queues

## 6.1 Caching is buying speed with staleness

| Layer | Speed |
|---|---|
| In-process memory | ~0.1ms |
| Redis (same DC) | ~1ms |
| Postgres (indexed) | ~10ms |

Every cache can serve data that is **wrong** (stale), and every entry must be removed at the right moment. Cache things where a few seconds of stale is fine. Think very hard before caching anything else.

## 6.2 Cache-aside — the pattern you'll use 90% of the time

```js
async function getUser(id) {
  const key = `user:${id}`;

  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);           // HIT

  const user = await db.users.find(id);            // MISS → source of truth
  await redis.set(key, JSON.stringify(user), "EX", 300);   // TTL 5 min
  return user;
}

// On write: DELETE the key. Do NOT update it.
async function updateUser(id, data) {
  const user = await db.users.update(id, data);
  await redis.del(`user:${id}`);                   // next read repopulates
  return user;
}
```

> **Delete on write. Don't update.** Updating both the DB and the cache is two writes that can interleave — two concurrent updates can leave the cache holding the **older** value permanently. Deleting sidesteps the race entirely.
>
> And **always set a TTL**, even with perfect invalidation. It's the backstop for the bug you didn't foresee.

## 6.3 🚨 The three ways a cache takes down your database

| Failure | What happens | Fix |
|---|---|---|
| **Stampede** | a hot key expires → **10,000 requests all miss at once** and hammer the DB with the same expensive query | a lock, so **one** rebuilds while the rest wait; or refresh *before* expiry |
| **Penetration** | requests for keys that don't exist skip the cache **every time** (often an attack) | cache the *negative* result too |
| **Avalanche** | many keys share one expiry time and all die together | add **random jitter** to every TTL |

The stampede is the one that pages you at 3am.

## 6.4 Queues — respond now, work later

Signup fires a welcome email, thumbnails, an analytics event, a CRM sync. Do it inline and the request takes 4 seconds and **fails if any downstream is down**.

Put a job on a queue → **return in 50ms**. A worker does the rest. Queues also **absorb spikes**: work piles up in the queue instead of knocking the service over.

> ### 🚨 At-least-once delivery means duplicates. Always.
>
> A worker pulls a job, does the work, then **crashes before acknowledging it**. The queue sees no ack, so it **redelivers**. The job runs again. If it charged a card — you charged twice.
>
> **Design every job to be safe to run more than once.** Ack *after* the work, never before. Retry with **backoff + jitter**, cap the attempts, and send poison messages to a **dead-letter queue** — otherwise one bad message retries forever and stalls the whole queue.

## 6.5 🚨 The cron trap that emails your customers 20 times

You add a nightly job with a cron inside your app. In production the app runs on **20 instances** — so the cron fires on **all twenty**, and every customer gets the newsletter **twenty times**.

**Fix:** a distributed lock (`SET lock NX EX 3600` in Redis) so exactly one instance wins — or a real scheduler (Kubernetes CronJob) that runs the task **once**, outside your app processes.

---

# Part 7 · Performance

## 7.1 Measure first. Your intuition is wrong.

> Every experienced engineer has spent a day optimising a function that turned out to be **0.1% of the request**, while the real cost — a missing index, an N+1, a slow API call — sat untouched.

**Profile → fix the thing the profiler points at → measure again → stop when it's fast enough.** "Fast enough" is a real and valid answer.

## 7.2 p95/p99 — the average is a liar

> **Nobody experiences the average.**
>
> Mean latency of 50ms sounds great. But if **p99 is 4 seconds**, then 1 in 100 requests is awful — and a page that makes 20 calls hits that p99 on *nearly every load*.

**Always report p50 / p95 / p99. Never the mean.**

The tail usually has a *different cause* than the median: a cold cache, a GC pause, a lock, a slow replica, a retry. That's why you can't fix p99 by making the median faster.

## 7.3 The latency numbers to memorise

| | |
|---|---|
| Memory read | **0.1ms** |
| Redis / SSD | **1ms** |
| Indexed DB query | **10ms** |
| Same-region API call | **50ms** |
| Cross-continent | **150ms** |

Internalise these and you can estimate any design on a whiteboard. A request making **30 sequential 10ms queries cannot be faster than 300ms** — the fix isn't faster queries, it's **fewer round trips**.

## 7.4 The usual suspects, ranked by how often it's really them

| # | Suspect | The fix |
|:--|---|---|
| 1 | **N+1 queries** | eager-load / join / DataLoader |
| 2 | **Missing index** | add the index |
| 3 | **Serial I/O** | run independent calls in parallel |
| 4 | No caching | cache-aside + TTL |
| 5 | Over-fetching (`SELECT *`) | select only what you need |

Nearly every "our app is slow" ticket is #1, #2 or #3 — and **all three are I/O, not CPU**. That's why "optimising the code" aims at the wrong layer.

### Parallelise independent I/O

```js
// ❌ Serial — the SUM of all waits = 100ms
const user   = await getUser(id);    // 30ms
const orders = await getOrders(id);  // +50ms
const prefs  = await getPrefs(id);   // +20ms

// ✅ Concurrent — as slow as the SLOWEST = 50ms
const [user, orders, prefs] = await Promise.all([
  getUser(id), getOrders(id), getPrefs(id),
]);
```

None of those depend on each other. This one change routinely **halves** a slow endpoint.

## 7.5 Read a request like a profiler

```
GET /api/dashboard                      total 340ms
├─ auth check              ▓ 5ms
├─ getUser (DB)            ▓▓ 12ms
├─ getOrders (DB)          ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 210ms  ← 62% of the request 🎯
│   └─ Seq Scan on orders  (no index on user_id)
├─ getRecommendations      ▓▓▓▓ 80ms  (external API — parallelise me)
└─ render JSON             ▓ 33ms

Fix the 210ms. The 5ms auth check is not your problem.
```

**Width = time. The widest bar is your target, every time.**

| Language | Profiler |
|---|---|
| Node.js | `clinic.js`, `0x` |
| Python | **`py-spy`** (attaches to a *live* process — no restart) |
| Go | `pprof` (built in) |
| Java | `async-profiler` |
| Anything HTTP | **OpenTelemetry** traces |

---

# Part 8 · Reliability

## 8.1 Timeouts — the default is "wait forever"

> ### 🚨 One slow dependency becomes a total outage
>
> A downstream service hangs. Your requests to it don't *error* — they **wait**. Each waiting request holds a thread and a connection. Within seconds **every worker is stuck**, your pool is exhausted, and **your whole service is down — because something else was slow.**

**Set an explicit timeout on every network call. No exceptions.** A request with no deadline is a resource leak waiting for a bad day.

And **budget timeouts down the chain**: if the user's request has 3s, a call three services deep cannot also get 3s.

## 8.2 Retries — necessary, and dangerous

```js
// exponential backoff + JITTER. The jitter is not optional.
async function withRetry(fn, max = 4) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= max || !isRetriable(err)) throw err;   // never retry a 4xx
      const base = Math.min(1000 * 2 ** attempt, 20_000);   // 1s, 2s, 4s, 8s… capped
      await sleep(Math.random() * base);                    // ← spreads the herd
    }
  }
}
```

> **Retries without jitter cause a thundering herd.** A service blips, and 10,000 clients all retry at exactly 1s, then 2s, then 4s — synchronised waves that hammer the recovering service **back into the ground**.

Rules: **only retry idempotent operations** (retrying a payment charges twice) and **never retry a 4xx** — the request was wrong and will be wrong again.

## 8.3 Circuit breakers — stop kicking a service that's down

```
         failures exceed threshold
  CLOSED ───────────────────────────▶ OPEN
   ▲  (normal: requests flow)      (fail FAST — don't even try.
   │                                give it room to recover)
   │  success                          │ after a cooldown
   │                                   ▼
   └──────────────────────────── HALF-OPEN
        (let ONE test request through; ok → CLOSED, fail → OPEN)
```

A retry says "try again". A circuit breaker says **"stop trying for a while."** When open, it fails instantly — no threads pile up waiting — and you serve a **fallback** (a cached value, a default, a graceful "try later") instead of hanging.

## 8.4 Graceful degradation

**Rank your features.** Checkout is critical. Recommendations are not.

When recommendations are down, **show the page without them**. Never fail the whole page for a nice-to-have. *Degrade, don't die.*

## 8.5 CAP — you don't get to keep all three

Partitions **will** happen. So the real, unavoidable choice is: when the network splits, do you…

- **CP** — refuse to answer rather than risk a **wrong** answer → **money, inventory, bookings**
- **AP** — answer with possibly-stale data rather than **fail** → **feeds, likes, counts**

**This is a per-field decision, not a company religion.** The bank balance is CP. The "last seen" timestamp next to it is AP.

## 8.6 🚨 The dual-write problem

```js
await db.orders.insert(order);        // ✅ committed
await kafka.publish("order.created"); // 💥 app crashes here

// The order EXISTS but no downstream ever hears about it.
// No email. No fulfilment. No analytics. Silently.
```

There is **no shared transaction** across a database and a message broker. So this *will* happen.

**The fix — the transactional outbox:**

```sql
BEGIN;
  INSERT INTO orders (id, ...) VALUES (...);
  INSERT INTO outbox (topic, payload)         -- SAME transaction
         VALUES ('order.created', '{...}');
COMMIT;   -- both land, or neither does

-- A separate relay polls the outbox and publishes, marking rows sent.
-- Crash mid-publish? It re-sends → at-least-once → consumers must dedupe.
```

---

# Part 9 · DevOps & deploys

## 9.1 Containers

A container bundles your app **and its entire runtime** into one image. The image that passed CI is byte-for-byte the image in production. **That reproducibility is the whole point.**

```dockerfile
# Multi-stage: build fat, ship lean
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci                    # ← cached UNLESS package files change
COPY . .
RUN npm run build

FROM node:22-alpine           # final image: no build tools, much smaller
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
USER node                     # ✅ don't run as root
CMD ["node", "dist/server.js"]
```

**Why `COPY package*.json` *before* the source?** Each instruction is a **cached layer**, and a changed layer invalidates **every layer after it**. Copy the source first and you reinstall every dependency on every one-line change.

**Never bake secrets into an image** — anyone who pulls it can read every layer.

## 9.2 Deployment strategies

| Strategy | Downtime | Blast radius |
|---|:--|---|
| Recreate | ❌ yes | everyone |
| Rolling *(K8s default)* | none | grows as pods swap |
| Blue-green | none | 100% at once — but **instant** rollback |
| **Canary** ⭐ | none | **a bug hits 5% of users, not all of them** |

## 9.3 🚨 Zero-downtime migrations: old and new code run **at the same time**

During any rolling deploy, **both versions hit the same database** for minutes. So **the schema must work with both.**

```sql
ALTER TABLE users RENAME COLUMN name TO full_name;
```

Every still-running old instance queries `name` → **starts throwing errors instantly**. You just caused an outage in the middle of a "zero-downtime" deploy.

**The expand/contract dance — six steps to rename one column:**

1. **EXPAND** — add the new column (nullable). Old code ignores it.
2. Deploy code that **writes both**, reads the old.
3. **BACKFILL** in batches (never one giant `UPDATE` that locks millions of rows).
4. Deploy code that **reads the new** column.
5. Deploy code that **stops using the old** one.
6. **CONTRACT** — finally drop the old column.

> Six steps and several deploys, to rename a column. **That is the real cost of zero downtime** — and why experienced engineers are so careful with schema changes.

Also: **`CREATE INDEX CONCURRENTLY`**. A plain `CREATE INDEX` **locks writes** on the table — on a big hot table, that's an outage.

## 9.4 Feature flags — deploying ≠ releasing

Ship code to production **dark** (disabled). Then turn it on for 1% → your team → 10% → everyone, **from a dashboard, without a redeploy**.

A bug? **Flip it off in seconds.**

This is how companies deploy dozens of times a day safely: the risky moment isn't the deploy, it's the **release** — and a flag makes the release instantly reversible.

## 9.5 Observability

- **Logs** — discrete events. Structured **JSON**, never `console.log`. Attach a **correlation id** to follow one request across five services.
- **Metrics** — numbers over time. **The four golden signals: latency, traffic, errors, saturation.**
- **Traces** — one request's whole journey. The only way to see *which hop* is slow.

> **Alert on symptoms, not causes.** Don't alert on "CPU is 90%" — that might be perfectly healthy. Alert on what **users feel**: *error rate > 1% for 5 minutes*, *p95 > 1s*, *checkout success dropped*.
>
> Every alert must be **actionable**. An alert nobody acts on trains everyone to ignore alerts — and that's how real outages get missed.

---

# Part 10 · System design

## 10.1 The method — works for any prompt

1. **Clarify** — features, scale, read:write ratio, consistency needs, latency budget
2. **Estimate** — back-of-envelope. *Let the numbers reveal the real problem.*
3. **API** — define the endpoints
4. **Data model** — driven by the **access pattern**
5. **High-level design** — client → LB → service → store
6. **The core algorithm** — the one genuinely hard part
7. **Bottleneck & scale** — optimise the dominant cost

> ### What the interviewer is actually listening for
>
> Not the "right" answer — **your reasoning**. Say the trade-off out loud:
>
> - "Reads dominate 100:1, **so** I'll cache aggressively."
> - "This must not double-charge, **so** idempotency keys."
> - "A stale like count is fine, **so** eventual consistency here."
>
> **The "so" is the job.**

## 10.2 Back-of-envelope, fast

| Number | |
|---|---|
| Seconds in a day | **86,400** (~100k) |
| 1M requests/day | **≈ 12 req/s** |
| Peak multiplier | **2–10×** average |
| A typical row | ~500 bytes |

**Worked example — a Twitter-scale feed:**

```
200M daily users, each reads the feed 10×/day, posts 0.1×/day.

Reads:  200M × 10  = 2B/day  ÷ 86,400 ≈ 23,000 req/s   (peak ~115k)
Writes: 200M × 0.1 = 20M/day ÷ 86,400 ≈    230 req/s

→ Ratio ≈ 100:1 read:write.
→ THE DESIGN IS ABOUT READS. Precompute at WRITE time. Cache hard.
```

You didn't do that arithmetic for the number. You did it to **discover what kind of problem this is** — and that finding dictates every later decision.

## 10.3 Design: news feed (the celebrity problem)

**Fan-out on write** — push each new post into every follower's precomputed feed. Reads become O(1). Perfect, since reads dominate 100:1.

> ### 🚨 Then a user with 50 million followers posts.
>
> **50,000,000 writes. For one post.** It takes minutes, saturates your write path, and delays everyone else. This is **write amplification**.

**✅ The hybrid — the answer they're listening for:**

- **Normal users → fan-out on WRITE** (precomputed into followers' feeds)
- **Celebrities → fan-out on READ** (not pushed anywhere)
- **Merge at read time.**

A celebrity's post is written **once**. A user follows only a handful of celebrities, so the pull half is small — and its results are **shared by millions**, so you cache them hard. You get push's fast reads *and* pull's cheap writes.

## 10.4 Design: rate limiter

**Token bucket** — capacity 10, refill 1/sec:

```
▸ idle a while   → bucket fills to 10
▸ burst of 10    → all allowed instantly (spends the savings)
▸ after that     → ~1/sec as it refills
```

It allows the **short natural bursts real users create**, while enforcing a steady average.

> ### 🚨 The naive version is a race condition
>
> `GET count → if ok → SET count+1` — two servers both read "99" and **both pass**. Check-then-act isn't atomic.
>
> **Fix:** a **Redis Lua script** (refill + consume in one atomic step). Redis is also what makes the limit **global** — an in-memory counter silently multiplies your limit by the number of servers.

## 10.5 🚨 `hash(key) % N` is a trap

With `hash % N`, changing N from 4 → 5 servers **remaps ~80% of your keys**. Every one is now a **cache miss** — and 80% of traffic slams the database at once, *while you were trying to relieve load*.

**Consistent hashing** puts servers and keys on a **ring**; a key belongs to the first server clockwise. Adding a server moves only **~1/N of keys**.

---
---

# 📋 Cheat sheets

<details>
<summary><b>Status codes</b></summary>

```
2xx  200 OK · 201 Created · 202 Accepted · 204 No Content
4xx  400 Bad Request      · 401 Unauthenticated (not "unauthorized"!)
     403 Forbidden        · 404 Not Found
     409 Conflict         · 422 Unprocessable
     429 Too Many Requests (+ Retry-After)
5xx  500 Internal · 502 Bad Gateway · 503 Unavailable · 504 Gateway Timeout
```
</details>

<details>
<summary><b>Latency numbers</b></summary>

```
Memory read            0.1 ms
Redis / SSD            1   ms
Indexed DB query      10   ms
Same-region API       50   ms
Cross-continent      150   ms
Seconds in a day    86,400
1M req/day  ≈  12 req/s
```
</details>

<details>
<summary><b>🚩 Red flags — grep your codebase for these today</b></summary>

- An **ORM call inside a loop** (N+1)
- A **network call with no timeout**
- **Retries with no jitter**, or retrying a non-idempotent write
- `POST /payments` with **no idempotency key**
- **read-modify-write** with no lock, atomic update, or version check
- A resource id from the URL used with **no ownership check** (IDOR)
- Any query built by **string concatenation**
- Auth token in **`localStorage`** instead of an `HttpOnly` cookie
- `200 OK` with an **error body**
- A list endpoint with **no default limit**
- `pool size × instance count` **> what the DB accepts**
- A **cron inside an app that runs on many instances**
- **Secrets in git** (rotate them — deleting the commit does nothing)
- `CREATE INDEX` (not `CONCURRENTLY`) on a hot table
- Alerting on **causes** (CPU) instead of **symptoms** (error rate, p95)

</details>

---

# 📚 Where to go next

The best free resources, curated. If you read only three: **Use The Index Luke**, the **AWS Builders' Library**, and **DDIA**.

| Topic | Resource |
|---|---|
| 🗄️ **Databases** | [Use The Index, Luke](https://use-the-index-luke.com/) — free book, the clearest thing ever written on indexing |
| 🗄️ Databases | [PostgreSQL docs](https://www.postgresql.org/docs/current/) — the best database manual there is |
| 📖 **Everything** | [Designing Data-Intensive Applications](https://dataintensive.net/) — *the* book. Read it twice. |
| 🕸️ **Reliability** | [AWS Builders' Library](https://aws.amazon.com/builders-library/) — how a hyperscaler really builds. Free. |
| 🕸️ Reliability | [Timeouts, retries and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) |
| 🔐 **Security** | [PortSwigger Web Security Academy](https://portswigger.net/web-security) — free labs where you *actually exploit* each bug |
| 🔐 Security | [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/) — one page per attack, with the fix |
| 🧠 **System design** | [System Design Primer](https://github.com/donnemartin/system-design-primer) |
| 🧠 System design | [High Scalability](http://highscalability.com/) — how real companies actually built it |
| ⚡ **Performance** | [Latency numbers every programmer should know](https://gist.github.com/jboner/2841832) |
| 🚀 **DevOps** | [The Twelve-Factor App](https://12factor.net/) · [Google SRE Book](https://sre.google/sre-book/table-of-contents/) (free) |
| 🌐 **HTTP** | [MDN HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP) |

---

# 💻 The interactive version

Everything above — plus **68 lessons with quizzes**, **36 reference pages**, progress tracking, ⌘K search and code in 4 languages — runs as a site in this repo:

```bash
npm install
npm run dev        # → http://localhost:5173
```

| Command | |
|---|---|
| `npm run dev` | dev server |
| `npm test` | 29 tests |
| `npm run build` | production build → `dist/` |

<details>
<summary><b>How the content is structured</b> (if you want to add lessons)</summary>

<br />

Content is **data**; the app is a renderer. Lessons are plain Markdown in [`public/content/`](public/content/), listed in `roadmap.json`:

```jsonc
{
  "id": "my-lesson",                  // → /lesson/my-lesson
  "title": "My Lesson",
  "file": "01-http/my-lesson.md",
  "estMinutes": 8,
  "quiz": [{ "q": "…", "options": ["A", "B"], "answer": 1, "explain": "…" }],
  "resources": [{ "title": "…", "url": "…", "type": "docs", "note": "…" }]
}
```

Put fenced code blocks for **different languages next to each other** and they render as one **tabbed** component (`js` · `python` · `go` · `java`).

The **Pro Shelf** reference pages live in [`src/pages/pro/`](src/pages/pro/), built from the vocabulary in [`ProKit.tsx`](src/components/ProKit.tsx).

</details>

---

<div align="center">

**Concepts, not frameworks.**

If this helped, ⭐ the repo.

</div>
