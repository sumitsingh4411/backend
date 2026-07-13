# Domain-Driven Design

Most backend code fails not because the technology was wrong, but because **the model was wrong** — the code didn't reflect how the business actually works, so every new requirement fought the codebase.

**DDD** is a set of ideas for keeping your code shaped like your **problem**, not like your database.

---

## The problem: the anaemic model

Look at typical "enterprise" code:

```js
// A bag of data with no behaviour
class Order {
  id; userId; items; status; total;
}

// …and business rules scattered across services, far from the data
class OrderService {
  cancel(order) {
    if (order.status === "shipped") throw new Error("Cannot cancel");
    if (order.status === "cancelled") throw new Error("Already cancelled");
    order.status = "cancelled";
  }
}

class RefundService {
  refund(order) {
    // 🚨 forgot the "shipped" check. Now you can refund a shipped order.
  }
}
```

The `Order` class knows nothing about being an order. It's a **struct**. The rules that define what an order *is* are scattered across services — and **nothing stops the next developer from just doing `order.status = "cancelled"` directly**, bypassing every rule.

Invariants that live in services **will** eventually be violated.

---

## Idea 1: Ubiquitous Language

Developers say `User`. Sales says "lead." Support says "account." Billing says "customer." **These are four names for what everyone assumes is the same thing — and it isn't.** Every conversation and every handoff quietly loses information.

**DDD's first rule:** developers and domain experts agree on **one language**, and **that exact language appears in the code.**

```js
// ❌ Technical jargon nobody in the business would recognize
orderManager.processTransactionRecord(dto, 2);

// ✅ The code reads like the business talks
order.cancel(reason);
shipment.markAsDelivered();
subscription.renew();
```

> If a domain expert can't read your method names and nod, your model is wrong. **The code should be a conversation the business could join.**

---

## Idea 2: Entities, Value Objects & Aggregates

### Entities — things with an identity that persists

A `User` is the same user even if their name, email, and address all change. **Identity ≠ attributes.** Compare by ID.

### Value Objects — things defined *entirely* by their values

`Money(100, "GBP")` has no identity. Two of them with the same amount and currency **are the same thing**. They should be **immutable**.

This sounds academic. It isn't — it kills real bugs:

```js
// ❌ Primitive obsession — the compiler can't help you
function transfer(amount: number, currency: string) { ... }
transfer(100, "GBP");
transfer(100, "USD");
const total = gbpAmount + usdAmount;   // 💥 nonsense, and nothing complains

// ✅ A Value Object makes the invalid state IMPOSSIBLE
class Money {
  constructor(readonly amount: number, readonly currency: string) {
    if (amount < 0) throw new Error("Money cannot be negative");   // invariant
    Object.freeze(this);
  }
  add(other: Money): Money {
    if (other.currency !== this.currency) {
      throw new Error(`Cannot add ${other.currency} to ${this.currency}`);  // 🛡️
    }
    return new Money(this.amount + other.amount, this.currency);
  }
}
```

> **Make illegal states unrepresentable.** That's the deepest idea in this lesson. Don't validate against bugs — design so they can't be expressed.

### Aggregates — the consistency boundary 🔑

This is the concept that changes how you build things.

An **aggregate** is a cluster of objects treated as **one unit**, with a single **aggregate root** as the *only* way in. Every rule (**invariant**) inside it is always true.

```js
class Order {                        // ← the AGGREGATE ROOT
  #items = [];                       // private! Nobody reaches inside.
  #status = "draft";

  addItem(product, quantity) {
    if (this.#status !== "draft") {
      throw new Error("Cannot modify a placed order");     // 🛡️ invariant
    }
    if (this.#items.length >= 100) {
      throw new Error("Order cannot exceed 100 items");    // 🛡️ invariant
    }
    this.#items.push(new OrderLine(product, quantity));
  }

  cancel(reason) {
    if (this.#status === "shipped") {
      throw new Error("Cannot cancel a shipped order");    // 🛡️ ONE place
    }
    this.#status = "cancelled";
    this.#events.push(new OrderCancelled(this.id, reason)); // emit a fact
  }

  get total() {                      // derived, never stored inconsistently
    return this.#items.reduce((sum, i) => sum.add(i.subtotal), Money.zero("GBP"));
  }
}
```

**The rules:**
1. **Only the root is reachable from outside.** You never fetch or modify an `OrderLine` directly — you go through `Order`. So the rules **cannot be bypassed**.
2. **Invariants hold within the aggregate**, always — enforced in one place, not scattered across three services.
3. **One transaction = one aggregate.** Don't update `Order` and `Inventory` in the same transaction — that's your seam for eventual consistency.
4. **Reference other aggregates by ID**, never by object:
   ```js
   class Order {
     customerId;      // ✅ just an ID
     // customer;     // ❌ don't embed another aggregate
   }
   ```

> **Aggregate = transactional consistency boundary.** Ask *"what set of things must always be consistent with each other, in the same instant?"* — that's your aggregate. **Keep them small.**

