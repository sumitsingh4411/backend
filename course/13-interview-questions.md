<div align="center">

<sub>[← BackendPath](../README.md)</sub>

# ❓ 130 system design interview questions

**The full bank: Design-X prompts, deep dives, concepts, estimation, trade-offs.**

<sub>`14 min read`</sub>

</div>

---

### In this part

- [A · The 35 classic "Design X" prompts](#a--the-35-classic-design-x-prompts)
- [B · The 30 follow-up deep dives (where you're actually judged)](#b--the-30-follow-up-deep-dives-where-youre-actually-judged)
- [C · The 40 concept & terminology questions](#c--the-40-concept--terminology-questions)
- [D · The 12 estimation questions](#d--the-12-estimation-questions)
- [E · The 13 trade-off questions ("it depends" — but say *why*)](#e--the-13-trade-off-questions-it-depends--but-say-why)
- [📺 Where to practise these](#-where-to-practise-these)

---

Grouped the way interviews actually go. **The "really testing" column is the point** — the question is never the question.

## A · The 35 classic "Design X" prompts

| # | Design… | The crux they want you to find | Learn |
|:--|---|---|---|
| 1 | **URL shortener** (TinyURL) | Base62-encode a unique id → collisions become *impossible*. 302 not 301, or you lose analytics. | [§10 method](10-system-design.md) · [Primer](https://github.com/donnemartin/system-design-primer#design-pastebincom-or-bitlycom) |
| 2 | **Twitter / news feed** | Fan-out on write **+ the celebrity exception**. Hybrid, merged at read. | [§10.3](10-system-design.md#103-design-news-feed-the-celebrity-problem) |
| 3 | **Instagram** | Feed + object storage for media + CDN. Never store images in the DB. | [Primer](https://github.com/donnemartin/system-design-primer) |
| 4 | **WhatsApp / chat** | WebSockets make servers **stateful** → you need a pub/sub backbone + presence registry. | [§10 · chat](10-system-design.md) |
| 5 | **Rate limiter** | Token bucket in Redis with an **atomic Lua script**. Fail open or closed? Say which. | [§10.4](10-system-design.md#104-design-rate-limiter) |
| 6 | **Web crawler** | Politeness (robots.txt, per-domain rate limit), URL dedupe (**Bloom filter**), a frontier queue. | [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter) |
| 7 | **Search autocomplete / typeahead** | A **trie**, precomputed top-K per prefix, cached hard. Latency budget is ~50ms. | [Trie](https://en.wikipedia.org/wiki/Trie) |
| 8 | **YouTube / Netflix** | Upload → transcode **async** into many resolutions → CDN. The DB stores metadata only. | [Primer](https://github.com/donnemartin/system-design-primer) |
| 9 | **Dropbox / Google Drive** | Chunk files, hash chunks, dedupe, sync deltas — don't re-upload a 2GB file for a one-line change. | [Primer](https://github.com/donnemartin/system-design-primer) |
| 10 | **Google Docs** (collab editing) | **CRDT or OT.** Last-write-wins destroys people's work. | [CRDT](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type) |
| 11 | **Uber / Lyft** | Geospatial index (**geohash/quadtree**) + real-time driver location + matching. | [Geohash](https://en.wikipedia.org/wiki/Geohash) |
| 12 | **Yelp / proximity service** | Same geospatial core; reads dominate → cache aggressively. | [Quadtree](https://en.wikipedia.org/wiki/Quadtree) |
| 13 | **Ticketmaster / seat booking** | **The whole problem is the double-booking race.** Pessimistic lock or atomic conditional update + reservation TTL. | [§4.5](04-databases.md#45--the-lost-update--a-race-condition-you-will-write) |
| 14 | **Payment system** | Idempotency keys, ledger (double-entry), the outbox, and **never** trusting the client's amount. | [§3.3](03-apis.md#33--idempotency-keys--how-you-stop-double-charges) |
| 15 | **Notification system** | Fan-out + per-channel providers + retries + dedupe + user preferences + **DLQ**. | [§6.4](06-caching-and-queues.md#64-queues--respond-now-work-later) |
| 16 | **Distributed unique ID generator** | **Snowflake**: timestamp + machine id + counter. Time-sortable, no coordination. | [Snowflake ID](https://en.wikipedia.org/wiki/Snowflake_ID) |
| 17 | **Distributed cache** (Redis-like) | Consistent hashing + replication + eviction policy. | [§10.5](10-system-design.md#105--hashkey--n-is-a-trap) |
| 18 | **Key-value store** (Dynamo-like) | Consistent hashing, **quorums (W+R>N)**, vector clocks, hinted handoff, read repair. | [Dynamo paper](https://www.allthingsdistributed.com/2007/10/amazons_dynamo.html) |
| 19 | **Object store** (S3-like) | Immutable blobs, metadata DB, erasure coding, multipart upload. | [Primer](https://github.com/donnemartin/system-design-primer) |
| 20 | **Distributed job scheduler** | Leader election, at-least-once execution, **idempotent jobs**, the multi-instance cron trap. | [§6.5](06-caching-and-queues.md#65--the-cron-trap-that-emails-your-customers-20-times) |
| 21 | **Log aggregation** (ELK-like) | High write volume → append-only, batch, partition by time, LSM-backed. | [The Log](https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying) |
| 22 | **Metrics / monitoring system** | Time-series DB, downsampling/rollups, cardinality explosion is the trap. | [Google SRE](https://sre.google/sre-book/monitoring-distributed-systems/) |
| 23 | **Ad click aggregator** | Massive write volume + **approximate** counts are fine → stream processing, count-min sketch. | [Count-min sketch](https://en.wikipedia.org/wiki/Count%E2%80%93min_sketch) |
| 24 | **Leaderboard** | Redis **sorted set**. O(log n) rank, trivially. Don't `ORDER BY score` a 10M-row table per request. | [Redis types](https://redis.io/docs/latest/develop/data-types/) |
| 25 | **Pastebin** | Like the shortener, plus TTL/expiry and object storage for big pastes. | [Primer](https://github.com/donnemartin/system-design-primer#design-pastebincom-or-bitlycom) |
| 26 | **Stock exchange / order matching** | A single-threaded matching engine per symbol (ordering is everything), event-sourced for audit. | [Event sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) |
| 27 | **Food delivery / DoorDash** | Geospatial + real-time state machine per order + eventual consistency on ETAs. | [Geohash](https://en.wikipedia.org/wiki/Geohash) |
| 28 | **Hotel / airline booking** | Inventory reservation with TTL, **saga** across payment + inventory. | [Saga](https://microservices.io/patterns/data/saga.html) |
| 29 | **Slack / Discord** | Chat + channels + fan-out + presence + read receipts (per-user cursors). | [§10 · chat](10-system-design.md) |
| 30 | **Email service** (SES-like) | Queue + rate limits per domain + bounce/complaint handling + retries with backoff. | [§8.2](08-reliability.md#82-retries--necessary-and-dangerous) |
| 31 | **CDN** | Edge caching, cache keys, purge/invalidation, origin shielding. | [CDN](https://en.wikipedia.org/wiki/Content_delivery_network) |
| 32 | **Google Maps / routing** | Graph partitioning + precomputed shortcuts; you cannot Dijkstra the planet per request. | [Primer](https://github.com/donnemartin/system-design-primer) |
| 33 | **Online judge / code runner** | Untrusted code → **sandboxing** (containers, seccomp), resource limits, queue-based execution. | [12factor](https://12factor.net/) |
| 34 | **Recommendation system** | Offline batch compute → serve from a precomputed store. **Never** compute ML per request. | [High Scalability](http://highscalability.com/) |
| 35 | **API rate-limited public API** (Stripe-like) | Idempotency, versioning, pagination, webhooks, keys per customer. | [§3](03-apis.md) |

## B · The 30 follow-up deep dives (where you're actually judged)

These are the "okay, now what if…" questions. **This is the real interview.**

| # | Question | What they're really testing | Learn |
|:--|---|---|---|
| 36 | How do you generate unique IDs across many servers? | Do you say Snowflake/ULID, or do you say "auto-increment" and not notice it doesn't work? | [Snowflake ID](https://en.wikipedia.org/wiki/Snowflake_ID) |
| 37 | What happens when a celebrity with 50M followers posts? | Write amplification. The hybrid fan-out. | [§10.3](10-system-design.md#103-design-news-feed-the-celebrity-problem) |
| 38 | Your cache goes down. What happens? | Do you thundering-herd the DB to death? Do you fail open or closed? | [§6.3](06-caching-and-queues.md#63--the-three-ways-a-cache-takes-down-your-database) |
| 39 | How do you avoid double-charging a customer? | **Idempotency keys.** If you say "retries", you failed. | [§3.3](03-apis.md#33--idempotency-keys--how-you-stop-double-charges) |
| 40 | Two users book the last seat at the same time. | The lost-update race. Atomic conditional update or `FOR UPDATE`. | [§4.5](04-databases.md#45--the-lost-update--a-race-condition-you-will-write) |
| 41 | How do you shard this? What's the shard key? | Do you pick by **access pattern**, or by whatever's unique? | [§4.8](04-databases.md#48-scaling--in-this-exact-order) |
| 42 | A shard gets hot. Now what? | Hot partition. Split it, salt the key, or cache in front. | [§10.3](10-system-design.md#103-design-news-feed-the-celebrity-problem) |
| 43 | How do you add a cache server without a DB meltdown? | **Consistent hashing.** `% N` remaps 80% of keys. | [§10.5](10-system-design.md#105--hashkey--n-is-a-trap) |
| 44 | How do you guarantee message ordering? | Order is **per-partition**. Same key → same partition. Global ordering costs you throughput. | [Kafka](https://kafka.apache.org/documentation/#introduction) |
| 45 | Your queue delivers a message twice. | At-least-once is the default. **Make the consumer idempotent.** | [§6.4](06-caching-and-queues.md#64-queues--respond-now-work-later) |
| 46 | How do you write to the DB *and* publish an event atomically? | The **dual-write problem** → transactional outbox. | [§8.6](08-reliability.md#86--the-dual-write-problem) |
| 47 | The user updates their profile and it "doesn't save". | **Replica lag.** Route their reads to the primary briefly. | [§4.8](04-databases.md#48-scaling--in-this-exact-order) |
| 48 | How do you paginate a feed that's constantly changing? | **Cursor**, not offset — or users see duplicates and gaps. | [§3.2](03-apis.md#32--never-return-an-unbounded-list) |
| 49 | A downstream service becomes slow (not down). | The killer. Timeouts + circuit breaker, or your pool exhausts and you go down with it. | [§8.1](08-reliability.md#81-timeouts--the-default-is-wait-forever) |
| 50 | 10,000 clients all retry at once. | Thundering herd → **jitter**. | [AWS](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) |
| 51 | How do you run a nightly job on 20 instances? | The cron trap → distributed lock or a real scheduler. | [§6.5](06-caching-and-queues.md#65--the-cron-trap-that-emails-your-customers-20-times) |
| 52 | How do you rename a column with zero downtime? | Expand/contract — **six steps**. Old and new code run simultaneously. | [§9.3](09-devops.md#93--zero-downtime-migrations-old-and-new-code-run-at-the-same-time) |
| 53 | How do you deploy without dropping requests? | Rolling/canary + **readiness probes** + graceful shutdown on SIGTERM. | [§9.2](09-devops.md#92-deployment-strategies) |
| 54 | Your DB hits its connection limit. | `pool × instances`. PgBouncer. | [§4.7](04-databases.md#47--connection-pooling--the-one-that-takes-down-production) |
| 55 | How do you find *which* query is slow? | `pg_stat_statements` ordered by **total** time, then `EXPLAIN ANALYZE`. | [§4.2](04-databases.md#42-reading-an-explain-plan) |
| 56 | p99 is 4s but p50 is 50ms. Why? | Tail causes differ from median causes: GC, cold cache, locks, retries, a slow replica. | [§7.2](07-performance.md#72-p95p99--the-average-is-a-liar) |
| 57 | How do you handle a 10× traffic spike? | Queue to absorb, autoscale, **load shed**, degrade non-critical features. | [§8.4](08-reliability.md#84-graceful-degradation) |
| 58 | How do you prevent one customer from starving the rest? | Per-tenant rate limits + bulkheads (separate pools). | [Bulkhead](https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead) |
| 59 | How do you store 100M images? | Object storage + CDN. **Not** the DB, **not** the local disk. | [§2.4](02-servers-and-concurrency.md#24-stateless-servers--the-thing-that-lets-you-scale) |
| 60 | How do you do full-text search? | Inverted index (Elasticsearch) **beside** the source of truth — never *as* it. | [Inverted index](https://en.wikipedia.org/wiki/Inverted_index) |
| 61 | How do you find "restaurants near me"? | Geohash / quadtree — you cannot scan every row and compute distance. | [Geohash](https://en.wikipedia.org/wiki/Geohash) |
| 62 | How do you count unique visitors cheaply? | **HyperLogLog** — ~12KB for millions, approximate. | [HyperLogLog](https://en.wikipedia.org/wiki/HyperLogLog) |
| 63 | How do you avoid pointless disk reads for missing keys? | **Bloom filter** in front. No false negatives. | [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter) |
| 64 | What if the leader node dies? | Election via consensus (Raft), **majority quorum**, fencing tokens to stop the old leader. | [Raft](https://raft.github.io/) |
| 65 | How would you migrate this to a new database with no downtime? | Dual-write + backfill + shadow reads + cutover + rollback plan. | [PlanetScale](https://planetscale.com/blog/backwards-compatible-databases-changes) |

## C · The 40 concept & terminology questions

Rapid-fire. If you can't answer in **two sentences**, you don't know it yet.

| # | Question | Learn |
|:--|---|---|
| 66 | What is the CAP theorem — and why is "pick two" misleading? | [§8.5](08-reliability.md#85-cap--you-dont-get-to-keep-all-three) |
| 67 | What is PACELC and why is it more honest than CAP? | [PACELC](https://en.wikipedia.org/wiki/PACELC_theorem) |
| 68 | Strong vs eventual consistency — give a real example of each. | [Jepsen](https://jepsen.io/consistency) |
| 69 | What is read-your-writes consistency, and why do users notice when you don't have it? | [§4.8](04-databases.md#48-scaling--in-this-exact-order) |
| 70 | What is linearizability? How is it different from serializability? | [Jepsen](https://jepsen.io/consistency) |
| 71 | Explain ACID. Which letter do NoSQL stores usually trade away? | [§4.4](04-databases.md#44-transactions-and-acid) |
| 72 | What are the isolation levels, and what anomaly does each still allow? | [§4.6](04-databases.md#46-isolation-levels) |
| 73 | What is a dirty read / non-repeatable read / phantom / write skew? | [§4.6](04-databases.md#46-isolation-levels) |
| 74 | Optimistic vs pessimistic locking — when would you use each? | [§4.5](04-databases.md#45--the-lost-update--a-race-condition-you-will-write) |
| 75 | What is MVCC and why does it mean readers don't block writers? | [MVCC](https://en.wikipedia.org/wiki/Multiversion_concurrency_control) |
| 76 | What is a write-ahead log, and what three jobs does it do? | [WAL](https://en.wikipedia.org/wiki/Write-ahead_logging) |
| 77 | B-tree vs LSM tree — which for a write-heavy workload, and why? | [LSM](https://en.wikipedia.org/wiki/Log-structured_merge-tree) |
| 78 | How does an index actually make a lookup fast? | [§4.1](04-databases.md#41-indexes--the-single-biggest-win) |
| 79 | Why can a composite index on `(a, b)` not serve `WHERE b = ?`? | [§4.1](04-databases.md#41-indexes--the-single-biggest-win) |
| 80 | Why is an index on a boolean column usually useless? | [§4.1](04-databases.md#41-indexes--the-single-biggest-win) |
| 81 | What's an N+1 query, and how does an ORM cause it silently? | [§4.3](04-databases.md#43-the-n1-query--the-most-common-bug-in-backend-code) |
| 82 | Why is `OFFSET 100000` slow — and what's the correctness bug? | [§3.2](03-apis.md#32--never-return-an-unbounded-list) |
| 83 | Partitioning vs sharding — what's the actual difference? | [§4.8](04-databases.md#48-scaling--in-this-exact-order) |
| 84 | What is consistent hashing, and what breaks with `hash % N`? | [§10.5](10-system-design.md#105--hashkey--n-is-a-trap) |
| 85 | What are virtual nodes and why do you need them? | [§10.5](10-system-design.md#105--hashkey--n-is-a-trap) |
| 86 | What is a quorum? Why `W + R > N`? Why an **odd** number of nodes? | [Quorum](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) |
| 87 | What is split-brain, and what prevents it? | [Split-brain](https://en.wikipedia.org/wiki/Split-brain_(computing)) |
| 88 | Explain Raft in 60 seconds. | [Raft](https://raft.github.io/) |
| 89 | Why should you never order distributed events by wall-clock time? | [Clock skew](https://en.wikipedia.org/wiki/Clock_skew) |
| 90 | What is idempotency, and which HTTP methods are idempotent? | [§1.2](01-http.md#12-the-methods-and-the-property-that-matters) |
| 91 | Why is "exactly-once delivery" a myth — and what do you do instead? | [§6.4](06-caching-and-queues.md#64-queues--respond-now-work-later) |
| 92 | Queue vs stream (Kafka) — when do you need replay? | [§6.4](06-caching-and-queues.md#64-queues--respond-now-work-later) |
| 93 | What is a dead-letter queue and what problem does it solve? | [DLQ](https://en.wikipedia.org/wiki/Dead_letter_queue) |
| 94 | What is the dual-write problem? What's the outbox pattern? | [§8.6](08-reliability.md#86--the-dual-write-problem) |
| 95 | What is a saga, and what is a compensating transaction? | [Saga](https://microservices.io/patterns/data/saga.html) |
| 96 | Why avoid two-phase commit? | [2PC](https://en.wikipedia.org/wiki/Two-phase_commit_protocol) |
| 97 | Cache-aside vs write-through vs write-back — trade-offs? | [§6.2](06-caching-and-queues.md#62-cache-aside--the-pattern-youll-use-90-of-the-time) |
| 98 | Why delete the cache key on write instead of updating it? | [§6.2](06-caching-and-queues.md#62-cache-aside--the-pattern-youll-use-90-of-the-time) |
| 99 | What are cache stampede, penetration, and avalanche? | [§6.3](06-caching-and-queues.md#63--the-three-ways-a-cache-takes-down-your-database) |
| 100 | What is a circuit breaker? What are its three states? | [Fowler](https://martinfowler.com/bliki/CircuitBreaker.html) |
| 101 | Why must retries have jitter? | [AWS](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) |
| 102 | Liveness vs readiness probe — what breaks if you confuse them? | [§9.5](09-devops.md#95-observability) |
| 103 | SLA vs SLO vs SLI. What's an error budget *for*? | [Google SRE](https://sre.google/sre-book/service-level-objectives/) |
| 104 | What is a Bloom filter? Can it produce a false negative? | [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter) |
| 105 | Why is CORS not a security feature of your API? | [§3.6](03-apis.md#36-cors--what-it-actually-is) |

## D · The 12 estimation questions

They want **orders of magnitude**, not decimals. Round `86,400` to `~100k` and move on.

| # | Question | Method |
|:--|---|---|
| 106 | How many requests per second is 1M requests/day? | `1M / 86,400 ≈ 12/s`. Peak ≈ 2–10×. |
| 107 | Estimate QPS for a service with 100M DAU doing 10 actions/day. | `1B / 86,400 ≈ 11.5k/s`; peak ~50–100k/s. |
| 108 | How much storage for 500M tweets/day at 300 bytes, kept 5 years? | `500M × 300B × 365 × 5 ≈ 270 TB`. |
| 109 | How many servers do you need for 100k QPS? | Per-server QPS (say 1–5k) → 20–100 boxes + headroom. **State your assumption.** |
| 110 | How much memory to cache the hot 20% of 100M users? | `20M × ~1KB ≈ 20 GB` → a few Redis nodes. |
| 111 | How much bandwidth to stream video to 1M concurrent users at 5 Mbps? | `5 Tbps` → **this is why CDNs exist.** |
| 112 | Can this fit on one machine? | Almost always yes for < ~1TB and < ~10k QPS. **Say so** — it's the senior answer. |
| 113 | What's the latency budget for a page making 20 backend calls? | If the page must be < 1s, each call gets ~50ms **or must run in parallel.** |
| 114 | How many DB connections should the pool have? | `≈ 2 × cores` — 10–30, not 300. Then × instances. | 
| 115 | How long to backfill 500M rows? | Batches of ~10k, rate-limited to protect prod. Compute the hours. **Never one UPDATE.** |
| 116 | How big is the index on a 100M-row table? | Roughly `rows × key size × ~1.5`. It must fit in RAM to be fast. |
| 117 | What read:write ratio makes caching worth it? | Anything read-heavy. At 100:1, caching is the *entire* design. |

## E · The 13 trade-off questions ("it depends" — but say *why*)

| # | Question | The answer that scores |
|:--|---|---|
| 118 | SQL or NoSQL for this? | **"What's the access pattern?"** Start Postgres; justify leaving it. | 
| 119 | Monolith or microservices? | **Start monolith.** Microservices buy independent deploys, cost you distributed transactions. | 
| 120 | Strong or eventual consistency? | **Per field.** Balance = strong. Like-count = eventual. |
| 121 | Fan-out on write or on read? | **Hybrid.** Write for normal users, read for celebrities. |
| 122 | Sync or async? | If the user doesn't need the result to continue → **async**. |
| 123 | REST or gRPC? | Public/browser → REST. Internal, high-volume, typed → gRPC. |
| 124 | REST or GraphQL? | GraphQL for many clients with varied shapes — **but you own N+1 and caching.** |
| 125 | Cache TTL or explicit invalidation? | **Both.** Invalidate on write, and keep a TTL as the backstop for the bug you didn't foresee. |
| 126 | Fail open or fail closed when Redis dies? | **Open** for a normal API. **Closed** for login and payments. Saying which *is* the answer. |
| 127 | Read replica or cache? | Cache for hot repeated reads. Replica for broad read scaling. Both cost you staleness. |
| 128 | Polling, SSE, or WebSockets? | Poll if seconds are fine. **SSE** for one-way push. WebSockets only if you truly need bidirectional. |
| 129 | Shard now or later? | **Later.** Index, fix N+1s, cache, replicate, partition — *then* shard. |
| 130 | Build or buy? | Buy, until the thing you'd buy becomes your core differentiator. |

## 📺 Where to practise these

| Resource | Why |
|---|---|
| [System Design Primer](https://github.com/donnemartin/system-design-primer) | The most complete free resource. **Start here.** Has worked solutions with diagrams. |
| [ByteByteGo YouTube](https://www.youtube.com/@ByteByteGo) | Short, sharp walkthroughs of exactly these prompts. Free. |
| [High Scalability](http://highscalability.com/) | How real companies actually built it — the best sanity check on your instincts. |
| [Designing Data-Intensive Applications](https://dataintensive.net/) | The theory under every answer above. Read it twice. |
| [AWS Builders' Library](https://aws.amazon.com/builders-library/) | How a hyperscaler really handles timeouts, retries, load shedding. Free. |
| [Jepsen analyses](https://jepsen.io/analyses) | What databases *actually* guarantee, tested to destruction. |
| [Raft visualisation](https://raft.github.io/) | Watch consensus happen. It stops being magic in 5 minutes. |

---

---

<div align="center">

[← 📖 📖 Backend glossary — the terms they'll drop on you](12-glossary.md) · [**Contents**](../README.md#contents) · [📋 📋 Cheat sheets →](14-cheat-sheets.md)

<sub><a href="#top">↑ back to top</a></sub>

</div>
