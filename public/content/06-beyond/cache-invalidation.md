# Cache Invalidation Strategies

> *"There are only two hard things in Computer Science: cache invalidation and naming things."* — Phil Karlton

Caching is easy. **Knowing when to throw the cached copy away** is the hard part — and getting it wrong means showing users stale, wrong data.

## The core tension

A cache is a **copy**. The moment the original changes, your copy is a **lie**. Invalidation is the discipline of un-lying, and it's a trade-off between three things:

- **Freshness** — how stale can data be?
- **Performance** — how often do we hit the slow path?
- **Complexity** — how much machinery are we willing to maintain?

You cannot maximize all three. Pick per data type.

---

## Strategy 1: TTL (time-based expiry) — your default

Set a lifetime. When it expires, the entry vanishes and the next read repopulates it.

```js
await redis.set(`user:${id}`, JSON.stringify(user), "EX", 300);  // 5 minutes
```

- ✅ **Dead simple. Self-healing.** Even if every other invalidation path has a bug, staleness is bounded by the TTL.
- ❌ Data can be stale for up to the TTL. Too short and you lose the cache's benefit; too long and users see old data.

> **Always set a TTL, even when you also invalidate explicitly.** It's your safety net for the bugs you haven't found yet. A cache entry with no TTL and a broken invalidation path is stale *forever*.

**Choosing a TTL:** ask "how wrong can this be before someone is harmed?" A product description: hours. A price: seconds, or explicit invalidation. A bank balance: don't cache it.

---

## Strategy 2: Write-through — update cache and DB together

On write, update **both** the database and the cache, synchronously.

```js
async function updateUser(id, data) {
  const user = await db.users.update(id, data);                 // 1. DB
  await redis.set(`user:${id}`, JSON.stringify(user), "EX", 300); // 2. cache
  return user;
}
```

- ✅ The cache is always fresh. Reads always hit.
- ❌ Slower writes. And you cache things nobody may ever read.
- ⚠️ **Two systems, two failure points.** If the DB write succeeds and the Redis write fails, your cache now holds stale data. (A TTL saves you.)

---

## Strategy 3: Write-behind (write-back) — update cache now, DB later

Write to the cache immediately and flush to the database asynchronously.

- ✅ **Very fast writes** — great for high-volume, low-value writes (view counts, likes).
- ❌ **You can lose data.** If the cache dies before flushing, those writes are gone forever.

Only use this where losing a few writes is genuinely acceptable. Never for orders, payments, or user data.

---

## Strategy 4: Explicit invalidation (cache busting) — delete on write

Don't *update* the cache on write — just **delete** the entry. The next read repopulates it naturally (cache-aside).

```js
async function updateUser(id, data) {
  const user = await db.users.update(id, data);
  await redis.del(`user:${id}`);      // 💥 evict — next read rebuilds it
  return user;
}
```

- ✅ Simpler and safer than write-through: no risk of writing a *wrong* value into the cache.
- ✅ Lazily rebuilds only what's actually read.
- ❌ **The hard part: knowing every key affected by a write.**

### The dependency problem

Update one user's name. Which cached things are now wrong?

```
user:42                    ← obviously
user:42:profile            
team:7:members             ← their name is embedded in this list
search:results:"ada"       ← and in this
homepage:featured-users    ← and here
```

Miss one and it lies indefinitely. **This is why cache invalidation is genuinely hard** — it's a distributed dependency-tracking problem.

### The fix: tags / key namespaces

Group related keys so you can evict them together:

```js
// Tag every key that embeds user 42's data
await redis.sAdd("tag:user:42", "user:42", "team:7:members", "search:ada");

// On update, evict the whole tagged set at once
async function invalidateUser(id) {
  const keys = await redis.sMembers(`tag:user:${id}`);
  if (keys.length) await redis.del(keys);
  await redis.del(`tag:user:${id}`);
}
```

> ⚠️ **Never use `KEYS user:42:*` in production** — it blocks Redis while it scans every key in the database. Use `SCAN`, or (better) maintain tag sets like above.

### Versioned keys (the elegant trick)

Instead of hunting down keys to delete, **change the key name**. Old entries become unreachable and expire on their own.

```js
// Bump a version number; every derived key changes automatically
const v = await redis.incr(`user:${id}:version`);   // 7 → 8
const key = `user:${id}:v${v}:profile`;             // a brand-new key
```

No deletion, no dependency tracking, no risk of missing a key. Orphaned old entries simply age out via TTL. This is a beautiful pattern — use it when dependencies get gnarly.

---

## The failure modes you must know

### 🐘 Cache stampede (thundering herd)

A popular key expires. **1,000 concurrent requests** all miss simultaneously and all hammer the database at once — which then falls over, so nothing repopulates the cache, so the next 1,000 requests do it again.

```
key expires → 1000 misses → 1000 identical DB queries → 💥
```

**Fixes:**
1. **Single-flight / lock** — the first request rebuilds; the rest wait for its result.
   ```js
   const lock = await redis.set(`lock:${key}`, "1", { NX: true, EX: 10 });
   if (lock) {
     value = await db.fetch();           // I'll rebuild
     await redis.set(key, value, "EX", 300);
   } else {
     await sleep(50);                     // someone else is rebuilding
     value = await redis.get(key);
   }
   ```
2. **Stagger TTLs with jitter** — `300 + random(0..60)` seconds, so a batch of keys written together don't all expire in the same instant.
3. **Probabilistic early refresh** — refresh a key slightly *before* it expires, at random, so one unlucky request rebuilds it while the old value still serves everyone else.

### 👻 Cache penetration

Requests for a key that **doesn't exist** (often malicious: `GET /user/99999999`). Every one misses the cache and hits the database — the cache provides zero protection.

**Fix:** cache the "not found" answer too, with a short TTL. (Or put a **Bloom filter** in front — see the Expert Track.)

```js
if (!user) {
  await redis.set(key, "NULL", "EX", 60);  // cache the miss, briefly
}
```

### ❄️ Cache avalanche

Your whole cache restarts, or a huge batch of keys expires at once → *everything* misses simultaneously → the DB is crushed.

**Fix:** jittered TTLs (again), and **warm** critical keys on startup before taking traffic.

---

## Choosing a strategy

| Data | Strategy |
|---|---|
| Product catalog (rarely changes) | Long TTL |
| User profile | TTL + explicit delete on update |
| View / like counts | Write-behind (losing a few is fine) |
| Prices, inventory | Short TTL + explicit invalidation |
| Account balance, permissions | **Don't cache** — or cache for seconds with strict invalidation |

## Key takeaways

- **Always set a TTL**, even alongside explicit invalidation — it's the safety net for invalidation bugs.
- **Delete-on-write** (evict, let the next read rebuild) is safer than update-on-write.
- The genuinely hard part is **knowing every key a write invalidates** → use **tag sets** or **versioned keys** (bump a version and old keys become unreachable).
- Know the three failure modes: **stampede** (lock/jitter), **penetration** (cache the null), **avalanche** (jitter + warm-up).
- Never `KEYS *` in production. Choose freshness vs performance **per data type** — some things you simply don't cache.
