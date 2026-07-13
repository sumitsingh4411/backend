# Connection Pooling

A subtle topic that takes down real production systems — and one almost nobody explains until you've already been burned.

## Why connections are expensive

Opening a database connection isn't free. Every single one costs:

1. A **TCP handshake**
2. A **TLS handshake**
3. **Authentication** (password check)
4. In Postgres: **the server forks an entire OS process** for you (~5–10 MB of RAM each)

That's **tens of milliseconds** — often longer than your actual query. Doing it per request is madness:

```js
// ❌ NEVER — a new connection for every single request
app.get("/users", async (req, res) => {
  const conn = await db.connect();     // ~30ms of pure overhead
  const users = await conn.query("SELECT * FROM users");
  await conn.close();
  res.json(users);
});
```

## The pool

A **connection pool** opens a small set of connections **once**, at startup, and lends them out:

```
         ┌─────────── POOL (10 connections) ───────────┐
req A ──▶│ [busy] [busy] [idle] [idle] ... [idle]      │──▶ Database
req B ──▶│    ↑ borrow → query → return (don't close!) │
req C ──▶│ (waits if all 10 are busy)                  │
         └─────────────────────────────────────────────┘
```

Borrow → query → **return to the pool** (not close). The expensive handshake happens once, not per request.

```js
// ✅ Create the pool ONCE, at module scope
import { Pool } from "pg";
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                      // max connections in this pool
  idleTimeoutMillis: 30_000,    // close idle ones after 30s
  connectionTimeoutMillis: 5_000, // fail fast if none free in 5s
});

app.get("/users", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM users");  // borrow + return
  res.json(rows);
});
```

```python
# Python (SQLAlchemy)
engine = create_engine(DATABASE_URL, pool_size=10, max_overflow=5, pool_timeout=5)
```

```go
// Go — database/db IS a pool. Create it once and share it.
db, _ := sql.Open("postgres", dsn)
db.SetMaxOpenConns(10)
db.SetMaxIdleConns(5)
db.SetConnMaxLifetime(30 * time.Minute)
```

```java
// Java (HikariCP — the fastest, and the default in Spring Boot)
HikariConfig cfg = new HikariConfig();
cfg.setJdbcUrl(url);
cfg.setMaximumPoolSize(10);
HikariDataSource ds = new HikariDataSource(cfg);
```

## 🚨 The trap that breaks production: pools multiply

This is the one that bites everyone.

Postgres has a hard limit — `max_connections`, commonly **100**. Now you scale up:

```
10 app instances × pool size 20 = 200 connections demanded
Postgres max_connections = 100
                                → 💥 "FATAL: sorry, too many clients already"
```

**Your pool size is per-process, not per-cluster.** It silently multiplies by your instance count. Autoscaling from 3 → 20 pods can take the database down while your app servers look perfectly healthy.

> **Do the arithmetic:** `instances × pool_size ≤ max_connections − (headroom for migrations, admin, monitoring)`.

This gets *much* worse with **serverless**, where every concurrent function invocation may want its own connection. A traffic spike → thousands of connection attempts → dead database.

## The counter-intuitive truth: smaller pools are usually faster

Everyone's instinct is to raise the pool size when things get slow. **That usually makes it worse.**

Your database has a fixed number of CPU cores and disks. Throwing 100 concurrent queries at an 8-core machine doesn't run them 100× faster — it makes them all contend, thrash context switches, and finish *slower*. You've queued the work inside the database, where you can't see it or control it.

> **A queue is going to form somewhere.** It's far better for it to form in your app's pool — where it's visible, measurable, and has a timeout — than inside the database.

A common starting formula:

```
pool_size ≈ (cpu_cores × 2) + effective_spindles
```

For most apps, that means a pool of **~10 per instance is plenty** — even for high traffic. HikariCP's maintainers demonstrated a case where dropping from 2,048 connections to **96** cut response times dramatically.

**Start small (10). Raise it only when metrics prove you're pool-starved.**

## The fix at scale: an external pooler

When you truly have many instances (or serverless), put a **connection proxy** between your apps and the database:

```
20 app instances ──▶ [ PgBouncer ] ──▶ Postgres
   (2000 client                          (only 20 real
    connections)                          connections)
```

**PgBouncer** in *transaction mode* multiplexes thousands of client connections onto a tiny number of real ones — it hands you a real connection only for the duration of a transaction.

⚠️ **Transaction mode has rules:** you lose session-level features — `PREPARE`d statements, session variables, `LISTEN/NOTIFY`, and advisory locks held across statements. Most ORMs need `prepare: false` or similar. Check your driver's docs.

## Symptoms of a pool problem

| Symptom | Likely cause |
|---|---|
| `too many clients already` | instances × pool_size > max_connections |
| Requests hang, then time out | Pool exhausted — all connections busy |
| Latency spikes under load, DB CPU is low | Pool starvation (too *small*, or leaked) |
| Works locally, dies in production | Pool multiplied across instances |

### The leak

The nastiest bug: **borrow a connection and never return it.**

```js
// ❌ LEAK — if the query throws, release() never runs
const client = await pool.connect();
const result = await client.query("SELECT ...");   // 💥 throws
client.release();                                   // never reached!

// ✅ Always release in `finally`
const client = await pool.connect();
try {
  return await client.query("SELECT ...");
} finally {
  client.release();          // runs even on error
}
```

Leak a few per hour and the pool slowly empties until the app freezes at 3am. **Prefer `pool.query()`** (which handles borrow/return for you) and only take an explicit client when you need a transaction.

## Monitor these

- **Active / idle / waiting** counts in the pool
- **Time spent waiting** to acquire a connection (should be ~0)
- Database-side connection count vs `max_connections`

## Key takeaways

- Opening a DB connection is **expensive** (TCP + TLS + auth + a forked process) — a **pool** opens a few once and reuses them.
- 🚨 **Pool size multiplies by instance count.** `instances × pool_size` must stay under `max_connections`, or you'll get "too many clients."
- **Smaller pools are usually faster** — ~10 per instance. A queue forms somewhere; better in your app (visible, with a timeout) than inside the DB.
- At scale or on serverless, use **PgBouncer** in transaction mode (and know what it disables).
- **Always release connections in a `finally`** — leaks drain the pool and freeze the app.
