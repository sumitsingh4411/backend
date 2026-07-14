<div align="center">

<sub>[← BackendPath](../README.md)</sub>

# ⚡ Part 7 · Performance

**p95/p99, profiling, and where the time actually goes.**

<sub>`3 min read`</sub>

</div>

---

### In this part

- [7.1 Measure first. Your intuition is wrong.](#71-measure-first-your-intuition-is-wrong)
- [7.2 p95/p99 — the average is a liar](#72-p95p99--the-average-is-a-liar)
- [7.3 The latency numbers to memorise](#73-the-latency-numbers-to-memorise)
- [7.4 The usual suspects, ranked by how often it's really them](#74-the-usual-suspects-ranked-by-how-often-its-really-them)
- [7.5 Read a request like a profiler](#75-read-a-request-like-a-profiler)

---

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

<div align="center">

[← 🔁 Part 6 · Caching & queues](06-caching-and-queues.md) · [**Contents**](../README.md#contents) · [🕸️ Part 8 · Reliability →](08-reliability.md)

<sub><a href="#top">↑ back to top</a></sub>

</div>
