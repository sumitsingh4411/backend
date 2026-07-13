# Replication & Sharding

App servers are easy to scale — they're stateless. The **database** is the hard part, because it holds state. Two techniques carry the load: **replication** (copy the data) and **sharding** (split the data).

---

## Replication: copy the same data to multiple databases

One **primary** (accepts writes) and one or more **replicas** (copies, serve reads). The primary streams its changes to the replicas.

```
        writes ──▶ [ PRIMARY ]
                       │ replicates
              ┌────────┼────────┐
              ▼        ▼        ▼
          [replica] [replica] [replica]  ◀── reads
```

### Why it's powerful

Most apps are **read-heavy** (often 90%+ reads). Send all reads to replicas and the primary only handles writes — a huge win from a simple change.

It also gives you:
- **High availability** — if the primary dies, promote a replica (**failover**).
- **Backups/analytics** without hammering production.
- **Geographic locality** — a replica near your users in another region.

### The catch: replication lag

Replication is **asynchronous** — replicas are a few milliseconds (sometimes seconds) behind. That creates a real, classic bug:

```
1. User updates their profile   → written to the PRIMARY
2. Page reloads, reads profile  → served by a REPLICA (not caught up yet)
3. User sees their OLD data  → "the save didn't work!" 😤
```

**Fixes:**
- **Read-your-own-writes**: route a user's reads to the **primary** for a few seconds after they write.
- Read from the primary for anything the user just changed.
- Accept the staleness where it doesn't matter (a public feed can be 1s old — nobody cares).

---

## Sharding: split different data across databases

Replication copies *the same* data everywhere. That doesn't help when the dataset is simply **too big for one machine**, or writes exceed what one primary can take. For that, you **shard** (horizontally partition): each database holds a **different subset** of the rows.

```
users A–H  ──▶ [ shard 1 ]
users I–P  ──▶ [ shard 2 ]      each shard holds different users
users Q–Z  ──▶ [ shard 3 ]
```

### Choosing a shard key (the decision that matters most)

The **shard key** determines which shard a row lives on. Get it wrong and you're stuck.

- **Hash-based** — `shard = hash(user_id) % N`. Spreads data evenly. ✅ Even load, ❌ range queries hit every shard, and changing `N` reshuffles everything (use **consistent hashing** to limit that).
- **Range-based** — by date or alphabet. ✅ Great range scans, ❌ **hotspots** (today's date takes all the writes).
- **Directory-based** — a lookup table says where each key lives. ✅ Flexible, ❌ the lookup is a new bottleneck/SPOF.

**A good shard key is high-cardinality and evenly distributed.** Sharding by `country` is a classic mistake — one country ends up with 80% of your users.

### What sharding costs you

This is why it's a last resort:

- **Cross-shard JOINs are gone.** Data on different machines can't be joined by the DB. You query each shard and join in application code.
- **Cross-shard transactions are gone.** No atomic write across shards.
- **Rebalancing is painful.** Adding a shard means migrating live data.
- **Every query needs the shard key** — or it becomes a scatter-gather across *all* shards.

## The escalation ladder (do these in order)

1. **Optimize** — indexes, kill N+1 queries. *(Usually solves it. Free.)*
2. **Cache** — Redis in front of reads.
3. **Replicate** — offload reads to replicas.
4. **Scale up** — a bigger primary is boring, effective, and cheaper than complexity.
5. **Shard** — only when a single machine genuinely cannot hold the data or absorb the writes.

Most companies never reach step 5. **Don't shard until you must** — it's a one-way door.

## Key takeaways

- **Replication** = same data copied to replicas → scales **reads** + gives HA/failover. Beware **replication lag** (read-your-own-writes).
- **Sharding** = different data split across databases → scales **writes** and **data size**.
- The **shard key** is the critical choice: high-cardinality, evenly distributed.
- Sharding kills cross-shard **joins and transactions**. Optimize → cache → replicate → scale up → *then* shard.
