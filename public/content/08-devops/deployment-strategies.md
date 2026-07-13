# Zero-Downtime Deployment Strategies

Shipping new code without your users noticing. The strategies are easy; the **database** is where people get hurt.

## The strategies

### 1. Recreate — stop the old, start the new

```
[v1 v1 v1]  →  [   nothing   ]  →  [v2 v2 v2]
                  ❌ DOWNTIME
```
Simple, but your site is **down** during the swap. Only acceptable for internal tools or a scheduled maintenance window.

### 2. Rolling — replace instances a few at a time

```
[v1][v1][v1][v1]
[v2][v1][v1][v1]   ← replace one, health-check it, continue
[v2][v2][v1][v1]
[v2][v2][v2][v2]   ✅ no downtime
```

✅ Zero downtime, no extra infrastructure. The **default** in Kubernetes.
❌ **v1 and v2 run simultaneously** during the rollout (remember this — it's the source of the database trap below).
❌ Rollback is slow — you have to roll *back* through the same process.

### 3. Blue-green — two full environments, flip the switch

```
BLUE  (v1) ◀── 100% traffic
GREEN (v2)     ← deploy here, test it in production conditions

                      then flip the load balancer:

BLUE  (v1)     ← keep it warm, ready to flip back
GREEN (v2) ◀── 100% traffic
```

✅ **Instant rollback** — flip the LB back. This is the killer feature.
✅ You can smoke-test green with real infrastructure before sending users to it.
❌ **Double the infrastructure** during the switch.
❌ The traffic switch is all-at-once — if v2 has a bug, **100% of users** hit it immediately.

### 4. Canary — a small slice first (the safest)

```
95% ──▶ [v1]
 5% ──▶ [v2]   ← watch error rate & latency closely
                 healthy? → 25% → 50% → 100%
                 broken?  → route back to v1. Only 5% of users ever saw it.
```

✅ **Bugs are discovered by 5% of users, not 100%.** You limit the blast radius of every deploy.
✅ Real production traffic, real data — catches what staging never will.
❌ Needs traffic-splitting infrastructure (a mesh, a smart LB, or a feature-flag system).
❌ Slower rollout, and you must be **watching the right metrics** — a canary nobody monitors is just a slow deploy.

**Automate the decision:** compare the canary's error rate and p95 latency against the baseline, and auto-rollback if it degrades. Tools like Argo Rollouts and Flagger do exactly this.

| Strategy | Downtime | Rollback | Cost | Risk |
|---|---|---|---|---|
| Recreate | ❌ Yes | Slow | Low | High |
| Rolling | ✅ No | Slow | Low | Medium |
| Blue-green | ✅ No | **Instant** | 2× | Medium |
| **Canary** | ✅ No | Fast | ~1× | **Lowest** |

---

## 🚨 The hard part: database migrations

Here's what breaks real deploys.

**During any rolling or canary deploy, old and new code run AT THE SAME TIME against the SAME database.**

Sit with that for a second. It means:

> **Your schema must work with BOTH the old code and the new code, simultaneously.**

### The trap

You rename a column:

```sql
ALTER TABLE users RENAME COLUMN name TO full_name;   -- 💥
```

The instant that runs, every **still-running v1 instance** — which is querying `name` — starts throwing errors. You've caused an outage in the middle of a "zero-downtime" deploy.

Dropping a column, adding a `NOT NULL` column, or changing a type: **all the same bug.**

### The fix: expand / contract (parallel change)

Never change something in one step. **Expand** to support both, migrate, then **contract**.

**Renaming `name` → `full_name`, safely:**

```
① EXPAND — add the new column (nullable). Deploy nothing yet.
   ALTER TABLE users ADD COLUMN full_name TEXT;
   ✅ v1 ignores it. Nothing breaks.

② Deploy code that WRITES BOTH, READS THE OLD.
   user.name = x; user.full_name = x;
   ✅ Both columns stay in sync from now on.

③ BACKFILL the existing rows (in batches — don't lock the table!).
   UPDATE users SET full_name = name WHERE full_name IS NULL LIMIT 1000;  -- repeat

④ Deploy code that READS THE NEW column (still writing both).
   ✅ Now safe: full_name is fully populated.

⑤ Deploy code that only uses full_name. Stop writing `name`.

⑥ CONTRACT — now, finally, drop the old column.
   ALTER TABLE users DROP COLUMN name;
```

Six steps and several deploys to rename a column. **That is the actual cost of zero downtime**, and it's why experienced engineers are so careful about schema changes.

### Safe vs unsafe operations

| ✅ Safe (backward-compatible) | ❌ Dangerous |
|---|---|
| Add a **nullable** column | Add a `NOT NULL` column (without a default) |
| Add a new table | Drop a column/table still in use |
| Add an index **concurrently** | Rename a column |
| Add a new optional API field | Change a column's type |
| | Add a constraint that existing rows violate |

⚠️ **Also watch out for locks.** In Postgres, `CREATE INDEX` locks writes on the table — on a big table that's an outage. Use `CREATE INDEX CONCURRENTLY`. Likewise, backfill in **batches**, never one giant `UPDATE` that locks millions of rows.

### Rule: migrations run *before* the code that needs them

Run the (expand-only, backward-compatible) migration as its own step, *then* deploy the code. Since the migration is backward-compatible by construction, old code keeps working fine in the gap.

---

## Feature flags: decouple deploy from release

The most powerful idea here. **Deploying code ≠ turning it on.**

```js
if (await flags.isEnabled("new-checkout", user)) {
  return newCheckout(user);      // off by default
}
return oldCheckout(user);
```

- Ship code to production **dark** (disabled), continuously.
- Turn it on for 1% → your team → 10% → everyone, from a dashboard.
- **A bug? Flip the flag off in seconds — no redeploy, no rollback.**

This is how big companies deploy dozens of times a day safely: the risky moment isn't the deploy, it's the *release*, and a flag makes the release instantly reversible.

⚠️ Flags are debt — **delete them** once a feature is fully rolled out, or you'll drown in dead branches.

---

## Make it safe

- ✅ **Health checks** (readiness) — a new instance gets traffic only when it's genuinely ready.
- ✅ **Graceful shutdown** — on `SIGTERM`, stop accepting new requests, finish in-flight ones, *then* exit. Otherwise every deploy drops live requests.
- ✅ **Practise your rollback.** A rollback path you've never tested is not a rollback path.
- ✅ **Watch the deploy** — error rate and latency, for at least a few minutes after.
- ✅ **Deploy small and often.** A 3-line deploy is trivially debuggable; a 3-month deploy is a nightmare. Frequency *reduces* risk.

## Key takeaways

- **Rolling** (default, no downtime), **blue-green** (instant rollback, 2× cost), **canary** (safest — bugs hit 5% of users, not 100%).
- 🚨 During rolling/canary deploys, **old and new code run simultaneously against the same database** — the schema must satisfy both.
- Never rename/drop/retype in one step. Use **expand → migrate → contract** (add nullable, write both, backfill in batches, switch reads, then drop).
- Use `CREATE INDEX CONCURRENTLY` and batched backfills to avoid table locks.
- **Feature flags decouple deploy from release** — ship dark, enable gradually, and kill a bad feature in seconds without a redeploy.
