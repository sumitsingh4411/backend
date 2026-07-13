# Config & Logging

Two unglamorous habits that separate a hobby project from a production system.

---

# Part 1: Configuration

Your app behaves differently in different environments: local uses a test database, production uses the real one. Those differences are **config** — and config must live **outside your code**.

## The 12-Factor rule: config in the environment

```js
// ❌ NEVER — secrets committed to git, one value for all environments
const db = connect("postgres://admin:hunter2@prod-db.example.com/app");

// ✅ Read from the environment
const db = connect(process.env.DATABASE_URL);
```

Why it matters:
- **Secrets in git are leaked forever** — even if you delete them, they live in history. (Rotate any key you've ever committed.)
- The *same build artifact* must run in every environment; only the environment changes.

```bash
# .env (local only — and add .env to .gitignore!)
DATABASE_URL=postgres://localhost/app_dev
JWT_SECRET=dev-secret-not-real
PORT=3000
```

```js
// JavaScript
const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
};

function required(key) {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);  // fail fast at boot
  return v;
}
```

```python
# Python
import os
DATABASE_URL = os.environ["DATABASE_URL"]   # KeyError at startup if missing
PORT = int(os.getenv("PORT", 3000))
```

**Validate config at startup and crash immediately if something's missing.** A server that boots with a missing secret and fails at 3am is far worse than one that refuses to start.

## Where secrets really belong

`.env` is fine locally. In production, use a **secrets manager** — AWS Secrets Manager, Vault, Doppler, or your platform's encrypted env vars. They give you rotation, access control, and an audit trail.

---

# Part 2: Logging

When something breaks in production, logs are often **all you have**. `console.log("here")` will not save you.

## Log structured JSON, not prose

Machines have to parse these. Strings are unsearchable; JSON is queryable.

```js
// ❌ unsearchable
console.log("User " + id + " failed to pay");

// ✅ structured — you can now query: level=error AND event=payment_failed
logger.error({ event: "payment_failed", userId: id, orderId, amount, err: err.message });
```

Use a real logger: **pino**/**winston** (Node), **structlog** (Python), **zap**/**slog** (Go), **Logback** (Java).

## Log levels — and when to use them

| Level | Use for |
|---|---|
| **error** | Something broke and needs attention |
| **warn** | Unexpected, but handled (retry succeeded) |
| **info** | Key business events (user signed up, order placed) |
| **debug** | Verbose detail — off in production |

Set the level by environment: `debug` locally, `info` in production.

## Correlation IDs (the pro move)

One user request may touch five services. Generate a **request ID** at the edge, attach it to every log line, and pass it downstream (`X-Request-Id`). Now you can filter by that ID and see the *entire* journey of one request across your whole system.

```js
app.use((req, _res, next) => {
  req.id = req.headers["x-request-id"] ?? crypto.randomUUID();
  req.log = logger.child({ requestId: req.id });   // every log carries it
  next();
});
```

## Never log these

Passwords, tokens, API keys, credit-card numbers, personal data. Logs get shipped to third parties and read by many people — a logged token is a leaked token. **Redact by default.**

## Key takeaways

- **Config lives in the environment**, never in git. Validate it at boot and **fail fast**.
- Use a **secrets manager** in production; rotate anything ever committed.
- Log **structured JSON** with proper **levels**, not `console.log`.
- Attach a **correlation ID** to trace a request across services — and **never log secrets**.
