# Design: News Feed

Design Twitter's timeline / Facebook's feed / Instagram's home screen. This problem is beloved by interviewers because the naive answer is fine at small scale and **catastrophically wrong** at large scale — and the fix is genuinely clever.

## Requirements

**Functional:** users follow others · users post · a user's feed shows recent posts from everyone they follow, newest first · infinite scroll.

**Non-functional:**
- **Massive read:write skew** — people scroll *constantly*, post rarely. Think **100:1** or worse.
- Feed load must be **fast** (< 200ms) — this is the app's front page.
- Highly available. Slight staleness is **fine** (a post appearing 5 seconds late harms nobody).

That last point is a gift. **Note it** — it's what permits everything below.

## Estimate the scale

```
300M daily active users
Each posts ~2/day        → 600M posts/day  ≈ 7,000 writes/sec
Each loads feed 10×/day  → 3B reads/day    ≈ 35,000 reads/sec  (peak 5×)

Average follower count: ~200
```

**Reads dominate by ~100×.** So: **optimize reads, even at the cost of expensive writes.** That single sentence dictates the design.

---

## Approach 1: Fan-out on READ (pull)

Compute the feed **when the user opens the app**.

```sql
SELECT * FROM posts
WHERE author_id IN (SELECT followee_id FROM follows WHERE follower_id = 42)
ORDER BY created_at DESC
LIMIT 20;
```

✅ **Writes are trivial** — a post is one row insert.
✅ **No wasted work** — you only build feeds people actually look at.
✅ Always fresh.

❌ **Reads are brutal.** For every single feed load, you must query across 200 followees' posts, merge, and sort. At 35,000 reads/sec this crushes the database.
❌ Feed latency grows with how many people you follow.

> This is fine for a small app. It **does not survive** at scale — you're doing the expensive work on the frequent operation.

---

## Approach 2: Fan-out on WRITE (push) — precompute

Flip it. When someone posts, **immediately push the post ID into every follower's precomputed feed list.**

```js
// On post — do the expensive work ONCE, at write time
async function createPost(userId, content) {
  const post = await db.posts.insert({ userId, content });

  const followers = await db.follows.getFollowers(userId);   // e.g. 200 people

  // push into each follower's materialized feed (a Redis list per user)
  await Promise.all(followers.map((f) =>
    redis.lPush(`feed:${f.id}`, post.id)
  ));
  await Promise.all(followers.map((f) =>
    redis.lTrim(`feed:${f.id}`, 0, 799)   // keep only the newest 800
  ));
}
```

Reading a feed is now **absurdly cheap**:

```js
// Just read a precomputed list. ~1ms.
const postIds = await redis.lRange(`feed:${userId}`, 0, 19);
const posts = await getPostsByIds(postIds);   // hydrate from cache/DB
```

✅ **Reads are O(1)** — a single Redis list read. Exactly what we wanted for the 100× operation.
✅ Feed latency is constant regardless of how many people you follow.

❌ **Writes are expensive** — one post = 200 Redis writes.
❌ Wasted work for inactive users (you're maintaining feeds nobody opens).

At 7,000 posts/sec × 200 followers = **1.4M feed-writes/sec**. That's a lot… but it's **asynchronous** (do it in a background worker — the user's post returns instantly) and Redis is very fast. **This trade is worth it.**

---

## 🚨 The celebrity problem

Now the design breaks.

A user with **50 million followers** posts:

```
1 post → 50,000,000 Redis writes
```

- That job takes **minutes**. Early followers see it instantly; late ones see it 10 minutes later.
- It saturates your entire write path, delaying *everyone else's* posts.
- If several celebrities post at once, the system falls over.

This is **write amplification**, and it's why pure fan-out-on-write fails.

## ✅ The answer: a hybrid

**Use the right strategy per user type.**

```
Normal users (< ~10k followers)  →  FAN-OUT ON WRITE (push)
                                     precomputed into followers' feeds

Celebrities (> ~10k followers)   →  FAN-OUT ON READ (pull)
                                     NOT pushed anywhere
```

Then, **at read time, merge the two:**

```js
async function getFeed(userId) {
  // 1. The precomputed part — cheap, already built by fan-out-on-write
  const pushIds = await redis.lRange(`feed:${userId}`, 0, 99);

  // 2. The celebrities this user follows — pulled live (there are only a few)
  const celebs = await getCelebritiesFollowedBy(userId);       // usually < 50
  const celebPosts = await getRecentPostsByAuthors(celebs, 100); // cached hard

  // 3. Merge, sort by time, dedupe, take the top N
  return merge(await hydrate(pushIds), celebPosts)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 20);
}
```

**Why this works so beautifully:**
- A celebrity's post is written **once**, not 50 million times. Write amplification vanishes.
- A user follows only a **handful** of celebrities, so the "pull" half is small and its results are **shared by millions of users** — so cache them aggressively (one cached list serves everyone who follows that celebrity).
- Everything else is still precomputed and instant.

You get push's fast reads *and* pull's cheap writes, applied exactly where each one wins.

> **This hybrid is the answer the interviewer is listening for.** Reaching it — and explaining *why* — is the whole exercise.

---

## The rest of the architecture

```
        ┌─────────────┐
 user ──│  Gateway    │
        └──────┬──────┘
        ┌──────┴───────┐
        ▼              ▼
  [ Post service ]  [ Feed service ]
        │                  │
   write post         read feed
        │                  │
        ▼                  ▼
   [ Posts DB ]     [ Redis: feed:{userId} lists ]
        │                  ▲
        ▼                  │
   [ Kafka ] ──▶ [ fan-out workers ] ──┘
                  (async, horizontally scalable)
```

**Key choices:**
- **Fan-out happens asynchronously** via a queue. The user's `POST /posts` returns as soon as the post is saved — they never wait for 200 writes.
- **Store post IDs in the feed, not post content.** IDs are tiny; hydrate the content from a shared post cache. Otherwise you'd store a copy of every post 200 times, and editing a post would be impossible.
- **Cap the feed** (`LTRIM` to ~800). Nobody scrolls back 10,000 posts; if they do, fall back to a database query.

## Refinements worth mentioning

- **Only fan out to active users.** ~60% of accounts are dormant. Skip them and compute their feed lazily on the rare occasion they log in. Instantly cuts write volume by more than half.
- **Ranking.** Real feeds aren't chronological — they're ML-ranked by predicted engagement. Fetch a candidate set (~500), then score and re-rank. The candidate generation is exactly what we built above.
- **Pagination:** use a **cursor** (`?after=<post_id>`), never `OFFSET` — the feed shifts constantly under the user, and offsets would duplicate and skip posts.
- **Deletes:** don't hunt down the post ID in 50M feed lists. **Filter at read time** — check the post still exists when hydrating (a tombstone/deleted set). Lazy deletion is the only sane option.

## Key takeaways

- **Reads outnumber writes ~100:1** → do the expensive work at **write** time.
- **Fan-out on read (pull)**: cheap writes, expensive reads — doesn't scale.
- **Fan-out on write (push)**: precompute each user's feed → **O(1) reads**. Do it **asynchronously** via a queue.
- 🚨 It **breaks on celebrities** (1 post → 50M writes = write amplification).
- ✅ **The hybrid is the answer:** push for normal users, **pull for celebrities**, and **merge at read time** — celebrity posts get cached once and shared by millions.
- Store **post IDs** (not content) in capped Redis lists; skip inactive users; paginate with **cursors**; delete **lazily** at read time.
