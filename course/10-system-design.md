<div align="center">

<sub>[← BackendPath](../README.md)</sub>

# 🧠 Part 10 · System design

**The method, the maths, and the classic problems worked through.**

<sub>`3 min read`</sub>

</div>

---

### In this part

- [10.1 The method — works for any prompt](#101-the-method--works-for-any-prompt)
- [10.2 Back-of-envelope, fast](#102-back-of-envelope-fast)
- [10.3 Design: news feed (the celebrity problem)](#103-design-news-feed-the-celebrity-problem)
- [10.4 Design: rate limiter](#104-design-rate-limiter)
- [10.5 🚨 `hash(key) % N` is a trap](#105--hashkey--n-is-a-trap)

---

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

<div align="center">

[← 🚀 Part 9 · DevOps & deploys](09-devops.md) · [**Contents**](../README.md#contents) · [🎯 🎯 The system design interview →](11-interview-round.md)

<sub><a href="#top">↑ back to top</a></sub>

</div>
