# Background Jobs & Scheduling

Queues let you *defer* work. This lesson is about actually **running** that work reliably — the worker patterns, the scheduling traps, and the failure handling that production demands.

## Two kinds of background work

1. **Event-driven jobs** — triggered by something happening. *User signed up → send welcome email.*
2. **Scheduled jobs (cron)** — triggered by the clock. *Every night at 2am → generate invoices.*

They fail in different ways. Let's take them in turn.

---

## Part 1: Workers

A **worker** is a separate process that pulls jobs off a queue and executes them.

```
API process              Worker process(es)
───────────              ──────────────────
enqueue job ──▶ [queue] ──▶ pull job
respond 201 ✅              execute (slowly)
                            ack / retry / fail
```

Workers run **separately from your API** — different process, often a different container. That's the point: a stuck job can't stall a user's request, and you can scale them independently (10 API instances, 3 workers).

```js
// JavaScript (BullMQ)
new Worker(
  "email",
  async (job) => {
    await sendEmail(job.data.userId);
  },
  {
    concurrency: 5,          // process 5 jobs at once in this worker
    limiter: { max: 100, duration: 60_000 },  // respect the provider's rate limit
  },
);
```

```python
# Python (Celery)
@app.task(bind=True, max_retries=5, autoretry_for=(TransientError,),
          retry_backoff=True, retry_jitter=True)
def send_welcome(self, user_id):
    send_email(user_id)
```

## The rules of a good job

### 1. Jobs must be idempotent

Delivery is **at-least-once**. Your job **will** run twice — after a worker crash, a timeout, a redeploy. If running it twice sends two emails or charges two cards, you have a bug waiting to happen.

```js
// ✅ Guard on a durable marker
async function sendWelcome(userId) {
  const user = await db.users.find(userId);
  if (user.welcomeEmailSentAt) return;        // already done — no-op
  await mailer.send(user.email, welcomeTemplate);
  await db.users.update(userId, { welcomeEmailSentAt: new Date() });
}
```

### 2. Pass IDs, not objects

```js
// ❌ Stale by the time it runs; bloats the queue
await queue.add("email", { user: fullUserObject });

// ✅ Small payload, always reads fresh data
await queue.add("email", { userId: 42 });
```

The job might run minutes later. Serialize an ID and re-fetch — that way the worker always sees current data.

### 3. Retry with exponential backoff **and jitter**

```js
await queue.add("email", { userId }, {
  attempts: 5,
  backoff: { type: "exponential", delay: 1000 },  // 1s, 2s, 4s, 8s, 16s
});
```

**Jitter matters.** If 10,000 jobs all fail because an API was down and all retry at exactly `t+1s`, you'll hammer it the instant it recovers and knock it over again — a **thundering herd**. Randomize the delay.

### 4. Only retry *transient* failures

```js
// ❌ Retrying this 5 times is pointless — it will fail identically every time
if (!isValidEmail(user.email)) throw new Error("bad email");
```

- **Transient** (network blip, 503, rate limit, DB timeout) → **retry**. It might work next time.
- **Permanent** (invalid data, 404, validation error) → **fail immediately**, send to the DLQ. Retrying wastes capacity and delays real work.

### 5. Dead-letter queue (DLQ)

After N failed attempts, stop. Move the job to a **dead-letter queue** — a parking lot for poison messages.

Without a DLQ, one bad job retries **forever**, consuming a worker slot and spamming your logs. With one, it's parked, you get alerted, you inspect it, fix the bug, and **replay** it.

> **Alert on DLQ depth.** A growing DLQ is one of the highest-signal alerts you can have.

### 6. Set a timeout

A job that hangs forever holds a worker slot forever. Kill it and let it retry.

### 7. Shut down gracefully

On deploy, your worker gets `SIGTERM`. Don't drop the job you're holding:

```js
process.on("SIGTERM", async () => {
  await worker.close();   // stop taking NEW jobs, finish the current one, then exit
});
```

Without this, every deploy kills in-flight jobs. (With at-least-once + idempotency, they'd be retried — but why cause the churn?)

---

## Part 2: Scheduled jobs — and the trap

### 🚨 The multi-instance cron bug

You put a cron in your app:

```js
// ❌ DANGER
cron.schedule("0 9 * * *", () => sendInvoiceEmails());
```

Works perfectly on your laptop. Then you scale to 5 instances.

**Now all 5 instances run it. Every customer gets 5 invoices.**

This is one of the most common — and most embarrassing — production bugs there is. Horizontal scaling silently multiplies your cron.

### The fixes

**Option A — a distributed lock (simple, good enough)**

Only the instance that grabs the lock runs the job:

```js
cron.schedule("0 9 * * *", async () => {
  // SET key value NX EX — atomic "acquire if not held"
  const gotIt = await redis.set("cron:invoices:2026-07-12", "1", {
    NX: true,     // only if it doesn't exist
    EX: 3600,     // auto-release after an hour (in case we crash)
  });
  if (!gotIt) return;             // another instance is doing it. Stand down.

  await sendInvoiceEmails();
});
```

Note the **date in the key** — it makes the lock naturally unique per run.

⚠️ A Redis lock is not perfectly safe under network partitions (see Kleppmann's article in the Expert Track). For *money-critical* jobs, also make the job idempotent so a double-run is harmless anyway. **Belt and braces.**

**Option B — an external scheduler (the clean answer)**

Take the clock out of your app entirely. Something outside triggers the job **once**:

- **Kubernetes CronJob** — spins up a pod on a schedule.
- **Cloud scheduler** (EventBridge, Cloud Scheduler) → hits an endpoint or drops a queue message.
- A dedicated **scheduler service** with leader election.

The trigger fires once, drops a job on the queue, and your normal workers process it. No lock needed, and the app stays stateless. **Prefer this in production.**

### More scheduling rules

- **Make scheduled jobs idempotent too** — safe to re-run if you have to trigger a missed run manually.
- **Beware timezones and DST.** Run crons in **UTC**. A 2:30am job runs twice (or zero times) on a DST boundary.
- **Handle missed runs.** If the server was down at 9am, does the 9am job run late — or never? Decide deliberately.
- **Don't schedule everything at `0 * * * *`.** Every job firing on the hour creates a load spike. Stagger them.
- **Alert if a job DIDN'T run.** Silence is not success. Use a heartbeat/dead-man's-switch: the job pings a monitor when it completes, and the monitor alerts if the ping never arrives.

## Monitor your jobs

| Metric | Why |
|---|---|
| **Queue depth** | Growing = workers can't keep up. Scale them. |
| **Job latency** (enqueue → start) | How long users wait for their email |
| **Failure rate** | Something's broken |
| **DLQ depth** | 🚨 Poison messages piling up |
| **Worker heartbeat** | Are the workers even alive? |

> A silently dead worker pool is a classic outage: the API looks perfectly healthy (200s everywhere) while no email has been sent for six hours.

## Key takeaways

- Workers run **separately** from the API and scale independently. Set **concurrency**, **timeouts**, and **graceful shutdown**.
- Jobs must be **idempotent** (at-least-once delivery), take **IDs not objects**, and retry with **exponential backoff + jitter**.
- **Retry transient failures only** — permanent errors go straight to the **dead-letter queue**. Alert on DLQ depth.
- 🚨 **In-app cron runs on every instance** — use a **distributed lock** or, better, an **external scheduler** (K8s CronJob / cloud scheduler) that fires once.
- Run crons in **UTC**, stagger them, and **alert when a job fails to run** — silence isn't success.
