# Database Internals: B-Trees, LSM & the WAL

You've used a database for the whole roadmap. Now let's open it up. Understanding *how* it stores bytes explains almost every piece of advice you've been given — why indexes work, why writes are slower than reads, and how a crash doesn't lose your data.

## The fundamental problem: disks hate random access

- **Sequential** write to SSD: ~1 GB/s
- **Random** write to SSD: dramatically slower (and on a spinning disk, catastrophically so — a 10ms seek)

A storage engine's entire design is a strategy for **turning random access into sequential access**. Every design below is an answer to that one question.

---

## Part 1: B-Trees (how Postgres/MySQL store data)

A **B-tree** is a balanced tree kept on disk, where each node is one **page** (typically 4–8 KB) and holds many keys.

```
                    [ 30 | 70 ]                    ← root (1 page)
                   ╱     │     ╲
          [10|20]    [40|50|60]   [80|90]          ← internal nodes
          ╱  │  ╲     ╱  │  │ ╲    ╱  │  ╲
        ... leaves: the actual rows / row pointers ...
```

**Why so wide?** Each node holds hundreds of keys, so the tree is extremely **shallow**. With a fan-out of ~500, three levels index **125 million** rows.

That depth *is* the cost of a lookup: **~3–4 disk page reads to find any row among hundreds of millions.** And the top levels are always cached in RAM, so it's often just one real disk read.

> This is *exactly why* an index turns a 142ms Seq Scan into a 0.06ms Index Scan. You now know the mechanism.

**Reads:** ✅ Excellent — O(log n), predictable, and great for **range scans** (leaves are linked in sorted order, so `WHERE age BETWEEN 20 AND 30` walks sideways).

**Writes:** ⚠️ Here's the cost. To update a row you must find its page and **modify it in place** — a **random write**. Worse, if the page is full it **splits** into two, which may cascade splits up the tree.

> **This is why every index slows down writes.** Now you know exactly why: each index is another B-tree that must be located and modified, in place, on every insert.

---

## Part 2: LSM-Trees (how Cassandra/RocksDB/LevelDB store data)

LSM-trees ask: *what if we simply **never** do random writes?*

```
1. WRITE  →  MemTable (an in-memory sorted map)   ⚡ RAM. Instant.
                  │
                  │ when it's full…
                  ▼
2. FLUSH  →  SSTable  (Sorted String Table on disk)
             ✅ written ONCE, SEQUENTIALLY, and then IMMUTABLE

3. Over time: SSTable, SSTable, SSTable, SSTable…
                  │
                  ▼
4. COMPACTION → merge them in the background into fewer, bigger SSTables
                (dropping deleted/overwritten keys along the way)
```

**Writes:** ✅✅ Blazing. A write touches only memory (plus a sequential log append). No seeking, no in-place updates, no page splits.

**Reads:** ⚠️ Harder. A key could be in the MemTable, or in *any* of the SSTables. You may check several files — that's **read amplification**.

