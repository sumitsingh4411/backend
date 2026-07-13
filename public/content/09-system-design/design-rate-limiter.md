# Design: Rate Limiter

Build a service that caps how many requests a client may make — protecting you from abuse, brute force, scrapers, and runaway bills. A favorite interview question because the "obvious" solution is subtly broken.

## Requirements

- Limit each client to **N requests per time window** (e.g. 100/min).
- Return **429 Too Many Requests** when exceeded, with `Retry-After`.
- Must work **across many servers** (a shared limit, not per-instance).
- Must be **fast** — it runs on *every* request, so it can't add real latency.
- Fail **open** or **closed**? Decide deliberately (see below).

## Where does it live?

- **API Gateway / reverse proxy** — the usual place. Rejects abuse *before* it reaches your app. ✅
- **Middleware in the app** — easy, more flexible, but the request already cost you resources.
- **A dedicated service** — for complex, shared rules across many teams.

## Identify the client

- **Authenticated** → limit by **user ID / API key** (the right answer).
- **Anonymous** → limit by **IP**.

⚠️ IP limiting is blunt: an entire office or mobile carrier can share one NAT'd IP, so you'd throttle innocent users. And behind a proxy, remember to read the real IP from `X-Forwarded-For`.

## The algorithms

### 1. Fixed window — simple, but broken at the edges

Count requests per fixed clock window ("100 per minute").

```
10:00:00 – 10:00:59   →   counter = 0..100
10:01:00              →   counter resets
```

❌ **The edge burst problem:** a client sends 100 requests at `10:00:59` and 100 more at `10:01:00`. That's **200 requests in one second** — while technically never breaking "100 per minute."

### 2. Sliding window log — accurate, expensive

Store a timestamp for every request; count those within the last 60s. Perfectly accurate, but memory grows with request volume. Rarely worth it.

### 3. Sliding window counter — a good compromise

Blend the current and previous window by how far you are into the current one. Smooths the edge burst with O(1) memory. Widely used.

### 4. ✅ Token bucket — the industry favorite

A bucket holds up to **B** tokens and refills at **R** tokens/second. Each request spends one token. No tokens → reject.

```
capacity = 10 tokens, refill = 1 token/sec

  ▸ Idle a while → bucket fills to 10
  ▸ A burst of 10 requests → all allowed instantly (spends the savings)
  ▸ After that → limited to ~1/sec as it refills
```

**Why it wins:** it allows **short, natural bursts** (real users click things in bursts) while enforcing a steady average rate. It's O(1) memory: just store `tokens` and `last_refill_time`.

### 5. Leaky bucket — perfectly smooth output

Requests queue and drain at a constant rate. Great when a downstream system needs a strictly even flow; adds latency (queuing).

## Implementation — and the concurrency trap

**Naive version (broken):**

```js
// ❌ RACE CONDITION — two requests can both read "99" and both pass
const count = await redis.get(key);
if (count >= limit) return reject();
await redis.set(key, count + 1);
```

Between the read and the write, another server does the same. Classic **check-then-act** race.

**The fix: make it atomic.** Redis executes a Lua script atomically:

```lua
-- token_bucket.lua — refill + consume in ONE atomic step
local tokens_key    = KEYS[1]
local timestamp_key = KEYS[2]
local rate     = tonumber(ARGV[1])   -- tokens per second
local capacity = tonumber(ARGV[2])
local now      = tonumber(ARGV[3])

local tokens = tonumber(redis.call("get", tokens_key)) or capacity
local last   = tonumber(redis.call("get", timestamp_key)) or now

-- refill based on elapsed time
local delta = math.max(0, now - last)
tokens = math.min(capacity, tokens + delta * rate)

local allowed = tokens >= 1
if allowed then tokens = tokens - 1 end

redis.call("set", tokens_key, tokens)
redis.call("set", timestamp_key, now)
return { allowed and 1 or 0, tokens }
```

```js
// Atomic — no race, works across every server
const [allowed, remaining] = await redis.eval(script, 2,
  `bucket:${userId}`, `ts:${userId}`, rate, capacity, Date.now() / 1000);

if (!allowed) {
  res.set("Retry-After", "1");
  res.set("RateLimit-Remaining", "0");
  return res.status(429).json({ error: "Too many requests" });
}
```

**Redis is the shared store** — that's what makes the limit global rather than per-instance. (An in-memory counter silently multiplies your limit by the number of servers.)

## Respond properly

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 1789000030
```

Telling clients **when to retry** turns a hostile error into a cooperative one — good clients will back off instead of hammering you.

## Design decisions worth stating

- **Fail open or closed?** If Redis is down: **fail open** (allow traffic) for a normal API — a cache outage shouldn't take down your whole site. **Fail closed** for login/payments, where abuse is worse than downtime. *Say which and why — this is what interviewers listen for.*
- **Tiered limits** — free: 100/hr, paid: 10,000/hr.
- **Tighter limits on sensitive endpoints** — `/login`, `/password-reset`, anything that sends email or costs money.
- **Latency** — the Redis call must be ~1ms; co-locate it. Consider a local in-memory bucket as a first pass, with Redis as the shared source of truth.

## Key takeaways

- **Token bucket** is the default: allows natural bursts, enforces an average rate, O(1) memory.
- **Fixed window** has an **edge-burst flaw** (2× the limit across a boundary).
- Use **Redis + an atomic Lua script** — a naive read-then-write is a **race condition**, and local counters break the limit across servers.
- Return **429 with `Retry-After`**; limit by **user/API key** over IP; decide **fail-open vs fail-closed** deliberately.
