# Event-Driven Architecture

A shift in how services relate to each other. Instead of *commanding* other services, a service **announces what happened** — and stops caring who listens.

## The problem with direct calls

An order is placed. Now several things must happen:

```js
// ❌ The order service must know about EVERYTHING
async function placeOrder(order) {
  await db.orders.insert(order);

  await emailService.sendConfirmation(order);      // knows about email
  await inventoryService.reserve(order.items);     // knows about inventory
  await analyticsService.track(order);             // knows about analytics
  await loyaltyService.addPoints(order.userId);    // knows about loyalty
  await warehouseService.schedulePicking(order);   // knows about the warehouse
}
```

Look at what's wrong here:

- 🔗 **Tight coupling.** The order service imports and knows five other services. Add a sixth feature → **edit the order service** again.
- 💥 **Fragile.** If the analytics service is down, does the whole order fail? Analytics is *not* important enough to block a sale — but this code makes it so.
- 🐌 **Slow.** The user waits for all five calls, serially.
- 🧨 **Cascading failure.** One slow dependency slows every order.

The order service has become a **god object** that orchestrates the entire company.

## The event-driven flip

The order service does its **one job**, then **announces a fact**:

```js
// ✅ The order service knows about NOBODY
async function placeOrder(order) {
  await db.orders.insert(order);
  await eventBus.publish("order.placed", {         // just announce it
    orderId: order.id,
    userId: order.userId,
    items: order.items,
    total: order.total,
    occurredAt: new Date().toISOString(),
  });
  // done. Respond to the user immediately.
}
```

Interested services **subscribe**:

```
                          ┌──▶ Email service      → send confirmation
"order.placed" ──▶ [bus] ─┼──▶ Inventory service  → reserve stock
                          ├──▶ Analytics service  → record the sale
                          ├──▶ Loyalty service    → add points
                          └──▶ Warehouse service  → schedule picking
```

**The producer has no idea these consumers exist.** That's the whole idea.

## What this buys you

- ✅ **Decoupling.** Add a "Fraud Check" service tomorrow — subscribe to `order.placed`. **Zero changes** to the order service. This is the superpower.
- ✅ **Resilience.** Analytics being down no longer fails the order — its events just wait in the queue.
- ✅ **Speed.** The user gets a response as soon as the order is saved.
- ✅ **Scale independently.** Warehouse slow? Add warehouse workers only.
- ✅ **Replay.** With a durable log (Kafka), a new service can consume *history* and build its state from scratch.

## Commands vs Events (get this right)

The distinction is subtle and it matters:

| | **Command** | **Event** |
|---|---|---|
| Intent | "Do this" | "This happened" |
| Tense | Imperative — `SendEmail` | **Past tense** — `OrderPlaced` |
| Recipients | Exactly **one** handler | **Zero or many** subscribers |
| Coupling | Sender knows the receiver | Publisher knows **nobody** |
| Can be rejected? | Yes | **No — it's already a fact** |

> 🔑 **Name events in the past tense.** `OrderPlaced`, `PaymentCaptured`, `UserRegistered`. If you find yourself publishing `SendWelcomeEmail`, that's a **command wearing an event's clothes** — you've secretly re-coupled the producer to the consumer's behaviour.

The producer says *what happened*, never *what should happen next*.

## Designing good events

```json
{
  "eventId": "evt_8f3a2b",           // ✅ unique — consumers dedupe on this
  "eventType": "order.placed",
  "eventVersion": 1,                  // ✅ schemas evolve
  "occurredAt": "2026-07-12T10:00:00Z",
  "correlationId": "req_9c1d",        // ✅ trace it across every service
  "data": {
    "orderId": "ord_123",
    "userId": "usr_456",
    "total": 4999,
    "currency": "GBP"
  }
}
```

### How much data to include?

- **Thin event** (just IDs) — consumers call back to fetch details. Small payloads, but chatty, and you've re-coupled them.
- **Fat event** (all relevant data) — self-contained, consumers work independently. Bigger payloads, and the data is a *snapshot* in time.

> **Lean fat.** The whole point is decoupling; if every consumer must call you back for details, you've kept the coupling and added a queue. Include what consumers reasonably need.

## The costs (be honest about these)

### 1. Eventual consistency

The order exists **before** inventory is reserved. There's a window where the system is *temporarily inconsistent*. Your UI and business rules must tolerate it ("order confirmed — preparing shipment") rather than assume everything happened atomically.

### 2. No distributed transaction

You can't roll back across services. If payment succeeds but the warehouse rejects the order, you need a **saga** with compensating actions (refund the payment). *You* write the undo logic.

### 3. Debugging is harder

With direct calls, the flow is right there in the code. With events, control flow is **implicit and scattered**. "Why did this user get two emails?" becomes an investigation.

**Mitigation:** a **correlationId** on every event, propagated to every consumer, plus distributed tracing. Without this, event-driven systems become genuinely unmaintainable.

### 4. Duplicate & out-of-order delivery

Brokers deliver **at-least-once**, and order is only guaranteed within a partition. So:
- **Every consumer must be idempotent** (dedupe on `eventId`).
- **Never assume** `order.updated` arrives after `order.created`.

### 5. Schema evolution

Once you publish an event, it's a **public contract** — consumers you've never met depend on its shape. Same rule as APIs: **add fields freely; never remove or rename them.** Use a schema registry for real systems.

## 🚨 The dual-write problem (a subtle killer)

```js
await db.orders.insert(order);              // ✅ succeeds
await eventBus.publish("order.placed", e);  // 💥 crashes here
```

The order exists but **the event was never published**. No email, no stock reserved, no shipment. The order silently vanishes into a black hole. Reverse the order and you get the opposite bug: an event for an order that doesn't exist.

**You cannot atomically write to two systems.** The fix is the **transactional outbox**:

```sql
BEGIN;
  INSERT INTO orders (...) VALUES (...);
  INSERT INTO outbox (event_type, payload) VALUES ('order.placed', '{...}');
COMMIT;    -- ✅ both, or neither — it's ONE database transaction
```

A separate **relay process** then polls the `outbox` table and publishes to the broker, marking rows as sent. If the relay crashes, it retries — at-least-once (which is why consumers must be idempotent anyway).

This is the standard, correct pattern. Know it.

## When to use event-driven

✅ **Good fit:**
- Several independent reactions to one occurrence
- Reactions are non-critical to the main flow (analytics, email, search indexing)
- You expect to add new consumers over time
- Services are owned by different teams

❌ **Bad fit:**
- You need an **immediate answer** ("is this card valid?" → that's a **command / synchronous call**)
- Strong consistency is required
- It's a simple monolith and you're adding a broker for the aesthetics

> **Don't go event-driven everywhere.** Use synchronous calls where you need an answer *now*, and events where you're announcing *facts*. Most healthy systems are a mix.

## Key takeaways

- Publish **facts** ("order.placed"), don't issue **commands** — the producer knows nothing about its consumers. Add a new subscriber without touching the producer.
- Name events in the **past tense**. `SendEmail` as an "event" means you've re-coupled by the back door.
- You gain **decoupling, resilience, speed, replay** — you pay in **eventual consistency, sagas, and harder debugging**.
- Consumers must be **idempotent** (at-least-once, possibly out of order); propagate a **correlationId** or you'll never trace anything.
- 🚨 Solve the **dual-write problem** with a **transactional outbox** — write the row and the event in one DB transaction, and relay it separately.
