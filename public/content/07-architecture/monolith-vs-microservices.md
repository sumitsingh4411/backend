# Monolith vs Microservices

One of the most over-hyped decisions in backend. Let's cut through it.

## The monolith

**One codebase, one deployable.** All your features — users, orders, payments — live in a single application, talking to each other with plain function calls.

- ✅ **Simple**: one repo, one deploy, one place to debug.
- ✅ **Fast**: in-process calls, no network. **Transactions just work** across features.
- ✅ Easy local development — run one thing.
- ❌ One bug can take down everything.
- ❌ Any change means redeploying the whole app.
- ❌ Scaling is coarse — you scale *everything* even if only search is hot.
- ❌ At large team sizes, people trip over each other.

## Microservices

**Many small, independently deployable services**, each owning one business capability and its **own database**, talking over the network (HTTP/gRPC/queues).

- ✅ **Independent deploys** — ship the payments service without touching the rest.
- ✅ **Independent scaling** — 20 instances of search, 2 of billing.
- ✅ **Team autonomy** and fault isolation.
- ✅ Different languages per service, if useful.
- ❌ **You've traded code complexity for distributed-systems complexity.**

## The costs nobody mentions upfront

That last point is the whole story. Splitting a monolith means every function call that crossed a module boundary now crosses a **network**, and networks fail:

- **Distributed transactions.** "Take payment AND reserve inventory" was one DB transaction. Now it spans two services with two databases — you need **sagas** and compensating actions. This is genuinely hard.
- **Partial failure.** Service B is down. What does A do? Retry? Queue? Degrade? You must design for it everywhere.
- **Debugging.** One user request touches six services — you *need* distributed tracing to understand anything.
- **Operational overhead.** 20 services = 20 pipelines, 20 dashboards, 20 on-call surfaces.
- **Data consistency.** No more `JOIN` across services. You'll duplicate data and accept eventual consistency.

## The honest recommendation

> **Start with a monolith. Almost always.**

Microservices solve an **organizational** problem (many teams shipping independently) more than a technical one. If you have 5 engineers, microservices will slow you down — you'll pay all the costs and get none of the benefit.

Companies that succeeded with microservices (Amazon, Netflix) **extracted them from a working monolith** once they knew where the boundaries were. They didn't start there.

## The middle path: a modular monolith

Get most of the benefits, few of the costs. Build **one deployable**, but with **strict internal module boundaries**:

```
src/
  modules/
    orders/     ← owns its tables; exposes a small public interface
    payments/   ← may NOT import orders' internals
    users/
```

Rules: modules talk through defined interfaces, never reach into each other's tables. It stays simple to run — and if a module ever *does* need to become a service, the seam is already there. **This is the right default for most teams.**

## When to actually split

Split a service out when you have a *concrete* reason:

- A component has **wildly different scaling** needs (video encoding).
- A **separate team** needs to deploy on its own cadence.
- You need **fault isolation** for something critical.
- A piece genuinely needs a different language/runtime.

Split **one** service out at a time, at a boundary that's already clean. Never rewrite everything at once.

## Key takeaways

- **Monolith** = one deployable: simple, fast, easy transactions. **Microservices** = independent deploys and scaling, at the cost of **distributed-systems complexity**.
- Microservices mainly solve an **organizational** problem — they need many teams to pay off.
- **Start with a monolith**; prefer a **modular monolith** with clean internal boundaries.
- Extract services **one at a time**, only with a concrete reason.
