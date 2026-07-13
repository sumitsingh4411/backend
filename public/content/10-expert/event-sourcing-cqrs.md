# Event Sourcing & CQRS

Two related patterns that invert how you think about state. Powerful, frequently misused, and worth understanding even if you never adopt them.

---

# Part 1: Event Sourcing

## The realization

Look at how a normal app stores a bank account:

```sql
UPDATE accounts SET balance = 150 WHERE id = 42;
```

The balance is now `150`. But ask the obvious follow-up questions:

- *Why* is it 150?
- What was it last Tuesday?
- Who changed it, and when?

**You destroyed the answer.** The `UPDATE` overwrote history. All you have is the current value, and no idea how it got there.

> **Insight:** the current state is just a **left-fold over history**. So why store the *result* and throw away the *history* — the thing with all the information?

## The flip

**Store the events. Derive the state.**

```
Events (append-only, immutable — this IS the source of truth):
  1. AccountOpened      { id: 42, owner: "Ada" }
  2. MoneyDeposited     { amount: 100 }
  3. MoneyDeposited     { amount: 100 }
  4. MoneyWithdrawn     { amount: 50 }

Current state = replay(events):
  balance = 0 + 100 + 100 − 50 = 150   ✅ derived, not stored
```

The events are **facts that happened**. Facts are immutable — you never `UPDATE` or `DELETE` them, only append.

```js
// Rebuild state by folding the event log
function rebuild(events) {
  return events.reduce((state, e) => {
    switch (e.type) {
      case "AccountOpened":  return { ...state, id: e.id, owner: e.owner, balance: 0 };
      case "MoneyDeposited": return { ...state, balance: state.balance + e.amount };
      case "MoneyWithdrawn": return { ...state, balance: state.balance - e.amount };
      default:               return state;
    }
  }, {});
}
```

## What this buys you

- 📜 **A perfect audit log — for free.** Not a bolt-on `audit_log` table someone forgets to write to. The audit trail *is* the database. (Finance, healthcare, and anything regulated love this.)
- 🕰️ **Time travel.** Replay events up to any moment: *"what did this account look like on March 3rd?"* Just stop folding early.
- 🐛 **Debugging superpowers.** Reproduce a bug **exactly** by replaying the user's real event stream.
- 🔮 **Answer questions you hadn't thought of yet.** A new analytics question about last year? Replay the events with new logic — the data was never thrown away.
- 🔁 **Fix bugs retroactively.** Your balance calculation was wrong for 6 months? Fix the code, **replay**, and every account is corrected. (Impossible if you only stored the corrupted result.)
- ↩️ **Natural undo** — append a compensating event.

## The costs (they're real)

- ❌ **Everything is harder.** "Show me all users with balance > 100" is a trivial SQL query in a normal system. Here, you'd have to replay *every* account's events. **→ This is exactly what CQRS solves.**
- ❌ **Event schemas are forever.** A 3-year-old event must still be replayable by today's code. You'll be **versioning events** for the rest of the system's life.
- ❌ **Replaying millions of events is slow.** → Mitigated by **snapshots**: periodically store the folded state ("at event #10,000, balance was 4,320") and replay only from there.
- ❌ **GDPR "right to be forgotten"** vs an immutable log is a genuine, thorny conflict. (Usual answer: **crypto-shredding** — encrypt personal data per-user and delete the key.)
- ❌ Steep learning curve. Most developers find it disorienting at first.

## Events vs Commands (again)

- **Command:** `WithdrawMoney` — a *request*. It can be **rejected** ("insufficient funds").
- **Event:** `MoneyWithdrawn` — a *fact*. It **already happened**; it cannot be rejected, only compensated.

You validate the command against current state, and *if* it's valid, you emit the event.

---

# Part 2: CQRS

**Command Query Responsibility Segregation** — a clumsy name for a simple idea:

> **Use a different model for writing than for reading.**

## The problem it solves

One model serving both reads and writes is always a compromise:

- **Writes** want **normalization**, invariants, and validation.
- **Reads** want **denormalized**, pre-joined, screen-shaped data.

You end up with 8-table JOINs to render a page, or you denormalize and make writes fragile.

## The split

