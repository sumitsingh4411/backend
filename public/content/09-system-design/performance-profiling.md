# Performance & Profiling

Someone says *"the app is slow."* Most engineers immediately start guessing — add a cache, rewrite the hot loop, add servers. **All of it is wasted effort until you know where the time actually goes.**

> **Rule zero: measure first. The bottleneck is almost never where you think it is.**

## Amdahl's law — why guessing fails

If 90% of a request's time is one database query, then making **all your application code infinitely fast** — a perfect, zero-cost rewrite — gains you **10%**.

```
Request: 500ms total
├── app logic     50ms   (10%)  ← optimizing this to ZERO saves 50ms
└── DB query     450ms   (90%)  ← this is the entire problem
```

Speedup is capped by the part you *don't* fix. So find the dominant cost and fix **that**. Everything else is theatre.

## Latency numbers you should internalize

These orders of magnitude should shape every design decision you make:

```
L1 cache reference                    0.5 ns
Main memory reference               100   ns
Compress 1KB                      3,000   ns   (3 µs)
Send 1KB over 1 Gbps network     10,000   ns   (10 µs)
SSD random read                 150,000   ns   (150 µs)
Round trip within a datacenter  500,000   ns   (0.5 ms)
Disk seek (spinning)         10,000,000   ns   (10 ms)
Round trip CA → Netherlands 150,000,000   ns   (150 ms)
```

**What this tells you:**
- **Memory is ~200× faster than SSD** → that's *why* caching works.
- **A network round trip (~0.5ms) dwarfs almost any computation** → **reducing the number of calls beats optimizing the code inside them.** This is why the N+1 problem is so devastating: 100 round trips × 0.5ms = 50ms of *pure waiting*, before the queries even run.
- **Cross-continent is ~150ms** → put servers near users; no amount of code tuning fixes the speed of light.

## Measure the right thing: percentiles, not averages

```
Requests: 95 take 50ms, 5 take 5,000ms

Average  = 297ms    → "hmm, a bit slow"          🤥 hides the disaster
p50      =  50ms    → "fine!"
p95      =  50ms    → "fine!"
p99      = 5000ms   → 🚨 1 in 100 users waits FIVE SECONDS
```

The average is a **liar**. It smears the pain of your worst-served users into a comfortable-looking number.

> **Track p50, p95, p99.** And remember: a page making 20 API calls will hit its p99 on *most* page loads. Your tail latency **is** your typical user experience.

## The method (don't skip steps)

### 1. Find the slow *endpoint* — APM / metrics

Start wide. Which route is slow, and how slow?

```
GET  /api/feed        p99: 3,200ms   ← 🚨 start here
POST /api/orders      p99:   240ms
GET  /api/users/:id   p99:    45ms
```

Sort by **total time consumed** (`latency × call count`), not just the slowest single call. A 20ms endpoint hit a million times matters more than a 5-second report run once a day.

### 2. Find the slow *layer* — distributed tracing

Break one slow request into spans:

```
GET /api/feed ─────────────────────────── 3,200ms
├── auth check                    12ms
├── db: fetch follows             28ms
├── db: fetch posts (×100)     2,900ms   ← 🚨 N+1! 100 queries
├── render                         30ms
└── serialize                     230ms
```

The trace **hands you the culprit**. This is why you instrument (OpenTelemetry) *before* you have a problem.

### 3. Find the slow *line* — a profiler

If the time is genuinely inside your code, profile it. A **flame graph** shows which functions consume CPU:

```
┌──────────────────────────────────────────────────────┐
│                    handleRequest (100%)              │
├──────────────────────┬───────────────────────────────┤
│  serialize (8%)      │      renderFeed (89%)         │
├──────────────────────┼──────────┬────────────────────┤
│                      │ fmt (4%) │  deepClone (84%) 🔥│  ← the real cost
└──────────────────────┴──────────┴────────────────────┘
```

**Width = time.** The widest box at the bottom of a stack is your bottleneck. Here, a `deepClone` nobody suspected is eating 84% of CPU.

```bash
# Node.js
node --cpu-prof server.js        # → load into Chrome DevTools
clinic flame -- node server.js

# Python
py-spy record -o profile.svg --pid 1234    # no code changes, works in prod!

# Go — built in, and excellent
import _ "net/http/pprof"
go tool pprof -http=:8080 http://localhost:6060/debug/pprof/profile

# Java
async-profiler / JFR
```

> **`py-spy` and `pprof` can profile a *running production process*** with negligible overhead. Learn one.

## The usual suspects (in order of likelihood)

1. **N+1 queries** — 100 round trips instead of 1. *By far the most common.*
2. **A missing index** — a Seq Scan over millions of rows.
3. **No caching** — recomputing identical expensive results endlessly.
4. **Serial I/O that could be parallel:**
   ```js
   // ❌ 300ms — sequential
   const user = await getUser(id);
   const orders = await getOrders(id);
   const prefs = await getPrefs(id);

   // ✅ 100ms — they don't depend on each other!
   const [user, orders, prefs] = await Promise.all([
     getUser(id), getOrders(id), getPrefs(id),
   ]);
   ```
5. **Blocking the event loop** (Node) — a synchronous JSON parse of a 50MB payload, or `bcrypt` at high cost, freezes *every* concurrent request.
6. **Over-fetching** — `SELECT *`, returning 500 rows to render 20.
7. **Chatty external APIs** — 5 sequential third-party calls.

> Notice: **six of the seven are I/O and round trips, not CPU.** Backend performance is overwhelmingly about *waiting*, not computing. Junior engineers optimize loops; senior engineers eliminate round trips.

## Load testing — find the cliff before users do

Profiling tells you where time goes at *current* load. **Load testing** tells you what happens at 10×.

```js
// k6
import http from "k6/http";
export const options = {
  stages: [
    { duration: "2m", target: 100 },   // ramp up
    { duration: "5m", target: 100 },   // hold
    { duration: "2m", target: 1000 },  // spike — where does it break?
  ],
  thresholds: { http_req_duration: ["p(95)<500"] },   // fail the test if breached
};
export default function () {
  http.get("https://api.example.com/feed");
}
```

Systems don't degrade linearly — they hit a **cliff** (the connection pool saturates, memory swaps, the DB starts queuing) and collapse. **Find your cliff on a Tuesday afternoon, not during a product launch.**

## Optimization checklist (cheapest first)

| Fix | Effort | Typical win |
|---|---|---|
| Add a missing index | Minutes | 🚀🚀🚀 100×+ |
| Kill an N+1 | ~1 hour | 🚀🚀🚀 10–50× |
| Parallelize independent I/O | ~1 hour | 🚀🚀 2–3× |
| Add a cache | Hours | 🚀🚀 10× on reads |
| Tune the query / `SELECT` fewer columns | Hours | 🚀 2× |
| Scale up hardware | Minutes (💰) | 🚀 linear-ish |
| Rewrite in a faster language | Months | 🚀 usually irrelevant — you were I/O bound |

**Work top-down.** People love the bottom row and it's almost always the wrong answer.

## Key takeaways

- **Measure before optimizing.** **Amdahl's law**: if 90% of time is one query, perfecting everything else buys you 10%.
- **Track p95/p99, never the average** — averages hide the tail that real users feel.
- Drill down: **metrics** (which endpoint) → **traces** (which layer) → **profiler/flame graph** (which line).
- Backend slowness is **I/O and round trips**, not CPU: **N+1 queries**, missing indexes, no cache, and serial-instead-of-parallel I/O.
- **Load test** to find your cliff before your users do. Optimize in cost order — an index beats a rewrite, every time.