---

## Idea 3: Bounded Contexts 🔑🔑

**The most valuable idea in DDD**, and the one with the biggest practical payoff.

### The trap: the God model

The instinct is to build **one** `User` class for the whole company. So it grows:

```js
class User {
  id; email; name;
  passwordHash; lastLogin;            // auth cares
  billingAddress; cardToken; vatId;   // billing cares
  supportTier; ticketCount;           // support cares
  shippingAddress; loyaltyPoints;     // shipping cares
  // …47 fields, and every team is afraid to touch it
}
```

This class belongs to **everyone**, so it belongs to **no one**. Every team's changes break every other team's code. It's a coupling magnet.

### The insight

> **"Customer" genuinely *means* something different to each part of the business.**

- To **Billing**, a customer is a payment method, a VAT number, and an invoice history.
- To **Shipping**, a customer is an address and a delivery preference.
- To **Support**, a customer is a ticket history and an SLA tier.

These are **not the same concept** wearing different hats. They are **different concepts that share a name.**

### The fix: draw boundaries

A **bounded context** is an explicit boundary within which a model and its terms have **one** consistent meaning. **Each context owns its own model** — and they're allowed to disagree.

```
┌── BILLING context ─────┐   ┌── SHIPPING context ────┐   ┌── SUPPORT context ─┐
│  Customer              │   │  Recipient             │   │  Contact           │
│   - paymentMethod      │   │   - address            │   │   - ticketHistory  │
│   - vatNumber          │   │   - deliveryWindow     │   │   - slaTier        │
│   - invoices           │   │   - signatureRequired  │   │                    │
└────────────────────────┘   └────────────────────────┘   └────────────────────┘
            ▲                            ▲                          ▲
            └───── all the same real person: customerId = 42 ───────┘
```

Three models. One shared identifier. **Each team owns its own and can change it freely** without a company-wide meeting.

That last sentence is the entire payoff.

### This is how you find microservice boundaries

```
❌ Split by technical layer:  api-service, database-service, auth-service
   → chatty, coupled, every feature touches all three. A distributed monolith.

✅ Split by bounded context:  billing, shipping, support, catalog
   → each owns its data and its rules. Features live inside one service.
```

> **Bounded contexts are the correct seams for services.** Splitting anywhere else produces a **distributed monolith** — all of the pain of microservices, none of the independence. This is *the* reason most microservice migrations fail.

### Context mapping

Contexts must still talk. Name the relationship:

- **Anti-Corruption Layer (ACL)** — a translation layer at your boundary so another team's (or a legacy system's) model doesn't leak into yours and corrupt it. **Use this at every integration with something you don't control.**
- **Published Language** — an agreed shared format (events, an API contract) between contexts.
- **Shared Kernel** — a small shared model. Use sparingly; it recouples the teams.

---

## Strategic vs Tactical

- **Strategic DDD** — bounded contexts, ubiquitous language, context maps. **This is where nearly all the value is.**
- **Tactical DDD** — entities, value objects, aggregates, repositories. Useful, but only *inside* a complex context.

> Many teams do tactical DDD (lots of `Repository` and `ValueObject` classes) while completely missing strategic DDD — and end up with ceremony instead of clarity. **Get the boundaries right first.** They matter far more than the class patterns.

---

## 🛑 When NOT to use DDD

DDD is for **complex domains**. Its cost is real: more classes, more indirection, and a team that must genuinely learn it.

- ❌ **A CRUD app** (a blog, an admin panel) → DDD is pure overhead. Just write the CRUD.
- ❌ **A simple domain** → if the business rules fit in your head, an aggregate adds ceremony, not safety.
- ❌ **Nobody to talk to** → DDD is *built* on conversations with domain experts. No expert, no ubiquitous language, no DDD.

✅ **Use it when:** the domain has genuinely intricate rules (insurance, logistics, finance, healthcare), the business logic is the hard part (not the scale), and you have access to domain experts.

**But note:** *bounded contexts* and *ubiquitous language* are cheap and valuable **almost everywhere** — even in a simple app. Take those two ideas even if you take nothing else.

## Key takeaways

- **Ubiquitous language:** developers and the business use **one vocabulary**, and it appears verbatim in the code. If a domain expert can't read your method names, the model is wrong.
- **Value objects** (immutable, compared by value) let you **make illegal states unrepresentable** — `Money` that refuses to add GBP to USD.
- **Aggregates** are the **transactional consistency boundary**: all access goes through the **root**, so invariants live in *one* place and can't be bypassed. Keep them small; reference other aggregates **by ID**; one transaction per aggregate.
- 🔑 **Bounded contexts** are the big one: "Customer" legitimately means different things to Billing, Shipping, and Support. Let each **own its own model** — they're allowed to disagree.
- **Bounded contexts are the correct seams for microservices.** Splitting by technical layer instead produces a **distributed monolith**.
- 🛑 Skip full DDD for CRUD apps — but **take ubiquitous language and bounded contexts everywhere**.
