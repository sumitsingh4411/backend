# The Client–Server Model

Almost every backend follows one simple pattern: **clients ask, servers answer.** Once this clicks, the whole web makes sense — and so do the parts that seem weird.

## The two roles

- **Client** — starts the conversation by sending a *request*. A browser, a mobile app, another server, `curl`, Postman — all clients.
- **Server** — a program that **listens** for requests and sends back *responses*. It runs continuously, waiting. It is, essentially, a very patient program in an infinite loop.

```
CLIENT                              SERVER
──────                              ──────
                                    (idle, listening on port 443…)
"GET /products"        ──────────▶  wakes up
                                    looks up products in the database
                       ◀──────────  "200 OK  + [ {…}, {…} ]"
                                    (goes back to listening)
```

## Rule 1: the client always starts

A normal server **never randomly calls a client.** It can only respond. It doesn't know your phone number; it only knows how to answer the phone.

Sit with that for a second, because it creates a genuine problem:

> **If the server can't speak first, how does a chat app notify you of a new message?**

This is a real limitation, and there are three answers — every one of them a workaround for this rule:

1. **Polling** — the client keeps asking, "anything new? anything new?" Simple, wasteful, laggy.
2. **WebSockets** — the client opens a *persistent* connection and holds it open, so the server can push down it. (The client still initiated it!)
3. **Push notifications** — the client pre-registers with Apple/Google, who *do* hold an open channel to the device.

Notice that even WebSockets don't break the rule — the client still knocks first. It just keeps the door propped open afterwards. We'll build on this later.

## Rule 2: HTTP is stateless

Each request stands **completely alone**. The server does not secretly remember you between requests. It has amnesia by design.

> **Analogy — the drive-through.** Each car pulls up and states its **full order**. The worker doesn't remember your face from yesterday, or even from ten minutes ago. If you want your loyalty discount, you hand over your **loyalty card every single time**.

So how are you "logged in"?

**You're not — not really.** The client re-sends **proof of identity on every single request**:

```http
GET /my-orders HTTP/1.1
Authorization: Bearer eyJhbGci...     ← re-sent EVERY time

GET /my-profile HTTP/1.1
Authorization: Bearer eyJhbGci...     ← again. And again. Forever.
```

**State is passed along, not silently held.** "Being logged in" is a fiction the client maintains by repeating itself.

### Why would anyone design it this way?

Statelessness sounds like a drawback. It's actually the reason the web scales:

- **Any server can handle any request.** If the server remembered you, you'd have to keep talking to *that exact machine*. Instead, you can have 50 identical servers behind a load balancer and it makes no difference which one you hit.
- **A server can crash and be replaced** and you won't even notice.
- **Requests can be cached, retried, and load-balanced freely.**

> 🔑 **This one design choice is what makes horizontal scaling possible.** You'll meet it again in the Scaling lesson — and you'll understand *why* "keep your servers stateless" is such an iron rule.

## One server, many clients

A single server handles thousands of clients at once. Each request is independent, so there's no confusion about who's who — the identity rides along in the request.

## Rule 3: the roles are situational, not permanent

Here's the part that surprises people. **"Client" and "server" are roles in a conversation, not types of machine.**

Your API server is a *server* when your browser calls it. But the moment it queries the database — **it becomes a client**:

```
   Browser  ──request──▶  Your API  ──request──▶  Database
   (client)               (server)               (server)
                             ↓
                    …and simultaneously:
                             ↓
                       Your API  ──request──▶  Stripe API
                       (client!)                (server)
```

Your backend is a **server** to the browser and a **client** to the database, to Stripe, to Redis, and to every other service it calls.

This matters more than it sounds. It means **every lesson about being a good client applies to your own backend**: timeouts, retries, handling failure. When Stripe is slow, *your* server is the one left waiting — and if you didn't set a timeout, *you* are the one who hangs.

These chains are how all large systems are built.

## Putting it together

```
              ┌──────────── your backend ────────────┐
              │  (a server here, a client there)     │
Browser ─────▶│                                      │
(client)      │  ──▶ Database    (it's the client)   │
              │  ──▶ Redis       (it's the client)   │
              │  ──▶ Stripe API  (it's the client)   │
              └──────────────────────────────────────┘
```

## Key takeaways

- Clients **request**; servers **listen and respond**. **The client always starts** — which is exactly why real-time push (WebSockets, notifications) needs special machinery.
- HTTP is **stateless**: each request stands alone, and identity is **re-sent every time** via a cookie or token. "Logged in" is the client repeating itself.
- **Statelessness is a feature** — it's what lets any server handle any request, and therefore what makes **horizontal scaling** possible.
- **Client and server are roles, not machines.** Your backend is a server to the browser and a **client** to the database, cache, and every third-party API — so it inherits all of a client's problems (timeouts, retries, failure).
