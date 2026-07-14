<div align="center">

<sub>[← BackendPath](../README.md)</sub>

# 🚀 Part 9 · DevOps & deploys

**Containers, CI/CD, zero-downtime deploys.**

<sub>`3 min read`</sub>

</div>

---

### In this part

- [9.1 Containers](#91-containers)
- [9.2 Deployment strategies](#92-deployment-strategies)
- [9.3 🚨 Zero-downtime migrations: old and new code run **at the same time**](#93--zero-downtime-migrations-old-and-new-code-run-at-the-same-time)
- [9.4 Feature flags — deploying ≠ releasing](#94-feature-flags--deploying--releasing)
- [9.5 Observability](#95-observability)

---

## 9.1 Containers

A container bundles your app **and its entire runtime** into one image. The image that passed CI is byte-for-byte the image in production. **That reproducibility is the whole point.**

```dockerfile
# Multi-stage: build fat, ship lean
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci                    # ← cached UNLESS package files change
COPY . .
RUN npm run build

FROM node:22-alpine           # final image: no build tools, much smaller
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
USER node                     # ✅ don't run as root
CMD ["node", "dist/server.js"]
```

**Why `COPY package*.json` *before* the source?** Each instruction is a **cached layer**, and a changed layer invalidates **every layer after it**. Copy the source first and you reinstall every dependency on every one-line change.

**Never bake secrets into an image** — anyone who pulls it can read every layer.

## 9.2 Deployment strategies

| Strategy | Downtime | Blast radius |
|---|:--|---|
| Recreate | ❌ yes | everyone |
| Rolling *(K8s default)* | none | grows as pods swap |
| Blue-green | none | 100% at once — but **instant** rollback |
| **Canary** ⭐ | none | **a bug hits 5% of users, not all of them** |

## 9.3 🚨 Zero-downtime migrations: old and new code run **at the same time**

During any rolling deploy, **both versions hit the same database** for minutes. So **the schema must work with both.**

```sql
ALTER TABLE users RENAME COLUMN name TO full_name;
```

Every still-running old instance queries `name` → **starts throwing errors instantly**. You just caused an outage in the middle of a "zero-downtime" deploy.

**The expand/contract dance — six steps to rename one column:**

1. **EXPAND** — add the new column (nullable). Old code ignores it.
2. Deploy code that **writes both**, reads the old.
3. **BACKFILL** in batches (never one giant `UPDATE` that locks millions of rows).
4. Deploy code that **reads the new** column.
5. Deploy code that **stops using the old** one.
6. **CONTRACT** — finally drop the old column.

> Six steps and several deploys, to rename a column. **That is the real cost of zero downtime** — and why experienced engineers are so careful with schema changes.

Also: **`CREATE INDEX CONCURRENTLY`**. A plain `CREATE INDEX` **locks writes** on the table — on a big hot table, that's an outage.

## 9.4 Feature flags — deploying ≠ releasing

Ship code to production **dark** (disabled). Then turn it on for 1% → your team → 10% → everyone, **from a dashboard, without a redeploy**.

A bug? **Flip it off in seconds.**

This is how companies deploy dozens of times a day safely: the risky moment isn't the deploy, it's the **release** — and a flag makes the release instantly reversible.

## 9.5 Observability

- **Logs** — discrete events. Structured **JSON**, never `console.log`. Attach a **correlation id** to follow one request across five services.
- **Metrics** — numbers over time. **The four golden signals: latency, traffic, errors, saturation.**
- **Traces** — one request's whole journey. The only way to see *which hop* is slow.

> **Alert on symptoms, not causes.** Don't alert on "CPU is 90%" — that might be perfectly healthy. Alert on what **users feel**: *error rate > 1% for 5 minutes*, *p95 > 1s*, *checkout success dropped*.
>
> Every alert must be **actionable**. An alert nobody acts on trains everyone to ignore alerts — and that's how real outages get missed.

---

<div align="center">

[← 🕸️ Part 8 · Reliability](08-reliability.md) · [**Contents**](../README.md#contents) · [🧠 Part 10 · System design →](10-system-design.md)

<sub><a href="#top">↑ back to top</a></sub>

</div>
