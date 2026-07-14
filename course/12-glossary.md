<div align="center">

<sub>[← BackendPath](../README.md)</sub>

# 📖 Backend glossary — the terms they'll drop on you

**120+ terms, each defined in one sentence and linked.**

<sub>`12 min read`</sub>

</div>

---

### In this part

- [Scale & traffic](#scale--traffic)
- [Data & storage](#data--storage)
- [Consistency & distributed systems](#consistency--distributed-systems)
- [Messaging](#messaging)
- [Caching](#caching)
- [Reliability & operations](#reliability--operations)
- [Probabilistic & specialised structures](#probabilistic--specialised-structures)
- [Architecture](#architecture)

---

Every one of these has come up in a real backend interview. If you can't define it in one sentence, click the link.

## Scale & traffic

| Term | In one sentence | Learn |
|---|---|---|
| **QPS / RPS** | Queries (requests) per second — the unit of all capacity maths. | [§10.2](10-system-design.md#102-back-of-envelope-fast) |
| **Throughput vs latency** | Throughput = how many per second. Latency = how long **one** takes. You can have great throughput and terrible latency. | [§7.2](07-performance.md#72-p95p99--the-average-is-a-liar) |
| **p50 / p95 / p99** | Percentiles. p99 = the slowest 1%. **Nobody experiences the average.** | [§7.2](07-performance.md#72-p95p99--the-average-is-a-liar) |
| **Tail latency** | Your slow requests. A page making 20 calls hits p99 on *almost every load*. | [Latency numbers](https://gist.github.com/jboner/2841832) |
| **Horizontal vs vertical scaling** | Add **more** machines vs a **bigger** machine. Vertical hits a ceiling and a price cliff. | [Primer](https://github.com/donnemartin/system-design-primer#index-of-system-design-topics) |
| **Stateless** | The server keeps nothing between requests → you can kill any box and lose nothing → you can scale out. | [§2.4](02-servers-and-concurrency.md#24-stateless-servers--the-thing-that-lets-you-scale) |
| **Load balancer (L4 vs L7)** | L4 routes by IP/port (fast, dumb). L7 reads the HTTP request (slower, can route by path/header). | [Load balancing](https://en.wikipedia.org/wiki/Load_balancing_(computing)) |
| **Sticky session** | Pinning a user to one server. A **smell** — it means you're not stateless. | [§2.4](02-servers-and-concurrency.md#24-stateless-servers--the-thing-that-lets-you-scale) |
| **Little's Law** | `L = λW` — concurrency = arrival rate × time in system. Tells you how many in-flight requests you must hold. | [Little's law](https://en.wikipedia.org/wiki/Little%27s_law) |
| **Amdahl's Law** | The serial part of your work caps your speedup. 90% of time in one query → optimise **that**. | [Amdahl's law](https://en.wikipedia.org/wiki/Amdahl%27s_law) |
| **Hot key / hot partition** | One key or shard takes disproportionate traffic (a celebrity, a viral post) and melts one node. | [§10.3](10-system-design.md#103-design-news-feed-the-celebrity-problem) |
| **Thundering herd** | Everyone retries or misses the cache *at the same instant* and stampedes the backend. | [Thundering herd](https://en.wikipedia.org/wiki/Thundering_herd_problem) |
| **Back-pressure** | When you can't keep up, **push back** (reject fast, slow the producer) instead of buffering to death. | [§8.1](08-reliability.md#81-timeouts--the-default-is-wait-forever) |
| **Load shedding** | Deliberately dropping a fraction of traffic (503) so the rest still gets served. **Half up beats all down.** | [Builders' Library](https://aws.amazon.com/builders-library/) |
| **Token bucket / leaky bucket** | Rate-limit algorithms. Token bucket **allows natural bursts**; leaky bucket smooths to a constant rate. | [Token bucket](https://en.wikipedia.org/wiki/Token_bucket) |
| **Fan-out** | One event → many writes/reads. Fan-out **on write** = precompute. Fan-out **on read** = compute at query time. | [§10.3](10-system-design.md#103-design-news-feed-the-celebrity-problem) |
| **Write amplification** | One logical write causes many physical writes (50M followers → 50M feed inserts). | [§10.3](10-system-design.md#103-design-news-feed-the-celebrity-problem) |
| **Blast radius** | How much breaks when *this* breaks. Canary deploys shrink it to 5%. | [§9.2](09-devops.md#92-deployment-strategies) |

## Data & storage

| Term | In one sentence | Learn |
|---|---|---|
| **OLTP vs OLAP** | Transactions (many small reads/writes: Postgres) vs analytics (huge scans: ClickHouse). Don't run OLAP on your OLTP box. | [OLTP](https://en.wikipedia.org/wiki/Online_transaction_processing) |
| **Normalization** | One fact, one place. Denormalise **on purpose**, never by accident. | [Normalization](https://en.wikipedia.org/wiki/Database_normalization) |
| **Index** | A sorted lookup structure. 10M rows → **3–4 hops** instead of a full scan. | [§4.1](04-databases.md#41-indexes--the-single-biggest-win) |
| **Composite index / leftmost prefix** | `(a, b)` serves `WHERE a` and `WHERE a AND b`, but **not `WHERE b` alone**. | [§4.1](04-databases.md#41-indexes--the-single-biggest-win) |
| **Covering index** | The index has every column the query needs → *Index Only Scan* → never touches the table. | [Use The Index, Luke](https://use-the-index-luke.com/) |
| **B-tree** | Balanced tree, updates **in place**. Fast reads. Powers Postgres/MySQL. | [B-tree](https://en.wikipedia.org/wiki/B-tree) |
| **LSM tree** | Append to memory, flush sorted files, compact later. **Very fast writes.** Powers Cassandra, RocksDB. | [LSM tree](https://en.wikipedia.org/wiki/Log-structured_merge-tree) |
| **WAL (write-ahead log)** | Append the change to a log and `fsync` **before** touching data files. This is what makes "committed" survive a crash — and what replication and PITR are built on. | [WAL](https://en.wikipedia.org/wiki/Write-ahead_logging) |
| **MVCC** | Don't overwrite a row — write a **new version**. That's why readers never block writers. Cost: `VACUUM`. | [MVCC](https://en.wikipedia.org/wiki/Multiversion_concurrency_control) |
| **ACID** | Atomic, Consistent, Isolated, Durable. | [§4.4](04-databases.md#44-transactions-and-acid) |
| **Isolation levels** | Read committed → repeatable read → serializable. Each blocks more anomalies and costs more. | [§4.6](04-databases.md#46-isolation-levels) |
| **Optimistic vs pessimistic locking** | Optimistic: check a `version` on write, retry on clash. Pessimistic: `SELECT … FOR UPDATE`, others wait. | [§4.5](04-databases.md#45--the-lost-update--a-race-condition-you-will-write) |
| **Partitioning** | Split a big table **within one database** (usually by time). Drop last year = `DROP TABLE`, instantly. | [Postgres docs](https://www.postgresql.org/docs/current/ddl-partitioning.html) |
| **Sharding** | Split rows across **machines** by a shard key. Scales writes; costs you cross-shard joins. | [Sharding](https://en.wikipedia.org/wiki/Shard_(database_architecture)) |
| **Shard key** | The column you split on. Pick it by **how you query**. Wrong key → every query fans out to every shard. | [§4.8](04-databases.md#48-scaling--in-this-exact-order) |
| **Replication lag** | The replica is behind the primary. Causes *"I saved it and it didn't save"*. | [§4.8](04-databases.md#48-scaling--in-this-exact-order) |
| **Quorum (W + R > N)** | Require a **majority** to confirm. A majority can't exist on both sides of a split → no split-brain. | [Quorum](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) |
| **Consistent hashing** | Keys and servers on a ring → adding a node moves **~1/N** of keys, not 80%. | [§10.5](10-system-design.md#105--hashkey--n-is-a-trap) |
| **Rendezvous hashing** | Simpler alternative to the ring: pick the server with the highest `hash(key, server)`. | [Rendezvous hashing](https://en.wikipedia.org/wiki/Rendezvous_hashing) |
| **Materialized view** | A precomputed query result, stored. Fast reads, refresh cost. | [Postgres docs](https://www.postgresql.org/docs/current/rules-materializedviews.html) |
| **Object storage (S3)** | Where files go. **Never** the local disk of an app server. | [§2.4](02-servers-and-concurrency.md#24-stateless-servers--the-thing-that-lets-you-scale) |
| **CDN** | Cached copies of content physically near the user. | [CDN](https://en.wikipedia.org/wiki/Content_delivery_network) |

## Consistency & distributed systems

| Term | In one sentence | Learn |
|---|---|---|
| **CAP theorem** | When the network partitions, choose **C**onsistency or **A**vailability. P isn't optional. | [§8.5](08-reliability.md#85-cap--you-dont-get-to-keep-all-three) |
| **PACELC** | The honest CAP: on Partition choose A or C; **Else** (normal operation) choose **L**atency or **C**onsistency. | [PACELC](https://en.wikipedia.org/wiki/PACELC_theorem) |
| **Linearizability** | Every read sees the latest write, as if there were one copy. The strongest, slowest guarantee. | [Jepsen](https://jepsen.io/consistency) |
| **Serializability** | Concurrent transactions behave as if run one after another. (Different axis from linearizability.) | [Jepsen](https://jepsen.io/consistency) |
| **Eventual consistency** | Replicas converge… eventually. Fine for likes; not for balances. | [Eventual consistency](https://en.wikipedia.org/wiki/Eventual_consistency) |
| **Read-your-writes** | *You* see *your own* changes immediately, even if others lag. **Usually the real requirement.** | [§4.8](04-databases.md#48-scaling--in-this-exact-order) |
| **Monotonic reads** | You never see time go backwards (read new, then old). | [Jepsen](https://jepsen.io/consistency) |
| **Consensus** | Getting N nodes to agree on one value despite failures. | [Consensus](https://en.wikipedia.org/wiki/Consensus_(computer_science)) |
| **Raft / Paxos** | The two consensus algorithms. Raft is the one you can actually explain. Elect a **leader**; the leader orders writes. | [Raft (visual)](https://raft.github.io/) |
| **Leader election** | Choosing the one node allowed to write. Needs a majority, or you get… | [Raft](https://raft.github.io/) |
| **Split-brain** | Two halves of a cluster both think they're the leader and diverge. Quorums prevent it. | [Split-brain](https://en.wikipedia.org/wiki/Split-brain_(computing)) |
| **Fencing token** | A monotonically increasing number attached to a lock, so a **stale** lock-holder's writes get rejected. | [DDIA](https://dataintensive.net/) |
| **Clock skew** | Server clocks drift. **Never order events by wall-clock time** — use a sequence or a Snowflake ID. | [Clock skew](https://en.wikipedia.org/wiki/Clock_skew) |
| **Snowflake ID** | A 64-bit, **time-sortable**, globally unique id generated without coordination (timestamp + machine + counter). | [Snowflake ID](https://en.wikipedia.org/wiki/Snowflake_ID) |
| **Vector clock** | Tracks causality across replicas so you can detect concurrent (conflicting) updates. | [Vector clock](https://en.wikipedia.org/wiki/Vector_clock) |
| **CRDT** | A data type that **merges automatically** without conflict. How collaborative editing and offline sync work. | [CRDT](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type) |
| **Operational Transform (OT)** | The *other* way to do collaborative editing (Google Docs). Transforms concurrent ops against each other. | [OT](https://en.wikipedia.org/wiki/Operational_transformation) |
| **Two-phase commit (2PC)** | Distributed transaction: prepare, then commit. **Blocks** if the coordinator dies. Avoid. | [2PC](https://en.wikipedia.org/wiki/Two-phase_commit_protocol) |
| **Saga** | Replace a distributed transaction with local transactions + **compensating actions** (undo). | [Saga](https://microservices.io/patterns/data/saga.html) |
| **Transactional outbox** | Write the row **and** the event in ONE DB transaction; a relay publishes it. Fixes the dual-write bug. | [§8.6](08-reliability.md#86--the-dual-write-problem) |
| **Idempotency** | Doing it twice = doing it once. The single most important word in distributed systems. | [§3.3](03-apis.md#33--idempotency-keys--how-you-stop-double-charges) |
| **At-least-once / at-most-once** | Queues redeliver (duplicates) or drop (loss). Pick your poison — usually at-least-once + idempotency. | [§6.4](06-caching-and-queues.md#64-queues--respond-now-work-later) |
| **"Exactly-once"** | **A myth**, at the delivery layer. You get at-least-once delivery + idempotent processing, and *call it* exactly-once. | [§6.4](06-caching-and-queues.md#64-queues--respond-now-work-later) |
| **Gossip protocol** | Nodes randomly tell each other what they know; state spreads without a coordinator. | [Gossip](https://en.wikipedia.org/wiki/Gossip_protocol) |
| **Merkle tree** | Hash tree that lets two replicas find *which* data differs without comparing everything. | [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) |
| **Fallacies of distributed computing** | The 8 comfortable lies (the network is reliable, latency is zero…). Memorise them. | [Fallacies](https://en.wikipedia.org/wiki/Fallacies_of_distributed_computing) |

## Messaging

| Term | In one sentence | Learn |
|---|---|---|
| **Queue vs stream** | Queue: each message goes to **one** worker, then it's gone. Stream/log: **every** consumer group reads it, and it's **replayable**. | [§6.4](06-caching-and-queues.md#64-queues--respond-now-work-later) |
| **Pub/sub** | Publish to a topic; N subscribers each get a copy. | [Pub/sub](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern) |
| **Consumer group / offset** | Kafka: a group shares the partitions; the **offset** is your bookmark in the log. | [Kafka intro](https://kafka.apache.org/documentation/#introduction) |
| **Partition key** | Decides which partition a message lands in — and therefore **what's ordered relative to what**. Order is per-partition only. | [Kafka intro](https://kafka.apache.org/documentation/#introduction) |
| **Dead-letter queue (DLQ)** | After N failures, move the poison message aside so it stops blocking the line. | [DLQ](https://en.wikipedia.org/wiki/Dead_letter_queue) |
| **Backlog / lag** | How far behind your consumers are. The metric to alert on. | [§6.4](06-caching-and-queues.md#64-queues--respond-now-work-later) |

## Caching

| Term | In one sentence | Learn |
|---|---|---|
| **Cache-aside** | Read: check cache → miss → load DB → fill cache. Write: **delete** the key. The 90% pattern. | [§6.2](06-caching-and-queues.md#62-cache-aside--the-pattern-youll-use-90-of-the-time) |
| **Write-through / write-back** | Write to cache+DB together (safe) vs cache now, DB later (**fast, loses data on crash**). | [§6.2](06-caching-and-queues.md#62-cache-aside--the-pattern-youll-use-90-of-the-time) |
| **Cache stampede** | A hot key expires → 10,000 requests miss simultaneously → the DB dies. | [Stampede](https://en.wikipedia.org/wiki/Cache_stampede) |
| **Cache penetration** | Requests for keys that **don't exist** bypass the cache every time. Cache the negative result. | [§6.3](06-caching-and-queues.md#63--the-three-ways-a-cache-takes-down-your-database) |
| **Cache avalanche** | Many keys share one expiry and die together. **Add jitter to TTLs.** | [§6.3](06-caching-and-queues.md#63--the-three-ways-a-cache-takes-down-your-database) |
| **Eviction policy (LRU/LFU)** | What gets dropped when memory fills. `allkeys-lru` for a cache; **`noeviction` for a queue.** | [Redis eviction](https://redis.io/docs/latest/develop/reference/eviction/) |
| **Negative caching** | Caching "this doesn't exist" — cheap, and it kills penetration attacks. | [§6.3](06-caching-and-queues.md#63--the-three-ways-a-cache-takes-down-your-database) |

## Reliability & operations

| Term | In one sentence | Learn |
|---|---|---|
| **SLA / SLO / SLI** | SLI = the measurement. SLO = your internal target. SLA = the contract with money attached. | [Google SRE](https://sre.google/sre-book/service-level-objectives/) |
| **Error budget** | `100% − SLO`. Budget left → ship fast. Budget spent → **freeze features and fix reliability.** Turns an argument into a number. | [Google SRE](https://sre.google/sre-book/service-level-objectives/) |
| **The nines** | 99% = 3.65 days/yr down. 99.9% = 8.8 hrs. 99.99% = 52 min. **Each nine ≈ 10× the cost.** | [§8](08-reliability.md) |
| **Circuit breaker** | After N failures, **stop calling** the broken service and fail fast, so it can recover. | [Fowler](https://martinfowler.com/bliki/CircuitBreaker.html) |
| **Bulkhead** | Separate pools per dependency, so one slow downstream can't consume every worker. | [Bulkhead](https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead) |
| **Retry with jitter** | Exponential backoff + **randomness**, or 10,000 clients retry in synchronised waves. | [AWS](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) |
| **Timeout budget** | The user's 3s must be *divided* down the call chain, not handed to every layer. | [§8.1](08-reliability.md#81-timeouts--the-default-is-wait-forever) |
| **Graceful degradation** | Recommendations down → show the page **without** them. Degrade, don't die. | [§8.4](08-reliability.md#84-graceful-degradation) |
| **Liveness vs readiness** | Liveness fails → **restart** me. Readiness fails → **stop sending traffic**, but don't kill me. Confusing them = restart loops. | [§9.5](09-devops.md#95-observability) |
| **Canary / blue-green** | Canary: 5% of users get the new version. Blue-green: flip 100% at once, flip back instantly. | [§9.2](09-devops.md#92-deployment-strategies) |
| **Feature flag** | **Deploying ≠ releasing.** Ship dark, enable from a dashboard, kill in seconds. | [§9.4](09-devops.md#94-feature-flags--deploying--releasing) |
| **Chaos engineering** | Break it on purpose in staging, so you find the missing timeout before the outage does. | [Chaos](https://en.wikipedia.org/wiki/Chaos_engineering) |
| **Four golden signals** | **Latency, traffic, errors, saturation.** Track these and you catch nearly everything. | [Google SRE](https://sre.google/sre-book/monitoring-distributed-systems/) |
| **MTTR / MTBF** | Mean time to **recover** / **between failures**. Optimising MTTR usually beats chasing MTBF. | [Google SRE](https://sre.google/sre-book/table-of-contents/) |
| **Blameless post-mortem** | Systems fail, not people. Ask what made the mistake *possible*. Blame just teaches people to hide problems. | [Google SRE](https://sre.google/sre-book/postmortem-culture/) |

## Probabilistic & specialised structures

| Term | In one sentence | Learn |
|---|---|---|
| **Bloom filter** | "Definitely not present" or "probably present", in tiny memory. **No false negatives.** Skips pointless disk reads. | [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter) |
| **HyperLogLog** | Approximate **unique** counts (e.g. unique visitors) for millions of items in ~12KB. | [HyperLogLog](https://en.wikipedia.org/wiki/HyperLogLog) |
| **Count-min sketch** | Approximate **frequencies** in fixed memory — "what's trending right now". | [Count-min sketch](https://en.wikipedia.org/wiki/Count%E2%80%93min_sketch) |
| **Trie** | Prefix tree. The answer to **search autocomplete / typeahead**. | [Trie](https://en.wikipedia.org/wiki/Trie) |
| **Inverted index** | word → list of documents containing it. The core of every search engine. | [Inverted index](https://en.wikipedia.org/wiki/Inverted_index) |
| **Geohash / quadtree** | Turn 2D coordinates into something you can **index and range-query**. The answer to "find drivers near me". | [Geohash](https://en.wikipedia.org/wiki/Geohash) |
| **Consistent hash ring** | See above — the answer to "how do you distribute keys across N caches". | [§10.5](10-system-design.md#105--hashkey--n-is-a-trap) |

## Architecture

| Term | In one sentence | Learn |
|---|---|---|
| **Monolith vs microservices** | Microservices buy **independent deploys and scaling**; they cost you network calls, distributed transactions, and ops. **Start monolith.** | [Fowler](https://martinfowler.com/articles/microservices.html) |
| **API gateway** | One front door: routing, auth, rate limiting, TLS. | [Primer](https://github.com/donnemartin/system-design-primer#index-of-system-design-topics) |
| **BFF (backend-for-frontend)** | A thin per-client API (mobile vs web) so one client's needs don't warp the core service. | [Fowler](https://martinfowler.com/articles/micro-frontends.html) |
| **Service mesh / sidecar** | Move retries, mTLS, timeouts and tracing *out* of your code into a proxy beside every service. | [Service mesh](https://en.wikipedia.org/wiki/Service_mesh) |
| **Event-driven** | Services publish facts ("order.created"); others react. Decoupled, and much harder to debug. | [Kafka](https://kafka.apache.org/documentation/#introduction) |
| **CQRS** | Separate the **write** model from the **read** model. Powerful, and usually overkill. | [Fowler](https://martinfowler.com/bliki/CQRS.html) |
| **Event sourcing** | Store the **events**, not the current state. Rebuild state by replaying. Full audit log for free. | [Fowler](https://martinfowler.com/eaaDev/EventSourcing.html) |
| **DDD / bounded context** | Draw service boundaries around **business** domains, not technical layers. | [DDD](https://en.wikipedia.org/wiki/Domain-driven_design) |
| **Strangler fig** | Migrate a legacy system by routing features to the new one **one at a time**, until the old one is dead. | [Fowler](https://martinfowler.com/bliki/StranglerFigApplication.html) |
| **12-factor app** | The rules that make an app deployable anywhere (config in env, stateless processes, logs to stdout…). | [12factor](https://12factor.net/) |

---

---

<div align="center">

[← 🎯 🎯 The system design interview](11-interview-round.md) · [**Contents**](../README.md#contents) · [❓ ❓ 130 system design interview questions →](13-interview-questions.md)

<sub><a href="#top">↑ back to top</a></sub>

</div>
