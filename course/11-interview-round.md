<div align="center">

<sub>[← BackendPath](../README.md)</sub>

# 🎯 The system design interview

**The 45-minute round, what they actually grade, and how people fail.**

<sub>`2 min read`</sub>

</div>

---

### In this part

- [The 45-minute round, minute by minute](#the-45-minute-round-minute-by-minute)
- [What they're actually grading](#what-theyre-actually-grading)
- [The seven ways people fail](#the-seven-ways-people-fail)
- [Three sentences that make you sound senior](#three-sentences-that-make-you-sound-senior)

---

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

<div align="center">

[← 🧠 Part 10 · System design](10-system-design.md) · [**Contents**](../README.md#contents) · [📖 📖 Backend glossary — the terms they'll drop on you →](12-glossary.md)

<sub><a href="#top">↑ back to top</a></sub>

</div>
