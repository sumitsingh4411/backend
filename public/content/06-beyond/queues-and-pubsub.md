# Queues & Pub/Sub

Some work is **slow**: sending email, encoding video, generating a PDF, calling a flaky third-party API. Doing it *inside* the request means the user stares at a spinner for 30 seconds — and if it fails, their whole request fails.

The fix: **do it later, somewhere else.**

## The pattern

Instead of doing the work, the API drops a **message** onto a **queue** and responds immediately. A separate **worker** process picks messages up and does the work in the background.

```
POST /signup
  ├─ save user to DB          (fast — 20ms)
  ├─ push "send_welcome_email" onto the queue   (1ms)
  └─ respond 201 ✅            ← user is done waiting

        [ queue ]  ──▶  worker  ──▶  sends the email (2s, who cares)
```

The user gets an instant response. The slow work happens reliably in the background.

## Why a queue beats "just fire and forget"

A queue gives you **durability** and **retries**:

- If the worker crashes mid-job, the message goes back on the queue and is retried.
- If the email provider is down, retry with **backoff** later.
- If traffic spikes, messages **buffer** instead of overwhelming you — the queue absorbs the load.
- Add more workers to process faster (**horizontal scaling**).

## Queue vs Pub/Sub — the key distinction

**Queue (work distribution)** — each message is consumed by **exactly one** worker. Use it to divide up work.

```
message ──▶ [ queue ] ──▶ worker A   (only A gets it)
                          worker B   (idle, waits for the next one)
```

**Pub/Sub (broadcast)** — each message goes to **every** subscriber. Use it to notify many interested parties.

```
"order.placed" ──▶ [ topic ] ──┬──▶ email service   (all three
                               ├──▶ analytics        get a copy)
                               └──▶ inventory service
```

Pub/Sub is how services stay decoupled: the order service just announces "order.placed" and doesn't know or care who listens. Add a new listener later without touching it.

## The tools

- **Redis** (lists / streams) — simple, fast, great to start.
- **RabbitMQ** — a classic, feature-rich message broker.
- **Kafka** — a durable, replayable event *log*; built for huge scale and event streaming.
- **SQS / Cloud Tasks** — managed cloud queues, no ops.
- **BullMQ / Celery / Sidekiq** — job libraries on top of Redis.

## Producing and consuming

```js
// JavaScript (BullMQ)
// producer — inside the request
await emailQueue.add("welcome", { userId: user.id });
res.status(201).json(user);   // respond immediately

// worker — a separate process
new Worker("email", async (job) => {
  await sendWelcomeEmail(job.data.userId);   // retried automatically on failure
});
```

```python
# Python (Celery)
@app.task(bind=True, max_retries=3)
def send_welcome(self, user_id):
    send_email(user_id)

send_welcome.delay(user.id)   # enqueue, return instantly
```

## Rules for good jobs

- **Make jobs idempotent.** Messages can be delivered **more than once** (most brokers guarantee *at-least-once*). Running a job twice must not send two emails or double-charge. (See *Idempotency*.)
- **Keep payloads small** — send an ID, not the whole object; the worker re-reads fresh data.
- **Retry with exponential backoff** — don't hammer a failing service.
- **Use a dead-letter queue** — after N failures, park the message for a human instead of retrying forever.

## Key takeaways

- Queues let you **respond fast now and do slow work later**, with durability and retries.
- **Queue** = one consumer per message (work distribution). **Pub/Sub** = every subscriber gets a copy (broadcast).
- Queues **buffer spikes** and let you scale by adding workers.
- Jobs must be **idempotent** (at-least-once delivery) and use **backoff + a dead-letter queue**.
