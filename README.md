<div align="center">

# ⚡ BackendPath

### Learn backend engineering, from zero to system design.

**The whole course is on this page — you don't need to go anywhere else.**
Prefer it interactive, with quizzes and progress tracking? **[backend.nextjoblist.com](https://backend.nextjoblist.com/)**

Every concept is language-agnostic. Every trap is one that takes down real production systems.

<br />

[![Read it live](https://img.shields.io/badge/📖_Read_it_live-backend.nextjoblist.com-6366f1?style=for-the-badge)](https://backend.nextjoblist.com/)
[![Interview questions](https://img.shields.io/badge/System_design-130_questions-f43f5e?style=for-the-badge)](https://backend.nextjoblist.com/pro/system-design/questions)

![Level](https://img.shields.io/badge/Level-Beginner%20→%20Pro-10b981?style=flat-square)
![Read time](https://img.shields.io/badge/Read%20time-~90%20min-64748b?style=flat-square)
![Prereqs](https://img.shields.io/badge/Prerequisites-none-64748b?style=flat-square)
![License](https://img.shields.io/badge/Free-forever-10b981?style=flat-square)

</div>

> **68 lessons · 36 reference pages · 130 system-design interview questions · a 120-term glossary · ~51,000 words.**
> Databases · APIs · Security · Caching & Queues · Performance · Reliability · DevOps · System Design.

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
| 🎯 | [The system design interview](#-the-system-design-interview) | The 45-min round, what they grade, how people fail |
| 📖 | [Backend glossary](#-backend-glossary--the-terms-theyll-drop-on-you) | ~120 terms they'll drop on you, each defined + linked |
| ❓ | [130 interview questions](#-130-system-design-interview-questions) | The full bank — "Design X", deep dives, concepts, estimation, trade-offs |
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

# 🎯 The system design interview

## The 45-minute round, minute by minute

Most candidates fail on **time management**, not knowledge. They spend 25 minutes on requirements and never draw a system.

| Minutes | Do this | The mistake to avoid |
|---|---|---|
| **0–5** | **Clarify.** Features, scale, read:write ratio, consistency, latency budget. **Restate it back.** | Designing before you know what you're designing |
| **5–10** | **Estimate.** QPS, storage, peak. Round hard. | Skipping it — the numbers tell you what the problem *is* |
| **10–15** | **API + data model.** The endpoints, the entities, the access pattern. | Picking a database before knowing how you'll query |
| **15–30** | **High-level design.** Draw boxes: client → LB → service → cache → DB. **Talk while you draw.** | Silence. They can't grade what you don't say. |
| **30–40** | **Deep dive.** They pick one part. Go deep on the bottleneck. | Being surprised — *expect* this and know your hard part |
| **40–45** | **Bottlenecks, failure modes, trade-offs.** "If X dies, we degrade to Y." | Claiming your design has no weaknesses |

## What they're actually grading

> They are **not** grading whether you got the "right" architecture. There isn't one.
>
> They are grading whether you can **say the trade-off out loud**:
>
> - *"Reads dominate 100:1, **so** I'll cache aggressively."*
> - *"This must not double-charge, **so** idempotency keys."*
> - *"A stale like-count harms nobody, **so** eventual consistency here — but the balance is strong."*
>
> **The word "so" is the entire interview.** A candidate who says "I'll use Kafka" is worse than one who says "writes spike 10× at 9am and consumers are slow, *so* I'll buffer with a queue."

## The seven ways people fail

1. **Jumping to a solution** before clarifying requirements.
2. **No estimation** — so they never discover it's a read-scaling problem.
3. **Stateful app servers** (sessions or files in local memory) — this kills horizontal scaling and they don't notice.
4. **Buzzword soup** — naming Kafka, Cassandra and Kubernetes with no reason attached.
5. **No failure story.** "What if the cache dies?" *"Um."*
6. **No idempotency** anywhere near a payment.
7. **Silence.** Thinking quietly for 4 minutes reads as knowing nothing.

## Three sentences that make you sound senior

- *"Before I design: what's the read:write ratio, and can this data be stale?"*
- *"That's a single point of failure — if it goes down we'd fail **open** here, because a rate-limiter outage shouldn't take down login."*
- *"I'd start with one Postgres instance. We're at 200 writes/second; sharding now would cost us joins and buy us nothing."*

---
---

# 📖 Backend glossary — the terms they'll drop on you

Every one of these has come up in a real backend interview. If you can't define it in one sentence, click the link.

## Scale & traffic

| Term | In one sentence | Learn |
|---|---|---|
| **QPS / RPS** | Queries (requests) per second — the unit of all capacity maths. | [§10.2](#102-back-of-envelope-fast) |
| **Throughput vs latency** | Throughput = how many per second. Latency = how long **one** takes. You can have great throughput and terrible latency. | [§7.2](#72-p95p99--the-average-is-a-liar) |
| **p50 / p95 / p99** | Percentiles. p99 = the slowest 1%. **Nobody experiences the average.** | [§7.2](#72-p95p99--the-average-is-a-liar) |
| **Tail latency** | Your slow requests. A page making 20 calls hits p99 on *almost every load*. | [Latency numbers](https://gist.github.com/jboner/2841832) |
| **Horizontal vs vertical scaling** | Add **more** machines vs a **bigger** machine. Vertical hits a ceiling and a price cliff. | [Primer](https://github.com/donnemartin/system-design-primer#index-of-system-design-topics) |
| **Stateless** | The server keeps nothing between requests → you can kill any box and lose nothing → you can scale out. | [§2.4](#24-stateless-servers--the-thing-that-lets-you-scale) |
| **Load balancer (L4 vs L7)** | L4 routes by IP/port (fast, dumb). L7 reads the HTTP request (slower, can route by path/header). | [Load balancing](https://en.wikipedia.org/wiki/Load_balancing_(computing)) |
| **Sticky session** | Pinning a user to one server. A **smell** — it means you're not stateless. | [§2.4](#24-stateless-servers--the-thing-that-lets-you-scale) |
| **Little's Law** | `L = λW` — concurrency = arrival rate × time in system. Tells you how many in-flight requests you must hold. | [Little's law](https://en.wikipedia.org/wiki/Little%27s_law) |
| **Amdahl's Law** | The serial part of your work caps your speedup. 90% of time in one query → optimise **that**. | [Amdahl's law](https://en.wikipedia.org/wiki/Amdahl%27s_law) |
| **Hot key / hot partition** | One key or shard takes disproportionate traffic (a celebrity, a viral post) and melts one node. | [§10.3](#103-design-news-feed-the-celebrity-problem) |
| **Thundering herd** | Everyone retries or misses the cache *at the same instant* and stampedes the backend. | [Thundering herd](https://en.wikipedia.org/wiki/Thundering_herd_problem) |
| **Back-pressure** | When you can't keep up, **push back** (reject fast, slow the producer) instead of buffering to death. | [§8.1](#81-timeouts--the-default-is-wait-forever) |
| **Load shedding** | Deliberately dropping a fraction of traffic (503) so the rest still gets served. **Half up beats all down.** | [Builders' Library](https://aws.amazon.com/builders-library/) |
| **Token bucket / leaky bucket** | Rate-limit algorithms. Token bucket **allows natural bursts**; leaky bucket smooths to a constant rate. | [Token bucket](https://en.wikipedia.org/wiki/Token_bucket) |
| **Fan-out** | One event → many writes/reads. Fan-out **on write** = precompute. Fan-out **on read** = compute at query time. | [§10.3](#103-design-news-feed-the-celebrity-problem) |
| **Write amplification** | One logical write causes many physical writes (50M followers → 50M feed inserts). | [§10.3](#103-design-news-feed-the-celebrity-problem) |
| **Blast radius** | How much breaks when *this* breaks. Canary deploys shrink it to 5%. | [§9.2](#92-deployment-strategies) |

## Data & storage

| Term | In one sentence | Learn |
|---|---|---|
| **OLTP vs OLAP** | Transactions (many small reads/writes: Postgres) vs analytics (huge scans: ClickHouse). Don't run OLAP on your OLTP box. | [OLTP](https://en.wikipedia.org/wiki/Online_transaction_processing) |
| **Normalization** | One fact, one place. Denormalise **on purpose**, never by accident. | [Normalization](https://en.wikipedia.org/wiki/Database_normalization) |
| **Index** | A sorted lookup structure. 10M rows → **3–4 hops** instead of a full scan. | [§4.1](#41-indexes--the-single-biggest-win) |
| **Composite index / leftmost prefix** | `(a, b)` serves `WHERE a` and `WHERE a AND b`, but **not `WHERE b` alone**. | [§4.1](#41-indexes--the-single-biggest-win) |
| **Covering index** | The index has every column the query needs → *Index Only Scan* → never touches the table. | [Use The Index, Luke](https://use-the-index-luke.com/) |
| **B-tree** | Balanced tree, updates **in place**. Fast reads. Powers Postgres/MySQL. | [B-tree](https://en.wikipedia.org/wiki/B-tree) |
| **LSM tree** | Append to memory, flush sorted files, compact later. **Very fast writes.** Powers Cassandra, RocksDB. | [LSM tree](https://en.wikipedia.org/wiki/Log-structured_merge-tree) |
| **WAL (write-ahead log)** | Append the change to a log and `fsync` **before** touching data files. This is what makes "committed" survive a crash — and what replication and PITR are built on. | [WAL](https://en.wikipedia.org/wiki/Write-ahead_logging) |
| **MVCC** | Don't overwrite a row — write a **new version**. That's why readers never block writers. Cost: `VACUUM`. | [MVCC](https://en.wikipedia.org/wiki/Multiversion_concurrency_control) |
| **ACID** | Atomic, Consistent, Isolated, Durable. | [§4.4](#44-transactions-and-acid) |
| **Isolation levels** | Read committed → repeatable read → serializable. Each blocks more anomalies and costs more. | [§4.6](#46-isolation-levels) |
| **Optimistic vs pessimistic locking** | Optimistic: check a `version` on write, retry on clash. Pessimistic: `SELECT … FOR UPDATE`, others wait. | [§4.5](#45--the-lost-update--a-race-condition-you-will-write) |
| **Partitioning** | Split a big table **within one database** (usually by time). Drop last year = `DROP TABLE`, instantly. | [Postgres docs](https://www.postgresql.org/docs/current/ddl-partitioning.html) |
| **Sharding** | Split rows across **machines** by a shard key. Scales writes; costs you cross-shard joins. | [Sharding](https://en.wikipedia.org/wiki/Shard_(database_architecture)) |
| **Shard key** | The column you split on. Pick it by **how you query**. Wrong key → every query fans out to every shard. | [§4.8](#48-scaling--in-this-exact-order) |
| **Replication lag** | The replica is behind the primary. Causes *"I saved it and it didn't save"*. | [§4.8](#48-scaling--in-this-exact-order) |
| **Quorum (W + R > N)** | Require a **majority** to confirm. A majority can't exist on both sides of a split → no split-brain. | [Quorum](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) |
| **Consistent hashing** | Keys and servers on a ring → adding a node moves **~1/N** of keys, not 80%. | [§10.5](#105--hashkey--n-is-a-trap) |
| **Rendezvous hashing** | Simpler alternative to the ring: pick the server with the highest `hash(key, server)`. | [Rendezvous hashing](https://en.wikipedia.org/wiki/Rendezvous_hashing) |
| **Materialized view** | A precomputed query result, stored. Fast reads, refresh cost. | [Postgres docs](https://www.postgresql.org/docs/current/rules-materializedviews.html) |
| **Object storage (S3)** | Where files go. **Never** the local disk of an app server. | [§2.4](#24-stateless-servers--the-thing-that-lets-you-scale) |
| **CDN** | Cached copies of content physically near the user. | [CDN](https://en.wikipedia.org/wiki/Content_delivery_network) |

## Consistency & distributed systems

| Term | In one sentence | Learn |
|---|---|---|
| **CAP theorem** | When the network partitions, choose **C**onsistency or **A**vailability. P isn't optional. | [§8.5](#85-cap--you-dont-get-to-keep-all-three) |
| **PACELC** | The honest CAP: on Partition choose A or C; **Else** (normal operation) choose **L**atency or **C**onsistency. | [PACELC](https://en.wikipedia.org/wiki/PACELC_theorem) |
| **Linearizability** | Every read sees the latest write, as if there were one copy. The strongest, slowest guarantee. | [Jepsen](https://jepsen.io/consistency) |
| **Serializability** | Concurrent transactions behave as if run one after another. (Different axis from linearizability.) | [Jepsen](https://jepsen.io/consistency) |
| **Eventual consistency** | Replicas converge… eventually. Fine for likes; not for balances. | [Eventual consistency](https://en.wikipedia.org/wiki/Eventual_consistency) |
| **Read-your-writes** | *You* see *your own* changes immediately, even if others lag. **Usually the real requirement.** | [§4.8](#48-scaling--in-this-exact-order) |
| **Monotonic reads** | You never see time go backwards (read new, then old). | [Jepsen](https://jepsen.io/consistency) |
| **Consensus** | Getting N nodes to agree on one value despite failures. | [Consensus](https://en.wikipedia.org/wiki/Consensus_(computer_science)) |
| **Raft / Paxos** | The two consensus algorithms. Raft is the one you can actually explain. Elect a **leader**; the leader orders writes. | [Raft (visual)](https://raft.github.io/) |
| **Leader election** | Choosing the one node allowed to write. Needs a majority, or you get… | [Raft](https://raft.github.io/) |
| **Split-brain** | Two halves of a cluster both think they're the leader and diverge. Quorums prevent it. | [Split-brain](https://en.wikipedia.org/wiki/Split-brain_(computing)) |
| **Fencing token** | A monotonically increasing number attached to a lock, so a **stale** lock-holder's writes get rejected. | [DDIA](https://dataintensive.net/) |
| **Clock skew** | Server clocks drift. **Never order events by wall-clock time** — use a sequence or a Snowflake ID. | [Clock skew](https://en.wikipedia.org/wiki/Clock_skew) |
| **Snowflake ID** | A 64-bit, **time-sortable**, globally unique id generated without coordination (timestamp + machine + counter). | [Snowflake ID](https://en.wikipedia.org/wiki/Snowflake_ID) |
| **Vector clock** | Tracks causality across replicas so you can detect concurrent (conflicting) updates. | [Vector clock](https://en.wikipedia.org/wiki/Vector_clock) |
| **CRDT** | A data type that **merges automatically** without conflict. How collaborative editing and offline sync work. | [CRDT](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type) |
| **Operational Transform (OT)** | The *other* way to do collaborative editing (Google Docs). Transforms concurrent ops against each other. | [OT](https://en.wikipedia.org/wiki/Operational_transformation) |
| **Two-phase commit (2PC)** | Distributed transaction: prepare, then commit. **Blocks** if the coordinator dies. Avoid. | [2PC](https://en.wikipedia.org/wiki/Two-phase_commit_protocol) |
| **Saga** | Replace a distributed transaction with local transactions + **compensating actions** (undo). | [Saga](https://microservices.io/patterns/data/saga.html) |
| **Transactional outbox** | Write the row **and** the event in ONE DB transaction; a relay publishes it. Fixes the dual-write bug. | [§8.6](#86--the-dual-write-problem) |
| **Idempotency** | Doing it twice = doing it once. The single most important word in distributed systems. | [§3.3](#33--idempotency-keys--how-you-stop-double-charges) |
| **At-least-once / at-most-once** | Queues redeliver (duplicates) or drop (loss). Pick your poison — usually at-least-once + idempotency. | [§6.4](#64-queues--respond-now-work-later) |
| **"Exactly-once"** | **A myth**, at the delivery layer. You get at-least-once delivery + idempotent processing, and *call it* exactly-once. | [§6.4](#64-queues--respond-now-work-later) |
| **Gossip protocol** | Nodes randomly tell each other what they know; state spreads without a coordinator. | [Gossip](https://en.wikipedia.org/wiki/Gossip_protocol) |
| **Merkle tree** | Hash tree that lets two replicas find *which* data differs without comparing everything. | [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) |
| **Fallacies of distributed computing** | The 8 comfortable lies (the network is reliable, latency is zero…). Memorise them. | [Fallacies](https://en.wikipedia.org/wiki/Fallacies_of_distributed_computing) |

## Messaging

| Term | In one sentence | Learn |
|---|---|---|
| **Queue vs stream** | Queue: each message goes to **one** worker, then it's gone. Stream/log: **every** consumer group reads it, and it's **replayable**. | [§6.4](#64-queues--respond-now-work-later) |
| **Pub/sub** | Publish to a topic; N subscribers each get a copy. | [Pub/sub](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern) |
| **Consumer group / offset** | Kafka: a group shares the partitions; the **offset** is your bookmark in the log. | [Kafka intro](https://kafka.apache.org/documentation/#introduction) |
| **Partition key** | Decides which partition a message lands in — and therefore **what's ordered relative to what**. Order is per-partition only. | [Kafka intro](https://kafka.apache.org/documentation/#introduction) |
| **Dead-letter queue (DLQ)** | After N failures, move the poison message aside so it stops blocking the line. | [DLQ](https://en.wikipedia.org/wiki/Dead_letter_queue) |
| **Backlog / lag** | How far behind your consumers are. The metric to alert on. | [§6.4](#64-queues--respond-now-work-later) |

## Caching

| Term | In one sentence | Learn |
|---|---|---|
| **Cache-aside** | Read: check cache → miss → load DB → fill cache. Write: **delete** the key. The 90% pattern. | [§6.2](#62-cache-aside--the-pattern-youll-use-90-of-the-time) |
| **Write-through / write-back** | Write to cache+DB together (safe) vs cache now, DB later (**fast, loses data on crash**). | [§6.2](#62-cache-aside--the-pattern-youll-use-90-of-the-time) |
| **Cache stampede** | A hot key expires → 10,000 requests miss simultaneously → the DB dies. | [Stampede](https://en.wikipedia.org/wiki/Cache_stampede) |
| **Cache penetration** | Requests for keys that **don't exist** bypass the cache every time. Cache the negative result. | [§6.3](#63--the-three-ways-a-cache-takes-down-your-database) |
| **Cache avalanche** | Many keys share one expiry and die together. **Add jitter to TTLs.** | [§6.3](#63--the-three-ways-a-cache-takes-down-your-database) |
| **Eviction policy (LRU/LFU)** | What gets dropped when memory fills. `allkeys-lru` for a cache; **`noeviction` for a queue.** | [Redis eviction](https://redis.io/docs/latest/develop/reference/eviction/) |
| **Negative caching** | Caching "this doesn't exist" — cheap, and it kills penetration attacks. | [§6.3](#63--the-three-ways-a-cache-takes-down-your-database) |

## Reliability & operations

| Term | In one sentence | Learn |
|---|---|---|
| **SLA / SLO / SLI** | SLI = the measurement. SLO = your internal target. SLA = the contract with money attached. | [Google SRE](https://sre.google/sre-book/service-level-objectives/) |
| **Error budget** | `100% − SLO`. Budget left → ship fast. Budget spent → **freeze features and fix reliability.** Turns an argument into a number. | [Google SRE](https://sre.google/sre-book/service-level-objectives/) |
| **The nines** | 99% = 3.65 days/yr down. 99.9% = 8.8 hrs. 99.99% = 52 min. **Each nine ≈ 10× the cost.** | [§8](#part-8--reliability) |
| **Circuit breaker** | After N failures, **stop calling** the broken service and fail fast, so it can recover. | [Fowler](https://martinfowler.com/bliki/CircuitBreaker.html) |
| **Bulkhead** | Separate pools per dependency, so one slow downstream can't consume every worker. | [Bulkhead](https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead) |
| **Retry with jitter** | Exponential backoff + **randomness**, or 10,000 clients retry in synchronised waves. | [AWS](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) |
| **Timeout budget** | The user's 3s must be *divided* down the call chain, not handed to every layer. | [§8.1](#81-timeouts--the-default-is-wait-forever) |
| **Graceful degradation** | Recommendations down → show the page **without** them. Degrade, don't die. | [§8.4](#84-graceful-degradation) |
| **Liveness vs readiness** | Liveness fails → **restart** me. Readiness fails → **stop sending traffic**, but don't kill me. Confusing them = restart loops. | [§9.5](#95-observability) |
| **Canary / blue-green** | Canary: 5% of users get the new version. Blue-green: flip 100% at once, flip back instantly. | [§9.2](#92-deployment-strategies) |
| **Feature flag** | **Deploying ≠ releasing.** Ship dark, enable from a dashboard, kill in seconds. | [§9.4](#94-feature-flags--deploying--releasing) |
| **Chaos engineering** | Break it on purpose in staging, so you find the missing timeout before the outage does. | [Chaos](https://en.wikipedia.org/wiki/Chaos_engineering) |
| **Four golden signals** | **Latency, traffic, errors, saturation.** Track these and you catch nearly everything. | [Google SRE](https://sre.google/sre-book/monitoring-distributed-systems/) |
| **MTTR / MTBF** | Mean time to **recover** / **between failures**. Optimising MTTR usually beats chasing MTBF. | [Google SRE](https://sre.google/sre-book/table-of-contents/) |
| **Blameless post-mortem** | Systems fail, not people. Ask what made the mistake *possible*. Blame just teaches people to hide problems. | [Google SRE](https://sre.google/sre-book/postmortem-culture/) |

## Probabilistic & specialised structures

| Term | In one sentence | Learn |
|---|---|---|
| **Bloom filter** | "Definitely not present" or "probably present", in tiny memory. **No false negatives.** Skips pointless disk reads. | [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter) |
| **HyperLogLog** | Approximate **unique** counts (e.g. unique visitors) for millions of items in ~12KB. | [HyperLogLog](https://en.wikipedia.org/wiki/HyperLogLog) |
| **Count-min sketch** | Approximate **frequencies** in fixed memory — "what's trending right now". | [Count-min sketch](https://en.wikipedia.org/wiki/Count%E2%80%93min_sketch) |
| **Trie** | Prefix tree. The answer to **search autocomplete / typeahead**. | [Trie](https://en.wikipedia.org/wiki/Trie) |
| **Inverted index** | word → list of documents containing it. The core of every search engine. | [Inverted index](https://en.wikipedia.org/wiki/Inverted_index) |
| **Geohash / quadtree** | Turn 2D coordinates into something you can **index and range-query**. The answer to "find drivers near me". | [Geohash](https://en.wikipedia.org/wiki/Geohash) |
| **Consistent hash ring** | See above — the answer to "how do you distribute keys across N caches". | [§10.5](#105--hashkey--n-is-a-trap) |

## Architecture

| Term | In one sentence | Learn |
|---|---|---|
| **Monolith vs microservices** | Microservices buy **independent deploys and scaling**; they cost you network calls, distributed transactions, and ops. **Start monolith.** | [Fowler](https://martinfowler.com/articles/microservices.html) |
| **API gateway** | One front door: routing, auth, rate limiting, TLS. | [Primer](https://github.com/donnemartin/system-design-primer#index-of-system-design-topics) |
| **BFF (backend-for-frontend)** | A thin per-client API (mobile vs web) so one client's needs don't warp the core service. | [Fowler](https://martinfowler.com/articles/micro-frontends.html) |
| **Service mesh / sidecar** | Move retries, mTLS, timeouts and tracing *out* of your code into a proxy beside every service. | [Service mesh](https://en.wikipedia.org/wiki/Service_mesh) |
| **Event-driven** | Services publish facts ("order.created"); others react. Decoupled, and much harder to debug. | [Kafka](https://kafka.apache.org/documentation/#introduction) |
| **CQRS** | Separate the **write** model from the **read** model. Powerful, and usually overkill. | [Fowler](https://martinfowler.com/bliki/CQRS.html) |
| **Event sourcing** | Store the **events**, not the current state. Rebuild state by replaying. Full audit log for free. | [Fowler](https://martinfowler.com/eaaDev/EventSourcing.html) |
| **DDD / bounded context** | Draw service boundaries around **business** domains, not technical layers. | [DDD](https://en.wikipedia.org/wiki/Domain-driven_design) |
| **Strangler fig** | Migrate a legacy system by routing features to the new one **one at a time**, until the old one is dead. | [Fowler](https://martinfowler.com/bliki/StranglerFigApplication.html) |
| **12-factor app** | The rules that make an app deployable anywhere (config in env, stateless processes, logs to stdout…). | [12factor](https://12factor.net/) |

---
---

# ❓ 130 system design interview questions

Grouped the way interviews actually go. **The "really testing" column is the point** — the question is never the question.

## A · The 35 classic "Design X" prompts

| # | Design… | The crux they want you to find | Learn |
|:--|---|---|---|
| 1 | **URL shortener** (TinyURL) | Base62-encode a unique id → collisions become *impossible*. 302 not 301, or you lose analytics. | [§10 method](#part-10--system-design) · [Primer](https://github.com/donnemartin/system-design-primer#design-pastebincom-or-bitlycom) |
| 2 | **Twitter / news feed** | Fan-out on write **+ the celebrity exception**. Hybrid, merged at read. | [§10.3](#103-design-news-feed-the-celebrity-problem) |
| 3 | **Instagram** | Feed + object storage for media + CDN. Never store images in the DB. | [Primer](https://github.com/donnemartin/system-design-primer) |
| 4 | **WhatsApp / chat** | WebSockets make servers **stateful** → you need a pub/sub backbone + presence registry. | [§10 · chat](#part-10--system-design) |
| 5 | **Rate limiter** | Token bucket in Redis with an **atomic Lua script**. Fail open or closed? Say which. | [§10.4](#104-design-rate-limiter) |
| 6 | **Web crawler** | Politeness (robots.txt, per-domain rate limit), URL dedupe (**Bloom filter**), a frontier queue. | [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter) |
| 7 | **Search autocomplete / typeahead** | A **trie**, precomputed top-K per prefix, cached hard. Latency budget is ~50ms. | [Trie](https://en.wikipedia.org/wiki/Trie) |
| 8 | **YouTube / Netflix** | Upload → transcode **async** into many resolutions → CDN. The DB stores metadata only. | [Primer](https://github.com/donnemartin/system-design-primer) |
| 9 | **Dropbox / Google Drive** | Chunk files, hash chunks, dedupe, sync deltas — don't re-upload a 2GB file for a one-line change. | [Primer](https://github.com/donnemartin/system-design-primer) |
| 10 | **Google Docs** (collab editing) | **CRDT or OT.** Last-write-wins destroys people's work. | [CRDT](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type) |
| 11 | **Uber / Lyft** | Geospatial index (**geohash/quadtree**) + real-time driver location + matching. | [Geohash](https://en.wikipedia.org/wiki/Geohash) |
| 12 | **Yelp / proximity service** | Same geospatial core; reads dominate → cache aggressively. | [Quadtree](https://en.wikipedia.org/wiki/Quadtree) |
| 13 | **Ticketmaster / seat booking** | **The whole problem is the double-booking race.** Pessimistic lock or atomic conditional update + reservation TTL. | [§4.5](#45--the-lost-update--a-race-condition-you-will-write) |
| 14 | **Payment system** | Idempotency keys, ledger (double-entry), the outbox, and **never** trusting the client's amount. | [§3.3](#33--idempotency-keys--how-you-stop-double-charges) |
| 15 | **Notification system** | Fan-out + per-channel providers + retries + dedupe + user preferences + **DLQ**. | [§6.4](#64-queues--respond-now-work-later) |
| 16 | **Distributed unique ID generator** | **Snowflake**: timestamp + machine id + counter. Time-sortable, no coordination. | [Snowflake ID](https://en.wikipedia.org/wiki/Snowflake_ID) |
| 17 | **Distributed cache** (Redis-like) | Consistent hashing + replication + eviction policy. | [§10.5](#105--hashkey--n-is-a-trap) |
| 18 | **Key-value store** (Dynamo-like) | Consistent hashing, **quorums (W+R>N)**, vector clocks, hinted handoff, read repair. | [Dynamo paper](https://www.allthingsdistributed.com/2007/10/amazons_dynamo.html) |
| 19 | **Object store** (S3-like) | Immutable blobs, metadata DB, erasure coding, multipart upload. | [Primer](https://github.com/donnemartin/system-design-primer) |
| 20 | **Distributed job scheduler** | Leader election, at-least-once execution, **idempotent jobs**, the multi-instance cron trap. | [§6.5](#65--the-cron-trap-that-emails-your-customers-20-times) |
| 21 | **Log aggregation** (ELK-like) | High write volume → append-only, batch, partition by time, LSM-backed. | [The Log](https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying) |
| 22 | **Metrics / monitoring system** | Time-series DB, downsampling/rollups, cardinality explosion is the trap. | [Google SRE](https://sre.google/sre-book/monitoring-distributed-systems/) |
| 23 | **Ad click aggregator** | Massive write volume + **approximate** counts are fine → stream processing, count-min sketch. | [Count-min sketch](https://en.wikipedia.org/wiki/Count%E2%80%93min_sketch) |
| 24 | **Leaderboard** | Redis **sorted set**. O(log n) rank, trivially. Don't `ORDER BY score` a 10M-row table per request. | [Redis types](https://redis.io/docs/latest/develop/data-types/) |
| 25 | **Pastebin** | Like the shortener, plus TTL/expiry and object storage for big pastes. | [Primer](https://github.com/donnemartin/system-design-primer#design-pastebincom-or-bitlycom) |
| 26 | **Stock exchange / order matching** | A single-threaded matching engine per symbol (ordering is everything), event-sourced for audit. | [Event sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) |
| 27 | **Food delivery / DoorDash** | Geospatial + real-time state machine per order + eventual consistency on ETAs. | [Geohash](https://en.wikipedia.org/wiki/Geohash) |
| 28 | **Hotel / airline booking** | Inventory reservation with TTL, **saga** across payment + inventory. | [Saga](https://microservices.io/patterns/data/saga.html) |
| 29 | **Slack / Discord** | Chat + channels + fan-out + presence + read receipts (per-user cursors). | [§10 · chat](#part-10--system-design) |
| 30 | **Email service** (SES-like) | Queue + rate limits per domain + bounce/complaint handling + retries with backoff. | [§8.2](#82-retries--necessary-and-dangerous) |
| 31 | **CDN** | Edge caching, cache keys, purge/invalidation, origin shielding. | [CDN](https://en.wikipedia.org/wiki/Content_delivery_network) |
| 32 | **Google Maps / routing** | Graph partitioning + precomputed shortcuts; you cannot Dijkstra the planet per request. | [Primer](https://github.com/donnemartin/system-design-primer) |
| 33 | **Online judge / code runner** | Untrusted code → **sandboxing** (containers, seccomp), resource limits, queue-based execution. | [12factor](https://12factor.net/) |
| 34 | **Recommendation system** | Offline batch compute → serve from a precomputed store. **Never** compute ML per request. | [High Scalability](http://highscalability.com/) |
| 35 | **API rate-limited public API** (Stripe-like) | Idempotency, versioning, pagination, webhooks, keys per customer. | [§3](#part-3--apis) |

## B · The 30 follow-up deep dives (where you're actually judged)

These are the "okay, now what if…" questions. **This is the real interview.**

| # | Question | What they're really testing | Learn |
|:--|---|---|---|
| 36 | How do you generate unique IDs across many servers? | Do you say Snowflake/ULID, or do you say "auto-increment" and not notice it doesn't work? | [Snowflake ID](https://en.wikipedia.org/wiki/Snowflake_ID) |
| 37 | What happens when a celebrity with 50M followers posts? | Write amplification. The hybrid fan-out. | [§10.3](#103-design-news-feed-the-celebrity-problem) |
| 38 | Your cache goes down. What happens? | Do you thundering-herd the DB to death? Do you fail open or closed? | [§6.3](#63--the-three-ways-a-cache-takes-down-your-database) |
| 39 | How do you avoid double-charging a customer? | **Idempotency keys.** If you say "retries", you failed. | [§3.3](#33--idempotency-keys--how-you-stop-double-charges) |
| 40 | Two users book the last seat at the same time. | The lost-update race. Atomic conditional update or `FOR UPDATE`. | [§4.5](#45--the-lost-update--a-race-condition-you-will-write) |
| 41 | How do you shard this? What's the shard key? | Do you pick by **access pattern**, or by whatever's unique? | [§4.8](#48-scaling--in-this-exact-order) |
| 42 | A shard gets hot. Now what? | Hot partition. Split it, salt the key, or cache in front. | [§10.3](#103-design-news-feed-the-celebrity-problem) |
| 43 | How do you add a cache server without a DB meltdown? | **Consistent hashing.** `% N` remaps 80% of keys. | [§10.5](#105--hashkey--n-is-a-trap) |
| 44 | How do you guarantee message ordering? | Order is **per-partition**. Same key → same partition. Global ordering costs you throughput. | [Kafka](https://kafka.apache.org/documentation/#introduction) |
| 45 | Your queue delivers a message twice. | At-least-once is the default. **Make the consumer idempotent.** | [§6.4](#64-queues--respond-now-work-later) |
| 46 | How do you write to the DB *and* publish an event atomically? | The **dual-write problem** → transactional outbox. | [§8.6](#86--the-dual-write-problem) |
| 47 | The user updates their profile and it "doesn't save". | **Replica lag.** Route their reads to the primary briefly. | [§4.8](#48-scaling--in-this-exact-order) |
| 48 | How do you paginate a feed that's constantly changing? | **Cursor**, not offset — or users see duplicates and gaps. | [§3.2](#32--never-return-an-unbounded-list) |
| 49 | A downstream service becomes slow (not down). | The killer. Timeouts + circuit breaker, or your pool exhausts and you go down with it. | [§8.1](#81-timeouts--the-default-is-wait-forever) |
| 50 | 10,000 clients all retry at once. | Thundering herd → **jitter**. | [AWS](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) |
| 51 | How do you run a nightly job on 20 instances? | The cron trap → distributed lock or a real scheduler. | [§6.5](#65--the-cron-trap-that-emails-your-customers-20-times) |
| 52 | How do you rename a column with zero downtime? | Expand/contract — **six steps**. Old and new code run simultaneously. | [§9.3](#93--zero-downtime-migrations-old-and-new-code-run-at-the-same-time) |
| 53 | How do you deploy without dropping requests? | Rolling/canary + **readiness probes** + graceful shutdown on SIGTERM. | [§9.2](#92-deployment-strategies) |
| 54 | Your DB hits its connection limit. | `pool × instances`. PgBouncer. | [§4.7](#47--connection-pooling--the-one-that-takes-down-production) |
| 55 | How do you find *which* query is slow? | `pg_stat_statements` ordered by **total** time, then `EXPLAIN ANALYZE`. | [§4.2](#42-reading-an-explain-plan) |
| 56 | p99 is 4s but p50 is 50ms. Why? | Tail causes differ from median causes: GC, cold cache, locks, retries, a slow replica. | [§7.2](#72-p95p99--the-average-is-a-liar) |
| 57 | How do you handle a 10× traffic spike? | Queue to absorb, autoscale, **load shed**, degrade non-critical features. | [§8.4](#84-graceful-degradation) |
| 58 | How do you prevent one customer from starving the rest? | Per-tenant rate limits + bulkheads (separate pools). | [Bulkhead](https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead) |
| 59 | How do you store 100M images? | Object storage + CDN. **Not** the DB, **not** the local disk. | [§2.4](#24-stateless-servers--the-thing-that-lets-you-scale) |
| 60 | How do you do full-text search? | Inverted index (Elasticsearch) **beside** the source of truth — never *as* it. | [Inverted index](https://en.wikipedia.org/wiki/Inverted_index) |
| 61 | How do you find "restaurants near me"? | Geohash / quadtree — you cannot scan every row and compute distance. | [Geohash](https://en.wikipedia.org/wiki/Geohash) |
| 62 | How do you count unique visitors cheaply? | **HyperLogLog** — ~12KB for millions, approximate. | [HyperLogLog](https://en.wikipedia.org/wiki/HyperLogLog) |
| 63 | How do you avoid pointless disk reads for missing keys? | **Bloom filter** in front. No false negatives. | [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter) |
| 64 | What if the leader node dies? | Election via consensus (Raft), **majority quorum**, fencing tokens to stop the old leader. | [Raft](https://raft.github.io/) |
| 65 | How would you migrate this to a new database with no downtime? | Dual-write + backfill + shadow reads + cutover + rollback plan. | [PlanetScale](https://planetscale.com/blog/backwards-compatible-databases-changes) |

## C · The 40 concept & terminology questions

Rapid-fire. If you can't answer in **two sentences**, you don't know it yet.

| # | Question | Learn |
|:--|---|---|
| 66 | What is the CAP theorem — and why is "pick two" misleading? | [§8.5](#85-cap--you-dont-get-to-keep-all-three) |
| 67 | What is PACELC and why is it more honest than CAP? | [PACELC](https://en.wikipedia.org/wiki/PACELC_theorem) |
| 68 | Strong vs eventual consistency — give a real example of each. | [Jepsen](https://jepsen.io/consistency) |
| 69 | What is read-your-writes consistency, and why do users notice when you don't have it? | [§4.8](#48-scaling--in-this-exact-order) |
| 70 | What is linearizability? How is it different from serializability? | [Jepsen](https://jepsen.io/consistency) |
| 71 | Explain ACID. Which letter do NoSQL stores usually trade away? | [§4.4](#44-transactions-and-acid) |
| 72 | What are the isolation levels, and what anomaly does each still allow? | [§4.6](#46-isolation-levels) |
| 73 | What is a dirty read / non-repeatable read / phantom / write skew? | [§4.6](#46-isolation-levels) |
| 74 | Optimistic vs pessimistic locking — when would you use each? | [§4.5](#45--the-lost-update--a-race-condition-you-will-write) |
| 75 | What is MVCC and why does it mean readers don't block writers? | [MVCC](https://en.wikipedia.org/wiki/Multiversion_concurrency_control) |
| 76 | What is a write-ahead log, and what three jobs does it do? | [WAL](https://en.wikipedia.org/wiki/Write-ahead_logging) |
| 77 | B-tree vs LSM tree — which for a write-heavy workload, and why? | [LSM](https://en.wikipedia.org/wiki/Log-structured_merge-tree) |
| 78 | How does an index actually make a lookup fast? | [§4.1](#41-indexes--the-single-biggest-win) |
| 79 | Why can a composite index on `(a, b)` not serve `WHERE b = ?`? | [§4.1](#41-indexes--the-single-biggest-win) |
| 80 | Why is an index on a boolean column usually useless? | [§4.1](#41-indexes--the-single-biggest-win) |
| 81 | What's an N+1 query, and how does an ORM cause it silently? | [§4.3](#43-the-n1-query--the-most-common-bug-in-backend-code) |
| 82 | Why is `OFFSET 100000` slow — and what's the correctness bug? | [§3.2](#32--never-return-an-unbounded-list) |
| 83 | Partitioning vs sharding — what's the actual difference? | [§4.8](#48-scaling--in-this-exact-order) |
| 84 | What is consistent hashing, and what breaks with `hash % N`? | [§10.5](#105--hashkey--n-is-a-trap) |
| 85 | What are virtual nodes and why do you need them? | [§10.5](#105--hashkey--n-is-a-trap) |
| 86 | What is a quorum? Why `W + R > N`? Why an **odd** number of nodes? | [Quorum](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) |
| 87 | What is split-brain, and what prevents it? | [Split-brain](https://en.wikipedia.org/wiki/Split-brain_(computing)) |
| 88 | Explain Raft in 60 seconds. | [Raft](https://raft.github.io/) |
| 89 | Why should you never order distributed events by wall-clock time? | [Clock skew](https://en.wikipedia.org/wiki/Clock_skew) |
| 90 | What is idempotency, and which HTTP methods are idempotent? | [§1.2](#12-the-methods-and-the-property-that-matters) |
| 91 | Why is "exactly-once delivery" a myth — and what do you do instead? | [§6.4](#64-queues--respond-now-work-later) |
| 92 | Queue vs stream (Kafka) — when do you need replay? | [§6.4](#64-queues--respond-now-work-later) |
| 93 | What is a dead-letter queue and what problem does it solve? | [DLQ](https://en.wikipedia.org/wiki/Dead_letter_queue) |
| 94 | What is the dual-write problem? What's the outbox pattern? | [§8.6](#86--the-dual-write-problem) |
| 95 | What is a saga, and what is a compensating transaction? | [Saga](https://microservices.io/patterns/data/saga.html) |
| 96 | Why avoid two-phase commit? | [2PC](https://en.wikipedia.org/wiki/Two-phase_commit_protocol) |
| 97 | Cache-aside vs write-through vs write-back — trade-offs? | [§6.2](#62-cache-aside--the-pattern-youll-use-90-of-the-time) |
| 98 | Why delete the cache key on write instead of updating it? | [§6.2](#62-cache-aside--the-pattern-youll-use-90-of-the-time) |
| 99 | What are cache stampede, penetration, and avalanche? | [§6.3](#63--the-three-ways-a-cache-takes-down-your-database) |
| 100 | What is a circuit breaker? What are its three states? | [Fowler](https://martinfowler.com/bliki/CircuitBreaker.html) |
| 101 | Why must retries have jitter? | [AWS](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) |
| 102 | Liveness vs readiness probe — what breaks if you confuse them? | [§9.5](#95-observability) |
| 103 | SLA vs SLO vs SLI. What's an error budget *for*? | [Google SRE](https://sre.google/sre-book/service-level-objectives/) |
| 104 | What is a Bloom filter? Can it produce a false negative? | [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter) |
| 105 | Why is CORS not a security feature of your API? | [§3.6](#36-cors--what-it-actually-is) |

## D · The 12 estimation questions

They want **orders of magnitude**, not decimals. Round `86,400` to `~100k` and move on.

| # | Question | Method |
|:--|---|---|
| 106 | How many requests per second is 1M requests/day? | `1M / 86,400 ≈ 12/s`. Peak ≈ 2–10×. |
| 107 | Estimate QPS for a service with 100M DAU doing 10 actions/day. | `1B / 86,400 ≈ 11.5k/s`; peak ~50–100k/s. |
| 108 | How much storage for 500M tweets/day at 300 bytes, kept 5 years? | `500M × 300B × 365 × 5 ≈ 270 TB`. |
| 109 | How many servers do you need for 100k QPS? | Per-server QPS (say 1–5k) → 20–100 boxes + headroom. **State your assumption.** |
| 110 | How much memory to cache the hot 20% of 100M users? | `20M × ~1KB ≈ 20 GB` → a few Redis nodes. |
| 111 | How much bandwidth to stream video to 1M concurrent users at 5 Mbps? | `5 Tbps` → **this is why CDNs exist.** |
| 112 | Can this fit on one machine? | Almost always yes for < ~1TB and < ~10k QPS. **Say so** — it's the senior answer. |
| 113 | What's the latency budget for a page making 20 backend calls? | If the page must be < 1s, each call gets ~50ms **or must run in parallel.** |
| 114 | How many DB connections should the pool have? | `≈ 2 × cores` — 10–30, not 300. Then × instances. | 
| 115 | How long to backfill 500M rows? | Batches of ~10k, rate-limited to protect prod. Compute the hours. **Never one UPDATE.** |
| 116 | How big is the index on a 100M-row table? | Roughly `rows × key size × ~1.5`. It must fit in RAM to be fast. |
| 117 | What read:write ratio makes caching worth it? | Anything read-heavy. At 100:1, caching is the *entire* design. |

## E · The 13 trade-off questions ("it depends" — but say *why*)

| # | Question | The answer that scores |
|:--|---|---|
| 118 | SQL or NoSQL for this? | **"What's the access pattern?"** Start Postgres; justify leaving it. | 
| 119 | Monolith or microservices? | **Start monolith.** Microservices buy independent deploys, cost you distributed transactions. | 
| 120 | Strong or eventual consistency? | **Per field.** Balance = strong. Like-count = eventual. |
| 121 | Fan-out on write or on read? | **Hybrid.** Write for normal users, read for celebrities. |
| 122 | Sync or async? | If the user doesn't need the result to continue → **async**. |
| 123 | REST or gRPC? | Public/browser → REST. Internal, high-volume, typed → gRPC. |
| 124 | REST or GraphQL? | GraphQL for many clients with varied shapes — **but you own N+1 and caching.** |
| 125 | Cache TTL or explicit invalidation? | **Both.** Invalidate on write, and keep a TTL as the backstop for the bug you didn't foresee. |
| 126 | Fail open or fail closed when Redis dies? | **Open** for a normal API. **Closed** for login and payments. Saying which *is* the answer. |
| 127 | Read replica or cache? | Cache for hot repeated reads. Replica for broad read scaling. Both cost you staleness. |
| 128 | Polling, SSE, or WebSockets? | Poll if seconds are fine. **SSE** for one-way push. WebSockets only if you truly need bidirectional. |
| 129 | Shard now or later? | **Later.** Index, fix N+1s, cache, replicate, partition — *then* shard. |
| 130 | Build or buy? | Buy, until the thing you'd buy becomes your core differentiator. |

## 📺 Where to practise these

| Resource | Why |
|---|---|
| [System Design Primer](https://github.com/donnemartin/system-design-primer) | The most complete free resource. **Start here.** Has worked solutions with diagrams. |
| [ByteByteGo YouTube](https://www.youtube.com/@ByteByteGo) | Short, sharp walkthroughs of exactly these prompts. Free. |
| [High Scalability](http://highscalability.com/) | How real companies actually built it — the best sanity check on your instincts. |
| [Designing Data-Intensive Applications](https://dataintensive.net/) | The theory under every answer above. Read it twice. |
| [AWS Builders' Library](https://aws.amazon.com/builders-library/) | How a hyperscaler really handles timeouts, retries, load shedding. Free. |
| [Jepsen analyses](https://jepsen.io/analyses) | What databases *actually* guarantee, tested to destruction. |
| [Raft visualisation](https://raft.github.io/) | Watch consensus happen. It stops being magic in 5 minutes. |

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

### 👉 **[backend.nextjoblist.com](https://backend.nextjoblist.com/)** — free, no signup

Everything above, plus **68 lessons with quizzes**, **36 reference pages**, the **[130-question bank](https://backend.nextjoblist.com/pro/system-design/questions)**, progress tracking, ⌘K search, and every code example in 4 languages.

Or run it yourself — it's the same repo:

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
