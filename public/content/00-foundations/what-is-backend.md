# What is Backend?

If you've built a frontend, you already know **half** the picture. The frontend is everything the user sees and touches — buttons, layouts, animations. The **backend** is everything that happens *behind the curtain*: storing data, enforcing rules, talking to other services, and keeping secrets safe.

> **Analogy — the restaurant.** The frontend is the **dining room**: menus, tables, the waiter, the ambience. The backend is the **kitchen**: where ingredients (data) are stored, orders are cooked (logic runs), and *customers are not allowed to walk in*.
>
> That last part matters most. The kitchen is closed to customers **on purpose** — not to be rude, but because that's the only way to guarantee that nobody tampers with the food.

## The one idea that unlocks everything: trust

Here's the thing that took me a while to appreciate, and it explains almost every backend decision you'll ever make:

**Frontend code runs on the user's device. Backend code runs on a machine you own.**

That's not a trivia fact — it's a **trust boundary**.

- Everything you send to the browser is **public**. The user can read it, edit it, delete it, or replace it. Open DevTools right now on any website and you can change the JavaScript.
- Everything on your server is **yours**. The user can only interact with it through the doors you deliberately open (your API).

So the backend is the only place you can safely:

| Do this | Why the frontend can't |
|---|---|
| Store a database password | Anyone would read it in DevTools |
| Charge a credit card | The user could change the amount to £0 |
| Decide "only admins can delete" | The user could just... say they're an admin |
| Store data permanently | Browser storage is per-device and erasable |
| Call a paid API with your secret key | Your key would be stolen within hours |

## A concrete example

A user logs in. Watch where the trust sits:

```
Browser (frontend)                    Server (backend)
──────────────────                    ────────────────
[ email + password ]  ──── POST ───▶  1. look up the user in the database
                                      2. compare the password hash
                                      3. decide: yes or no
[ "welcome!" or 401 ]  ◀────────────  4. respond
```

Notice: the frontend **never sees the stored password.** It doesn't get to make the decision — it only receives the *answer*. The frontend **asks**; the backend **decides**.

If the frontend made that decision, anyone could open DevTools, change `if (passwordCorrect)` to `if (true)`, and log in as you.

## So what does a backend actually *do* all day?

Strip away the jargon and it's four things:

1. **Receive requests** — someone (a browser, a mobile app, another server) asks for something.
2. **Decide** — is this allowed? Is the input valid? What are the business rules?
3. **Remember** — read from and write to a database.
4. **Respond** — send back an answer (usually JSON).

That's genuinely it. Everything else in this roadmap — HTTP, databases, auth, caching, scaling — is a *deeper answer* to one of those four steps.

## Common misconceptions

**❌ "Backend is the hard part / frontend is the easy part."**
Nonsense — they're different, not ranked. Frontend has to handle every browser, screen size, and user whim. Backend has to handle data integrity, concurrency, and security. Both get hard fast.

**❌ "Backend = a specific language."**
Backend isn't Node, or Python, or Java. It's a *place code runs* and a *set of responsibilities*. That's exactly why this roadmap teaches concepts first and shows them in four languages — because the ideas are what transfer.

**❌ "I need to learn a framework first."**
You need to understand **requests, data, and trust** first. The framework is just syntax on top. Learn Express before HTTP and you'll be copy-pasting forever.

## Why frontend devs make excellent backend devs

You are further along than you think. You already know:

- ✅ **How to make requests** — you've called `fetch()` a thousand times. Now you'll be on the *other* end of it.
- ✅ **JSON** — the language backends speak to each other in.
- ✅ **Async / promises** — backend work is *dominated* by waiting on I/O.
- ✅ **Debugging** — same skill, different console.

You're not starting from zero. You're crossing to the other side of an API you've been talking to for years.

## Key takeaways

- **Backend = server-side logic + data + trust.** It runs on a machine *you* control.
- The frontend is **untrusted** (the user can change it); the backend is **trusted** (only you can).
- **The frontend asks; the backend decides and remembers.** Any rule that actually matters must be enforced on the backend.
- A backend does four things: **receive → decide → remember → respond.**
- Everything else in this roadmap is a deeper answer to one of those four steps.
