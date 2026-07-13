# Caching & Redis

**Caching** is storing the result of expensive work so the next request gets it instantly. It's the cheapest, highest-impact performance win in backend — and the easiest to get subtly wrong.

## Why it works

Most systems read the same data far more than they change it. If a query takes 200ms and the answer is identical for 10,000 users, computing it 10,000 times is pure waste. Compute once, serve from memory (~1ms).

```
Without cache:  request → database (200ms) → response
With cache:     request → cache HIT (1ms) → response   ⚡
                request → cache MISS → database → store in cache → response
```

## Layers of cache (there are many)

1. **Browser cache** — the client stores assets (`Cache-Control` headers).
2. **CDN** — edge servers cache content near users (great for static files).
3. **Application cache** — **Redis/Memcached** holding query results, sessions.
4. **Database cache** — the DB's own buffer pool.

Backend work lives mostly at **layer 3**.

## Redis: the workhorse

**Redis** is an in-memory key-value store. Because it lives in RAM, it's extremely fast. It's used for caching, sessions, rate-limit counters, queues, and pub/sub.

```js
// JavaScript (ioredis) — the cache-aside pattern
async function getUser(id) {
  const key = `user:${id}`;

  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);      // HIT

  const user = await db.users.find(id);       // MISS → do the real work
  await redis.set(key, JSON.stringify(user), "EX", 300);  // store, expire in 5 min
  return user;
}
```

```python
# Python (redis-py)
def get_user(id):
    key = f"user:{id}"
    if cached := r.get(key):
        return json.loads(cached)
    user = db.find_user(id)
    r.setex(key, 300, json.dumps(user))   # TTL 300s
    return user
```

```go
// Go (go-redis)
val, err := rdb.Get(ctx, key).Result()
if err == redis.Nil {                       // miss
	user = db.FindUser(id)
	rdb.Set(ctx, key, marshal(user), 5*time.Minute)
}
```

```java
// Java (Spring) — declarative caching
@Cacheable(value = "users", key = "#id")
public User getUser(Long id) { return repository.findById(id); }
```

That pattern — check cache, else compute and store — is called **cache-aside** (or lazy loading). It's the one you'll use 90% of the time.

## TTL: always set an expiry

A **TTL** (time-to-live) auto-expires entries. It's your safety net: even if your invalidation logic has a bug, stale data disappears on its own. **Never cache without a TTL** unless you have a very good reason.

## What to cache

✅ Expensive queries, aggregations, external API responses, rendered pages, session data, config.
❌ Rapidly-changing data, per-user data with no reuse, anything where stale = dangerous (account balances).

## Know these failure modes

- **Cache stampede** — a hot key expires and 1,000 requests hit the database simultaneously. → Use a lock/single-flight, or stagger TTLs.
- **Cold cache** — after a restart, everything misses at once. → Warm critical keys.
- **Stale data** — the cache lies. → Sensible TTLs + invalidation (next lesson).

## Key takeaways

- Caching trades **freshness for speed** — the core trade-off.
- **Cache-aside** (check → miss → compute → store) is the default pattern.
- **Redis** is the standard application cache: fast, in-memory, also great for sessions/counters.
- **Always set a TTL**; watch for stampedes on hot keys.
