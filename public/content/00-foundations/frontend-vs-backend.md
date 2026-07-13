# Frontend vs Backend

These two halves work together, but they have different jobs, run in different places, and worry about different things. **Knowing which concern belongs where is the first real skill of a backend engineer** — and getting it wrong is how security holes are born.

## Side by side

| | Frontend | Backend |
|---|---|---|
| **Runs on** | The user's browser/device | A server you control |
| **Language** | HTML, CSS, JS/TS | Any (JS, Python, Go, Java…) |
| **Job** | Present data, capture input | Store data, enforce rules, integrate |
| **Trust** | ❌ Untrusted (user can edit it) | ✅ Trusted (you own it) |
| **State** | Temporary (per page/session) | Durable (databases, forever) |
| **Users see** | Everything (view-source) | Nothing (only your API responses) |
| **Fails as** | A broken layout | Data loss, a security breach |
| **Scales by** | The user's device does the work | *You* pay for every request |

That **Trust** row is the one to tattoo on your brain. Everything below flows from it.

---

## The golden rule: never trust the client

A frontend can validate a form to be **friendly**:

```js
// Frontend — this is UX, not security
if (!email.includes("@")) {
  showError("That doesn't look like an email");
}
```

That's great! It gives instant feedback without a network round trip.

But it is **not a security control**, because an attacker doesn't have to use your frontend at all:

```bash
# Your beautiful React form? Bypassed entirely.
curl -X POST https://yourapi.com/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "not-an-email", "role": "admin", "price": 0}'
```

Your form validation, your disabled buttons, your hidden admin panel — **none of it exists** as far as this request is concerned. The frontend is a *convenience* you offered; it is not a *gate*.

> **The rule:** if a rule matters (price, permissions, quantity, ownership), the **backend enforces it**. The frontend's version is *only* UX.

This means you will often **validate the same thing twice** — once in the frontend for a nice experience, once in the backend for safety. **That is not duplication to eliminate.** It's two different jobs that happen to look alike.

### The classic disaster

```js
// ❌ Frontend sends the price. The backend trusts it.
fetch("/api/checkout", {
  method: "POST",
  body: JSON.stringify({ productId: 42, price: 999 })
});
```

An attacker changes `price` to `1`. If your backend charges what it was told, **you just sold a laptop for a pound.**

```js
// ✅ The backend looks up the REAL price. It never trusts the client's number.
app.post("/api/checkout", async (req, res) => {
  const product = await db.products.find(req.body.productId);
  const total = product.price * req.body.quantity;   // ← the source of truth
  await charge(req.user, total);
});
```

**Never let the client tell you anything you can look up yourself.**

---

## Who owns what?

Try to answer before reading the right-hand column.

| Concern | Owner | Why |
|---|---|---|
| Button hover animation | **Frontend** | Pure presentation |
| Showing a loading spinner | **Frontend** | Presentation |
| Formatting a date as "3 days ago" | **Frontend** | Depends on the user's timezone/locale |
| "Is this coupon still valid?" | **Backend** | Only it knows the real data |
| Deciding a user can see another user's orders | **Backend** | Security — never trust the client |
| Actually charging the card | **Backend** | Money + secret API keys |
| Hiding the "Delete" button from non-admins | **Frontend** *(and Backend!)* | Frontend for UX, **backend must still block the request** |
| Sorting a list of 20 items already loaded | **Frontend** | No round trip needed |
| Sorting/paginating 2 million records | **Backend** | Can't send 2M rows to a browser |

That "Delete button" row is the one people get wrong. **Hiding a button is not security.** The endpoint is still there, and `curl` doesn't care what your CSS says.

---

## They meet at the API

The frontend and backend talk over a well-defined **API** — usually HTTP + JSON. That contract is the border between the two worlds:

```
   FRONTEND                  │                    BACKEND
   (untrusted)               │                    (trusted)
                             │
   fetch("/api/orders") ─────┼────▶  validate → authorize → query DB
                             │                              │
   render the JSON     ◀─────┼──────────────────────────────┘
                             │
                        the API — the
                       trust boundary
```

**Everything crossing that line from the left is suspicious until proven otherwise.** That single mindset shift is most of what separates a backend engineer from a frontend engineer who's writing server code.

The rest of this roadmap is about what happens on the **right** side of that line.

## Key takeaways

- Frontend = **presentation on an untrusted device**. Backend = **truth on a trusted server**.
- **Never trust the client.** An attacker can skip your UI entirely and send raw requests — your form validation and hidden buttons simply don't exist to them.
- Validating in *both* places isn't duplication: the frontend does it for **UX**, the backend for **safety**.
- **Never trust data you can look up yourself** (especially prices and permissions).
- They meet at the **API** — treat everything crossing that boundary as suspicious until validated.
