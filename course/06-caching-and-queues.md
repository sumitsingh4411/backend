<div align="center">

<sub>[← BackendPath](../README.md)</sub>

# 🔁 Part 6 · Caching & queues

**Serve it fast, do the slow work later.**

<sub>`3 min read`</sub>

</div>

---

### In this part

- [6.1 Caching is buying speed with staleness](#61-caching-is-buying-speed-with-staleness)
- [6.2 Cache-aside — the pattern you'll use 90% of the time](#62-cache-aside--the-pattern-youll-use-90-of-the-time)
- [6.3 🚨 The three ways a cache takes down your database](#63--the-three-ways-a-cache-takes-down-your-database)
- [6.4 Queues — respond now, work later](#64-queues--respond-now-work-later)
- [6.5 🚨 The cron trap that emails your customers 20 times](#65--the-cron-trap-that-emails-your-customers-20-times)

---

## 6.1 Caching is buying speed with staleness

| Layer | Speed |
|---|---|
| In-process memory | ~0.1ms |
| Redis (same DC) | ~1ms |
| Postgres (indexed) | ~10ms |

Every cache can serve data that is **wrong** (stale), and every entry must be removed at the right moment. Cache things where a few seconds of stale is fine. Think very hard before caching anything else.

## 6.2 Cache-aside — the pattern you'll use 90% of the time

```js
async function getUser(id) {
  const key = `user:${id}`;

  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);           // HIT

  const user = await db.users.find(id);            // MISS → source of truth
  await redis.set(key, JSON.stringify(user), "EX", 300);   // TTL 5 min
  return user;
}

// On write: DELETE the key. Do NOT update it.
async function updateUser(id, data) {
  const user = await db.users.update(id, data);
  await redis.del(`user:${id}`);                   // next read repopulates
  return user;
}
```

> **Delete on write. Don't update.** Updating both the DB and the cache is two writes that can interleave — two concurrent updates can leave the cache holding the **older** value permanently. Deleting sidesteps the race entirely.
>
> And **always set a TTL**, even with perfect invalidation. It's the backstop for the bug you didn't foresee.

## 6.3 🚨 The three ways a cache takes down your database

| Failure | What happens | Fix |
|---|---|---|
| **Stampede** | a hot key expires → **10,000 requests all miss at once** and hammer the DB with the same expensive query | a lock, so **one** rebuilds while the rest wait; or refresh *before* expiry |
| **Penetration** | requests for keys that don't exist skip the cache **every time** (often an attack) | cache the *negative* result too |
| **Avalanche** | many keys share one expiry time and all die together | add **random jitter** to every TTL |

The stampede is the one that pages you at 3am.

## 6.4 Queues — respond now, work later

Signup fires a welcome email, thumbnails, an analytics event, a CRM sync. Do it inline and the request takes 4 seconds and **fails if any downstream is down**.

Put a job on a queue → **return in 50ms**. A worker does the rest. Queues also **absorb spikes**: work piles up in the queue instead of knocking the service over.

> ### 🚨 At-least-once delivery means duplicates. Always.
>
> A worker pulls a job, does the work, then **crashes before acknowledging it**. The queue sees no ack, so it **redelivers**. The job runs again. If it charged a card — you charged twice.
>
> **Design every job to be safe to run more than once.** Ack *after* the work, never before. Retry with **backoff + jitter**, cap the attempts, and send poison messages to a **dead-letter queue** — otherwise one bad message retries forever and stalls the whole queue.

## 6.5 🚨 The cron trap that emails your customers 20 times

You add a nightly job with a cron inside your app. In production the app runs on **20 instances** — so the cron fires on **all twenty**, and every customer gets the newsletter **twenty times**.

**Fix:** a distributed lock (`SET lock NX EX 3600` in Redis) so exactly one instance wins — or a real scheduler (Kubernetes CronJob) that runs the task **once**, outside your app processes.

---

<div align="center">

[← 🔐 Part 5 · Security](05-security.md) · [**Contents**](../README.md#contents) · [⚡ Part 7 · Performance →](07-performance.md)

<sub><a href="#top">↑ back to top</a></sub>

</div>
