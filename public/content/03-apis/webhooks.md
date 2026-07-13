# Webhooks

A normal API call is you asking someone else's server a question. A **webhook is the reverse**: *their* server calls *yours* when something happens.

> **Webhooks are "don't call us, we'll call you."**

## The problem they solve

You need to know when a Stripe payment succeeds. Without webhooks, you'd **poll**:

```
every 10s:  GET /payments/123  → "pending"
every 10s:  GET /payments/123  → "pending"      ← wasteful and slow
every 10s:  GET /payments/123  → "succeeded" ✅  (up to 10s late)
```

With a webhook, Stripe **pushes** the event to you the instant it happens:

```
Stripe ──POST https://yourapp.com/webhooks/stripe──▶  your server
        { "type": "payment_intent.succeeded", ... }
```

Instant, zero wasted requests. This is how payments, CI builds, GitHub pushes, and Slack integrations all work.

## Receiving one

A webhook endpoint is just a **POST route that you make public**:

```js
// JavaScript (Express)
app.post("/webhooks/stripe", express.raw({ type: "application/json" }), (req, res) => {
  const event = verifyAndParse(req);   // see below — NEVER skip this

  // 1. Respond FAST (before doing the work)
  res.status(200).end();

  // 2. Do the actual work asynchronously
  await queue.add("handle-stripe-event", event);
});
```

## The five rules (this is the whole lesson)

### 1. 🔒 Verify the signature — ALWAYS

Your webhook URL is **public**. Anyone can POST to it:

```bash
# An attacker, from their laptop:
curl -X POST https://yourapp.com/webhooks/stripe \
  -d '{"type":"payment_intent.succeeded","amount":1000000}'
```

If you trust that payload, you just shipped a product for free.

Providers **sign** the request: they HMAC the raw body with a secret only you and they know. You recompute it and compare.

```js
import crypto from "node:crypto";

function verify(rawBody, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)               // ⚠️ the RAW bytes, not the parsed object
    .digest("hex");

  // constant-time compare — prevents timing attacks
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

```python
# Python
import hmac, hashlib
expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
if not hmac.compare_digest(expected, signature):
    abort(400)
```

⚠️ **Two classic bugs:**
- Verifying the **parsed/re-serialized** JSON instead of the raw bytes → the signature never matches (key reordering, whitespace).
- Using `==` instead of a **constant-time** compare → leaks the signature via timing.

### 2. 🔁 Be idempotent — the same event WILL arrive twice

Delivery is **at-least-once**. If your server is slow, or responds 500, or the network hiccups after you processed it — the provider **retries**.

```js
// Store the event id; skip anything you've already seen.
const seen = await db.webhookEvents.find(event.id);
if (seen) return;                        // ✅ safe duplicate — do nothing

await db.webhookEvents.insert({ id: event.id });   // unique constraint helps
await fulfillOrder(event);
```

Without this, a retry **ships the product twice** or **credits the account twice**.

### 3. ⚡ Respond fast (200 first, work later)

Providers time out — often in **5–10 seconds** — and treat a slow response as a failure, then retry. If your handler sends an email, generates a PDF, and calls three APIs, you'll time out and get duplicate deliveries.

**Acknowledge immediately, queue the work.** (This is exactly what the queue lesson was for.)

### 4. 📥 Return the right status

- **2xx** → "got it." The provider stops retrying.
- **Anything else** → the provider retries with backoff.

Return **200 even for events you don't care about** — otherwise you'll get retried forever for an event type you're ignoring. Only return an error if *you* genuinely failed and want a retry.

### 5. 🧪 Handle out-of-order events

Webhooks can arrive out of order (`order.updated` before `order.created`). Don't assume sequence — check the event's timestamp, and if you get an update for something you've never seen, either fetch the current state from their API or park it.

## Testing webhooks locally

Your laptop isn't on the public internet. Two options:

```bash
# 1. Tunnel your localhost to a public URL
ngrok http 3000        # → https://abc123.ngrok.io  (point the webhook here)

# 2. Use the provider's CLI to replay events straight to localhost
stripe listen --forward-to localhost:3000/webhooks/stripe
stripe trigger payment_intent.succeeded    # fire a fake event on demand
```

## Sending webhooks (if you're the provider)

Everything above, inverted:

- **Sign every request** with a per-customer secret.
- **Retry with exponential backoff** on non-2xx (e.g. for 24h), then give up and alert them.
- **Include a unique `event.id`** so receivers can dedupe.
- **Time out fast** (5s) — don't let a slow customer block your queue.
- Give them a **dashboard** to see deliveries, failures, and to **replay** an event.
- ⚠️ **Guard against SSRF**: customers give you a URL to call. Block internal IPs (`localhost`, `169.254.169.254`, `10.x`) or you've built an attacker a proxy into your own network.

## Key takeaways

- A **webhook** is a reverse API call — the provider POSTs to *your* public endpoint when an event happens. Beats polling.
- **Always verify the HMAC signature over the raw body**, with a constant-time compare. The endpoint is public; anyone can forge a payload.
- Delivery is **at-least-once** → handlers **must be idempotent** (dedupe on `event.id`).
- **Return 200 immediately and queue the work** — slow handlers time out and get retried.
- Test with **ngrok** or the provider's CLI. If you *send* webhooks: sign, retry with backoff, dedupe IDs, and block SSRF.
