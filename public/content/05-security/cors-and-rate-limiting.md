# CORS & Rate Limiting

Two guardrails you'll configure on almost every API — and the first is the single most misunderstood topic for frontend devs moving to backend.

---

# Part 1: CORS

You've seen this error:

```
Access to fetch at 'https://api.example.com/users' from origin
'https://app.example.com' has been blocked by CORS policy.
```

## What's actually happening

By default, browsers enforce the **Same-Origin Policy**: JavaScript on `app.example.com` may not read responses from `api.example.com`. An *origin* = scheme + host + port. Any difference = a different origin.

This exists to protect users: without it, a malicious site could silently call your bank's API using your logged-in cookies and **read the response**.

**CORS** (Cross-Origin Resource Sharing) is how a server says *"it's okay, I trust that origin."*

## Three things that surprise people

1. **CORS is enforced by the browser, not the server.** The request often *does* reach your server, and your server *does* respond — the browser then refuses to hand the response to JavaScript. That's why `curl` and Postman "work" while the browser fails.
2. **CORS is not security for your API.** It protects *users' browsers*. It does nothing against curl, scripts, or bots. Your real protection is authentication + authorization.
3. **The fix belongs on the server** — the *API* must send the headers. You can't fix CORS from the frontend.

## The headers

```http
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

## Preflight requests

For anything beyond a "simple" request (custom headers, `PUT`/`DELETE`, JSON content type), the browser first sends an **`OPTIONS`** "preflight" asking permission. Your server must answer it — if `OPTIONS` 404s, the real request never happens.

```js
// JavaScript (Express)
import cors from "cors";
app.use(cors({
  origin: ["https://app.example.com"],   // ✅ specific, not "*"
  credentials: true,                      // required for cookies
}));
```

```python
# Python (FastAPI)
app.add_middleware(CORSMiddleware,
    allow_origins=["https://app.example.com"],
    allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"])
```

> ⚠️ `Access-Control-Allow-Origin: *` **cannot** be combined with credentials, and it's a bad habit for a private API. List your real origins.

---

# Part 2: Rate Limiting

**Rate limiting** caps how many requests a client may make in a window. It protects you from abuse, brute-force login attempts, scrapers, runaway loops, and surprise cloud bills.

## Algorithms

- **Fixed window** — "100 requests per minute." Simple, but allows a burst at the window edge (200 in 2 seconds across a boundary).
- **Sliding window** — smooths that edge by looking at a rolling period.
- **Token bucket** — tokens refill at a steady rate; each request spends one. Allows **short bursts** up to the bucket size, then throttles. The most popular choice.
- **Leaky bucket** — enforces a perfectly constant output rate.

## Implementing it

Limit per **API key / user ID** when authenticated, per **IP** otherwise. Store the counters in **Redis** so the limit is shared across all your servers (an in-memory counter breaks the moment you run two instances).

```js
// JavaScript (express-rate-limit + Redis)
app.use(rateLimit({
  windowMs: 60_000,        // 1 minute
  limit: 100,              // 100 requests per window
  standardHeaders: true,   // send RateLimit-* headers
  store: new RedisStore({ client }),  // shared across servers
}));
```

## Respond properly

Return **`429 Too Many Requests`**, and tell the client when to come back:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
RateLimit-Limit: 100
RateLimit-Remaining: 0
```

Apply **tighter limits on sensitive endpoints** — `/login`, `/password-reset`, and anything that sends email or costs money.

## Key takeaways

- **CORS** is a **browser** mechanism; the **server** grants permission via `Access-Control-Allow-*` headers. It protects users, not your API.
- Non-simple requests trigger an **`OPTIONS` preflight** you must handle. Never use `*` with credentials.
- **Rate limiting** stops abuse and brute force — **token bucket** is the go-to algorithm.
- Store counters in **Redis** (shared), return **429** with `Retry-After`, and lock down `/login` hardest.