```
           COMMANDS (writes)              QUERIES (reads)
                  │                             │
                  ▼                             ▼
        ┌──────────────────┐         ┌────────────────────┐
        │   Write Model    │         │    Read Model(s)    │
        │  normalized      │────────▶│  denormalized,      │
        │  enforces rules  │ project │  pre-joined,        │
        │  (Postgres)      │         │  screen-shaped      │
        └──────────────────┘         │  (Redis/ES/Mongo)   │
                                     └────────────────────┘
```

Writes go to a model built for **correctness**. A **projection** process then updates one or more read models built for **speed** — each shaped exactly like the screen that consumes it.

```js
// WRITE side — validate invariants, emit the event
async function withdraw(accountId, amount) {
  const account = await rebuild(await eventStore.load(accountId));
  if (account.balance < amount) throw new Error("Insufficient funds");  // the rule
  await eventStore.append(accountId, { type: "MoneyWithdrawn", amount });
}

// PROJECTION — subscribe to events, maintain fast read models
eventBus.on("MoneyWithdrawn", async (e) => {
  await readDb.accounts.decrement(e.accountId, e.amount);   // simple lookup table
  await searchIndex.update(e.accountId);                     // Elasticsearch
  await analytics.record(e);                                 // warehouse
});

// READ side — dumb, instant, no JOINs, no replay
async function getBalance(accountId) {
  return readDb.accounts.findBalance(accountId);   // one indexed lookup ⚡
}
```

## Why it pairs so naturally with event sourcing

Event sourcing gives you a **stream of facts**. CQRS **consumes** that stream to build any read model you like:

- A Postgres table for balances
- Elasticsearch for search
- Redis for a leaderboard
- A warehouse for analytics

All from **one event log**, all kept in sync automatically. And if you need a *new* read model tomorrow — **replay the log** and build it from scratch, with full history. That's genuinely powerful.

## The catch: eventual consistency

Projections update **asynchronously**. So:

```
User clicks "Withdraw £50"  →  ✅ command accepted
User's balance page reloads →  might still show the OLD balance for ~100ms
```

Users hate this ("my money vanished!"). **Mitigations:** optimistic UI updates, return the expected new state directly from the command, or read from the write model immediately after a write.

**You must design the UX for it.** This is the #1 reason CQRS projects fail.

---

## 🛑 When NOT to use these

Be honest — this is the most important section.

**These patterns are frequently over-applied by engineers who just learned them.** For a standard CRUD app, event sourcing means:

- Vastly more code
- Eventual consistency bugs your team isn't ready for
- Event versioning pain, forever
- New hires who need weeks to become productive

…in exchange for benefits you may not need.

> **Martin Fowler, who *popularized* these patterns, explicitly warns against using them by default.**

### ✅ Reach for them when:
- You genuinely need a **full audit trail** (finance, healthcare, legal, compliance)
- The **domain is naturally event-based** (order lifecycles, shipping, trading, booking)
- Read and write loads are **wildly asymmetric** and need different stores
- **Temporal queries** ("what did we know at time T?") are a real requirement

### ❌ Skip them when:
- It's basically CRUD (a blog, an admin panel, a typical SaaS app)
- Your team hasn't used them before and the domain doesn't demand it
- You're doing it because it sounds sophisticated

### 🎯 The pragmatic middle ground

You can take **CQRS without event sourcing**: keep a normal, boring, mutable Postgres write model — and *also* maintain a denormalized read model (a materialized view, an Elasticsearch index, a Redis cache) updated by events.

**You get most of the read-performance benefit with a fraction of the complexity.** For the vast majority of teams, this is the right call.

## Key takeaways

- **Event sourcing:** store the **immutable append-only log of events**; derive current state by **folding** them. The audit log *is* the database.
- You gain **time travel, perfect audit, retroactive bug fixes, and replayability**; you pay in **query difficulty, event versioning, snapshots, and GDPR headaches**.
- **CQRS:** separate the **write model** (normalized, enforces invariants) from **read models** (denormalized, screen-shaped), connected by **projections**.
- They pair naturally — one event log can feed *any* number of read models, and a new one can be built by **replaying**.
- Projections are **eventually consistent** — design the UX for it, or users will think their data vanished.
- 🛑 **Don't default to these.** For CRUD apps they're a large cost for little gain. **CQRS *without* event sourcing** is often the sweet spot.
