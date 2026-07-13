# Design: URL Shortener

The classic first system-design question (think bit.ly, tinyurl). It looks trivial and quietly touches **everything** you've learned: APIs, databases, caching, scale, and consistency.

Let's design it the way a senior engineer would — and learn the *method*, not just the answer.

## Step 1: Clarify requirements (never skip this)

**Functional:**
- Given a long URL, return a short one (`short.ly/aB3xK9`).
- Visiting the short URL redirects to the original.
- (Optional) custom aliases, expiry, click analytics.

**Non-functional — this is where the design is actually decided:**
- **Read-heavy**: roughly **100 reads : 1 write**. (People click far more than they create.)
- Redirects must be **fast** (< 100ms).
- **High availability** — a dead link shortener is useless.
- Short codes must be **unique**.

## Step 2: Estimate the scale (back-of-envelope)

This tells you whether you need one box or a fleet.

```
Writes:  100 million new URLs / year
         ≈ 3 writes/sec average
Reads:   100 × that ≈ 300 reads/sec average (peak maybe 10×)

Storage: 100M URLs/year × ~500 bytes ≈ 50 GB/year
         → 5 years ≈ 250 GB.  Fits comfortably on one database. 
```

**Key insight:** the write volume is *tiny*. The read volume is what matters — so **optimize reads**. That single observation drives the entire design.

## Step 3: The API

```http
POST /api/shorten
{ "url": "https://example.com/very/long/path", "customAlias": null }
→ 201 { "shortUrl": "https://short.ly/aB3xK9" }

GET /aB3xK9
→ 301/302 Location: https://example.com/very/long/path
```

**301 vs 302 — a real trade-off:**
- **301 (permanent)** — the *browser caches it* and stops hitting your server. Less load, but **you lose click analytics**.
- **302 (temporary)** — every click reaches you. More load, **but you can count clicks**.
> Analytics is usually the business model → **302**.

## Step 4: Generating the short code

This is the heart of the problem. Options:

**(a) Hash the URL** (e.g. MD5 → take 7 chars)
❌ **Collisions.** Two different URLs can produce the same code. You'd have to check-and-retry on every write.

**(b) Random string**
❌ Same collision problem — you must check the DB for uniqueness each time.

**(c) ✅ Auto-increment ID → Base62 encode**

Take a globally unique counter and encode it in **Base62** (`a-z A-Z 0-9`):

```js
const CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function toBase62(id) {
  let s = "";
  while (id > 0) {
    s = CHARS[id % 62] + s;
    id = Math.floor(id / 62);
  }
  return s || "0";
}

toBase62(125);        // "21"
toBase62(999999999);  // "15FTGf"
```

**Why this wins: collisions are structurally impossible** — each ID is unique, so each code is unique. No lookups, no retries.

**How many URLs fit?** `62^7 ≈ 3.5 trillion` — seven characters is plenty forever.

⚠️ **The catch:** sequential IDs make codes **guessable/enumerable** (someone can crawl `aB3xK8`, `aB3xK9`…). Fixes: hash/scramble the ID before encoding, or add random padding. Mention this in an interview — it shows security awareness.

**Getting unique IDs at scale:** a single DB sequence is a bottleneck/SPOF. Use a **distributed ID generator** (Snowflake) or hand each server a **pre-allocated range** of IDs (server A gets 1–1M, server B gets 1M–2M) so they never coordinate.

## Step 5: Storage

Access is purely **key → value** (`code → long_url`). No joins, no complex queries. That means a **key-value store** (DynamoDB, Cassandra) is a natural fit and scales trivially — though Postgres with an index on `code` handles this fine up to a large scale too.

```sql
CREATE TABLE urls (
  id         BIGINT PRIMARY KEY,
  code       VARCHAR(10) UNIQUE NOT NULL,   -- indexed!
  long_url   TEXT NOT NULL,
  user_id    BIGINT,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);
CREATE INDEX idx_urls_code ON urls(code);
```

## Step 6: Make reads fast — cache

With a 100:1 read ratio, **caching is the single highest-leverage decision.**

Link popularity follows a **power law**: a tiny fraction of links get the overwhelming majority of clicks (a viral link gets millions; most get 3). So a modest cache holding the hot keys serves the **vast majority** of traffic.

```js
async function resolve(code) {
  const cached = await redis.get(`url:${code}`);
  if (cached) return cached;                       // ⚡ ~1ms — most requests land here

  const row = await db.urls.findByCode(code);      // cache miss → DB
  if (!row) return null;

  await redis.set(`url:${code}`, row.long_url, "EX", 86400);  // cache for a day
  return row.long_url;
}
```

Use **LRU eviction** — it naturally keeps the popular links resident.

## Step 7: The full architecture

```
            ┌─────────────┐
 client ──▶ │     CDN     │  (optional edge caching)
            └──────┬──────┘
                   ▼
            ┌─────────────┐
            │ Load Balancer│
            └──────┬──────┘
             ┌─────┴─────┐
             ▼           ▼
        [ app 1 ]   [ app 2 ]   ← stateless, scale horizontally
             └─────┬─────┘
          ┌────────┴────────┐
          ▼                 ▼
    [ Redis cache ]   [ Database ]   ← + read replicas
          (hot links)      (source of truth)
                   │
                   ▼
            [ queue ] ──▶ analytics worker   ← click counting, async!
```

**Count clicks asynchronously.** Never make the user's redirect wait on an analytics write — push an event to a queue and let a worker aggregate it. The redirect returns immediately.

## The takeaway: the *method*

Notice the pattern you just followed — it works for **any** system design question:

1. **Clarify** requirements (functional + non-functional).
2. **Estimate** scale → let the numbers reveal the real problem.
3. Design the **API**.
4. Solve the **core algorithm** (here: unique code generation).
5. Choose **storage** based on the access pattern.
6. **Optimize the bottleneck** (here: reads → cache).
7. **Scale out** and push non-critical work **async**.

## Key takeaways

- Read:write of 100:1 means **the design is about reads** → **cache aggressively** (power-law traffic makes caching extremely effective).
- **Base62-encode a unique ID** — collisions become structurally impossible. Scramble it to avoid enumeration.
- Access is key-value → a simple indexed lookup; app servers stay **stateless** behind a load balancer.
- Push **analytics to a queue** so redirects stay fast.
- **The method matters more than the answer**: clarify → estimate → API → core algorithm → storage → bottleneck → scale.