**The fixes** (and note how they tie together everything you've learned):
- A **Bloom filter** per SSTable: *"is this key definitely NOT here?"* → skip the file entirely without touching disk. (See the next lesson — this is its killer application.)
- **Compaction** keeps the number of files small.
- Sparse in-memory indexes point to byte offsets within each SSTable.

**Deletes** are strange: you can't modify an immutable file, so you write a **tombstone** — a marker meaning "this key is deleted." The data is genuinely removed later, during compaction. (Same lazy-delete idea as the news feed.)

---

## B-Tree vs LSM — the real trade-off

| | **B-Tree** | **LSM-Tree** |
|---|---|---|
| Writes | Slower (random, in-place, splits) | ✅ **Very fast** (sequential appends) |
| Reads | ✅ Fast, predictable | Slower (check several SSTables) |
| Range scans | ✅ Excellent | Good |
| Space | Fragmentation from splits | ✅ Better (compaction + compression) |
| Write amplification | Moderate | Higher (compaction rewrites data) |
| Latency | ✅ Predictable | Spiky (compaction pauses) |
| Used by | **Postgres, MySQL, SQLite** | **Cassandra, RocksDB, LevelDB, ScyllaDB** |

> **Choose by workload:** write-heavy ingest (metrics, logs, events, time-series) → **LSM**. Read-heavy transactional apps with complex queries → **B-tree**. This is why Postgres is your default *and* why Cassandra wins for firehose-style writes.

---

## Part 3: The WAL — how durability actually works

Here's a question that should bother you: if a write only touches an **in-memory** page (both engines buffer in RAM for speed), what happens when the server loses power **one millisecond after `COMMIT` returned `OK`**?

Naively: the data is gone. But you promised the user it was saved. That would violate the **D in ACID**.

### The answer: write it to a log first

The **Write-Ahead Log** rule:

> **Before applying any change, append a record describing it to a sequential log on disk — and `fsync` it.**

```
COMMIT
  │
  ├─ 1. Append "changed row 42: balance 100 → 50" to the WAL
  ├─ 2. fsync()  ← force it to physical disk. THIS is the durability moment.
  ├─ 3. ✅ Report success to the user
  │
  └─ 4. Update the actual data pages in memory… flush them to disk lazily, later
```

**Why this is fast *and* safe:** the WAL is an **append-only sequential write** (~1 GB/s), whereas updating the real data pages would be scattered **random writes**. You get durability at sequential speed, and the expensive random page updates are deferred and batched.

### Crash recovery

The machine dies. On restart, the database:
1. Reads the WAL from the last **checkpoint**.
2. **Replays** every logged change (redo) — reconstructing the in-memory state that was lost.
3. **Rolls back** any transaction that never committed (undo).

**Committed data is never lost, because it was in the log before you were told "OK."** That's the whole trick, and it's the entire basis of the D in ACID.

### The WAL is secretly everywhere

Once you see it, you see it everywhere:
- **Replication** — replicas simply **replay the primary's WAL**. That's literally what streaming replication is.
- **Point-in-time recovery** — restore a backup, then replay the WAL up to 14:32:07, just before someone ran `DELETE` without a `WHERE`.
- **Change Data Capture (CDC)** — tools like Debezium **tail the WAL** to emit an event stream of every row change. This is the cleanest solution to the dual-write problem from the event-driven lesson.
- **LSM-trees** use one too (the "commit log") to protect the in-memory MemTable.

> ⚠️ **`fsync` is the durability boundary.** Some databases (and misconfigured setups) acknowledge writes *before* fsync for speed. That's fast until the power cuts — then "committed" data is simply gone. Know where your system sits on this.

---

## Bonus: MVCC — how readers never block writers

You may have wondered how Postgres lets a long analytics query run while writes continue, without either one blocking the other.

**MVCC (Multi-Version Concurrency Control):** an `UPDATE` doesn't overwrite the row — it writes a **new version** of it. Each version is tagged with the transaction that created it.

Each transaction sees a consistent **snapshot** of the versions that were committed when it began.

- ✅ **Readers never block writers. Writers never block readers.** Huge for concurrency.
- ❌ Old versions accumulate as dead rows → Postgres needs **`VACUUM`** to reclaim them. A neglected `VACUUM` causes **table bloat** and mysterious slowdowns — a genuinely common production issue.

---

## Key takeaways

- Storage engines exist to **turn random I/O into sequential I/O** — that single goal explains every design here.
- **B-trees**: shallow, wide, in-place updates. ~3–4 page reads to find any row → **fast reads**, **costly writes** (this is *why* each extra index slows writes).
- **LSM-trees**: buffer in memory, flush **immutable sorted files** sequentially, **compact** in the background → **fast writes**, slower reads (rescued by **Bloom filters**). Deletes are **tombstones**.
- The **WAL** delivers durability: **append + fsync the log *before* acknowledging a commit**, then update data pages lazily. Crash → replay the log.
- The WAL also powers **replication, point-in-time recovery, and CDC**.
- **MVCC** keeps readers and writers from blocking each other — at the cost of dead rows, which is why **`VACUUM`** matters.
