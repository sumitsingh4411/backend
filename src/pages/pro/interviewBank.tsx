import {
  Block,
  Callout,
  Glossary,
  Learn,
  Note,
  Questions,
  RedFlags,
  RefTable,
  Rules,
  type QuestionItem,
} from "../../components/ProKit";

/* ═════════════════════════ The interview round ═════════════════════════ */

export function Interview() {
  return (
    <>
      <Block title="The 45-minute round, minute by minute">
        <Callout tone="bad" title="Most people fail on time, not knowledge">
          They spend 25 minutes on requirements and never draw a system. Budget
          the round <i>before</i> you walk in.
        </Callout>
        <RefTable
          head={["Minutes", "Do this", "The mistake"]}
          rows={[
            [
              "0–5",
              "Clarify: features, scale, read:write, consistency, latency. Restate it back.",
              "designing before you know what you're designing",
            ],
            [
              "5–10",
              "Estimate: QPS, storage, peak. Round hard.",
              "skipping it — the numbers tell you what the problem IS",
            ],
            [
              "10–15",
              "API + data model, driven by the access pattern",
              "picking a database before knowing how you'll query",
            ],
            [
              "15–30",
              "High-level design. Draw boxes. TALK while you draw.",
              "silence — they can't grade what you don't say",
            ],
            [
              "30–40",
              "Deep dive on the part they pick. Go deep on the bottleneck.",
              "being surprised — expect this, know your hard part",
            ],
            [
              "40–45",
              "Bottlenecks, failure modes, trade-offs",
              "claiming your design has no weaknesses",
            ],
          ]}
        />
      </Block>

      <Block title="What they're actually grading">
        <Callout tone="info" title="The word 'so' is the entire interview">
          They are <b>not</b> grading whether you found the “right” architecture
          — there isn't one. They're grading whether you can say the{" "}
          <b>trade-off out loud</b>:
          <br />
          <br />
          “Reads dominate 100:1, <b>so</b> I'll cache aggressively.”
          <br />
          “This must not double-charge, <b>so</b> idempotency keys.”
          <br />
          “A stale like-count harms nobody, <b>so</b> eventual consistency here
          — but the balance is strong.”
          <br />
          <br />A candidate who says “I'll use Kafka” scores <i>worse</i> than
          one who says “writes spike 10× at 9am and consumers are slow,{" "}
          <b>so</b> I'll buffer with a queue.”
        </Callout>
      </Block>

      <Block title="Three sentences that make you sound senior">
        <Rules
          items={[
            <>
              “Before I design — what's the <b>read:write ratio</b>, and can
              this data be stale?”
            </>,
            <>
              “That's a single point of failure. If it goes down we'd fail{" "}
              <b>open</b> here, because a rate-limiter outage shouldn't take
              down login.”
            </>,
            <>
              “I'd start with <b>one Postgres instance</b>. We're at 200
              writes/second — sharding now would cost us joins and buy us
              nothing.”
            </>,
          ]}
        />
        <Note>
          Notice what all three have in common: they name a <b>constraint</b>,
          then a <b>consequence</b>. That's the whole skill.
        </Note>
      </Block>

      <Learn
        links={[
          {
            label: "System Design Primer",
            href: "https://github.com/donnemartin/system-design-primer",
            note: "The most complete free resource, with worked solutions.",
          },
          {
            label: "ByteByteGo (YouTube)",
            href: "https://www.youtube.com/@ByteByteGo",
            note: "Short, sharp walkthroughs of exactly these prompts.",
          },
          {
            label: "High Scalability",
            href: "http://highscalability.com/",
            note: "How real companies actually built it — the best sanity check.",
          },
        ]}
      />

      <RedFlags
        items={[
          "Jumping to a solution before clarifying requirements",
          "No estimation — so you never discover it's a read-scaling problem",
          "Stateful app servers (sessions or files in local memory)",
          "Buzzword soup: naming Kafka, Cassandra and K8s with no reason attached",
          "No failure story — 'what if the cache dies?' … 'um'",
          "No idempotency anywhere near a payment",
          "Silence. Thinking quietly for four minutes reads as knowing nothing.",
        ]}
      />
    </>
  );
}

/* ═════════════════════════════ Glossary ════════════════════════════════ */

export function BackendGlossary() {
  return (
    <>
      <Note>
        Every term below has come up in a real backend interview. If you can't
        define it in <b>one sentence</b>, open the link.
      </Note>

      <Block title="Scale & traffic">
        <Glossary
          items={[
            {
              term: "QPS / RPS",
              def: "Queries (requests) per second — the unit of all capacity maths.",
              href: "/pro/system-design/estimation",
            },
            {
              term: "Throughput vs latency",
              def: (
                <>
                  Throughput = how many per second. Latency = how long{" "}
                  <b>one</b> takes. You can have great throughput and terrible
                  latency.
                </>
              ),
              href: "/pro/performance/measure",
            },
            {
              term: "p50 / p95 / p99",
              def: (
                <>
                  Percentiles. p99 = the slowest 1%.{" "}
                  <b>Nobody experiences the average.</b>
                </>
              ),
              href: "/pro/performance/measure",
            },
            {
              term: "Tail latency",
              def: "Your slow requests. A page making 20 calls hits p99 on almost every load.",
              href: "/pro/performance/measure",
            },
            {
              term: "Horizontal vs vertical",
              def: "Add MORE machines vs a BIGGER machine. Vertical hits a ceiling and a price cliff.",
              href: "/pro/system-design/building-blocks",
            },
            {
              term: "Stateless",
              def: "The server keeps nothing between requests → kill any box, lose nothing → scale out.",
              href: "/pro/system-design/building-blocks",
            },
            {
              term: "Load balancer (L4/L7)",
              def: "L4 routes by IP/port (fast, dumb). L7 reads the HTTP request (can route by path/header).",
              href: "https://en.wikipedia.org/wiki/Load_balancing_(computing)",
            },
            {
              term: "Sticky session",
              def: "Pinning a user to one server. A smell — it means you aren't stateless.",
              href: "/pro/system-design/building-blocks",
            },
            {
              term: "Little's Law",
              def: "L = λW. Concurrency = arrival rate × time in system. Tells you how many in-flight requests you must hold.",
              href: "https://en.wikipedia.org/wiki/Little%27s_law",
            },
            {
              term: "Amdahl's Law",
              def: "The serial part caps your speedup. 90% of the time in one query → optimise THAT.",
              href: "https://en.wikipedia.org/wiki/Amdahl%27s_law",
            },
            {
              term: "Hot key / hot partition",
              def: "One key or shard takes disproportionate traffic (a celebrity, a viral post) and melts one node.",
              href: "/pro/system-design/worked-designs",
            },
            {
              term: "Thundering herd",
              def: "Everyone retries or misses the cache at the same instant and stampedes the backend.",
              href: "https://en.wikipedia.org/wiki/Thundering_herd_problem",
            },
            {
              term: "Back-pressure",
              def: "When you can't keep up, push back (reject fast, slow the producer) instead of buffering to death.",
              href: "/pro/performance/concurrency",
            },
            {
              term: "Load shedding",
              def: "Deliberately dropping a fraction of traffic (503) so the rest still gets served. Half up beats all down.",
              href: "/pro/reliability/patterns",
            },
            {
              term: "Token / leaky bucket",
              def: "Rate-limit algorithms. Token bucket allows natural bursts; leaky bucket smooths to a constant rate.",
              href: "https://en.wikipedia.org/wiki/Token_bucket",
            },
            {
              term: "Fan-out",
              def: "One event → many writes/reads. On WRITE = precompute. On READ = compute at query time.",
              href: "/pro/system-design/worked-designs",
            },
            {
              term: "Write amplification",
              def: "One logical write causes many physical writes (50M followers → 50M feed inserts).",
              href: "/pro/system-design/worked-designs",
            },
            {
              term: "Blast radius",
              def: "How much breaks when THIS breaks. Canary deploys shrink it to 5%.",
              href: "/pro/devops/cicd",
            },
          ]}
        />
      </Block>

      <Block title="Data & storage">
        <Glossary
          items={[
            {
              term: "OLTP vs OLAP",
              def: "Transactions (many small reads/writes: Postgres) vs analytics (huge scans: ClickHouse). Don't run OLAP on your OLTP box.",
              href: "/pro/databases/choosing",
            },
            {
              term: "Normalization",
              def: "One fact, one place. Denormalise on purpose, never by accident.",
              href: "/pro/databases/modelling",
            },
            {
              term: "Index",
              def: "A sorted lookup structure. 10M rows → 3–4 hops instead of a full scan.",
              href: "/pro/databases/indexes",
            },
            {
              term: "Leftmost prefix",
              def: (
                <>
                  An index on <code>(a, b)</code> serves <code>WHERE a</code>{" "}
                  and <code>WHERE a AND b</code> — but <b>not</b>{" "}
                  <code>WHERE b</code> alone.
                </>
              ),
              href: "/pro/databases/indexes",
            },
            {
              term: "Covering index",
              def: "The index holds every column the query needs → Index Only Scan → never touches the table.",
              href: "/pro/databases/indexes",
            },
            {
              term: "B-tree",
              def: "Balanced tree, updates in place. Fast reads. Powers Postgres/MySQL.",
              href: "https://en.wikipedia.org/wiki/B-tree",
            },
            {
              term: "LSM tree",
              def: "Append to memory, flush sorted files, compact later. Very fast writes. Powers Cassandra, RocksDB.",
              href: "https://en.wikipedia.org/wiki/Log-structured_merge-tree",
            },
            {
              term: "WAL",
              def: "Append the change to a log and fsync BEFORE touching data files. Makes 'committed' survive a crash — and powers replication and PITR.",
              href: "/pro/databases/scaling",
            },
            {
              term: "MVCC",
              def: "Don't overwrite a row — write a new version. That's why readers never block writers. Cost: VACUUM.",
              href: "/pro/databases/transactions",
            },
            {
              term: "ACID",
              def: "Atomic, Consistent, Isolated, Durable.",
              href: "/pro/databases/transactions",
            },
            {
              term: "Isolation levels",
              def: "Read committed → repeatable read → serializable. Each blocks more anomalies and costs more.",
              href: "/pro/databases/transactions",
            },
            {
              term: "Optimistic vs pessimistic",
              def: "Optimistic: check a version on write, retry on clash. Pessimistic: SELECT … FOR UPDATE, others wait.",
              href: "/pro/databases/transactions",
            },
            {
              term: "Partitioning",
              def: "Split a big table WITHIN one database (usually by time). Dropping last year is DROP TABLE — instant.",
              href: "/pro/databases/scaling",
            },
            {
              term: "Sharding",
              def: "Split rows across MACHINES by a shard key. Scales writes; costs you cross-shard joins.",
              href: "/pro/databases/scaling",
            },
            {
              term: "Shard key",
              def: "The column you split on. Pick it by HOW YOU QUERY. Wrong key → every query fans out to every shard.",
              href: "/pro/databases/scaling",
            },
            {
              term: "Replication lag",
              def: "The replica is behind the primary. Causes “I saved it and it didn't save”.",
              href: "/pro/databases/scaling",
            },
            {
              term: "Quorum (W+R>N)",
              def: "Require a majority to confirm. A majority can't exist on both sides of a split → no split-brain.",
              href: "/pro/reliability/cap",
            },
            {
              term: "Consistent hashing",
              def: "Keys and servers on a ring → adding a node moves ~1/N of keys, not 80%.",
              href: "/pro/system-design/building-blocks",
            },
            {
              term: "Materialized view",
              def: "A precomputed query result, stored. Fast reads, refresh cost.",
              href: "https://www.postgresql.org/docs/current/rules-materializedviews.html",
            },
            {
              term: "Object storage (S3)",
              def: "Where files go. Never the local disk of an app server.",
              href: "/pro/system-design/building-blocks",
            },
          ]}
        />
      </Block>

      <Block title="Consistency & distributed systems">
        <Glossary
          items={[
            {
              term: "CAP theorem",
              def: "When the network partitions, choose Consistency or Availability. P isn't optional.",
              href: "/pro/reliability/cap",
            },
            {
              term: "PACELC",
              def: "The honest CAP: on Partition choose A or C; Else (normal operation) choose Latency or Consistency.",
              href: "https://en.wikipedia.org/wiki/PACELC_theorem",
            },
            {
              term: "Linearizability",
              def: "Every read sees the latest write, as if there were one copy. The strongest, slowest guarantee.",
              href: "https://jepsen.io/consistency",
            },
            {
              term: "Serializability",
              def: "Concurrent transactions behave as if run one after another. A different axis from linearizability.",
              href: "/pro/databases/transactions",
            },
            {
              term: "Eventual consistency",
              def: "Replicas converge… eventually. Fine for likes; not for balances.",
              href: "/pro/reliability/cap",
            },
            {
              term: "Read-your-writes",
              def: "YOU see YOUR OWN changes immediately, even if others lag. Usually the real requirement.",
              href: "/pro/reliability/cap",
            },
            {
              term: "Consensus",
              def: "Getting N nodes to agree on one value despite failures.",
              href: "/pro/reliability/cap",
            },
            {
              term: "Raft / Paxos",
              def: "The two consensus algorithms. Elect a leader; the leader orders all writes. Raft is the one you can explain.",
              href: "https://raft.github.io/",
            },
            {
              term: "Split-brain",
              def: "Two halves of a cluster both think they're the leader and diverge. Quorums prevent it.",
              href: "https://en.wikipedia.org/wiki/Split-brain_(computing)",
            },
            {
              term: "Fencing token",
              def: "A monotonically increasing number attached to a lock, so a STALE lock-holder's writes get rejected.",
              href: "/pro/reliability/cap",
            },
            {
              term: "Clock skew",
              def: "Server clocks drift. Never order distributed events by wall-clock time.",
              href: "https://en.wikipedia.org/wiki/Clock_skew",
            },
            {
              term: "Snowflake ID",
              def: "A 64-bit, time-sortable, globally unique id generated with no coordination (timestamp + machine + counter).",
              href: "https://en.wikipedia.org/wiki/Snowflake_ID",
            },
            {
              term: "Vector clock",
              def: "Tracks causality across replicas so you can detect concurrent (conflicting) updates.",
              href: "https://en.wikipedia.org/wiki/Vector_clock",
            },
            {
              term: "CRDT",
              def: "A data type that merges automatically without conflict. How collaborative editing and offline sync work.",
              href: "https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type",
            },
            {
              term: "Operational Transform",
              def: "The other way to do collaborative editing (Google Docs). Transforms concurrent ops against each other.",
              href: "https://en.wikipedia.org/wiki/Operational_transformation",
            },
            {
              term: "Two-phase commit",
              def: "Distributed transaction: prepare, then commit. BLOCKS if the coordinator dies. Avoid.",
              href: "https://en.wikipedia.org/wiki/Two-phase_commit_protocol",
            },
            {
              term: "Saga",
              def: "Replace a distributed transaction with local transactions + compensating actions (undo).",
              href: "/pro/reliability/data-ops",
            },
            {
              term: "Transactional outbox",
              def: "Write the row AND the event in one DB transaction; a relay publishes it. Fixes the dual-write bug.",
              href: "/pro/reliability/data-ops",
            },
            {
              term: "Idempotency",
              def: "Doing it twice = doing it once. The single most important word in distributed systems.",
              href: "/pro/apis/robustness",
            },
            {
              term: "“Exactly-once”",
              def: "A myth at the delivery layer. You get at-least-once delivery + idempotent processing, and call it exactly-once.",
              href: "/pro/caching/queues",
            },
            {
              term: "Gossip protocol",
              def: "Nodes randomly tell each other what they know; state spreads with no coordinator.",
              href: "https://en.wikipedia.org/wiki/Gossip_protocol",
            },
            {
              term: "Merkle tree",
              def: "Hash tree that lets two replicas find WHICH data differs without comparing everything.",
              href: "https://en.wikipedia.org/wiki/Merkle_tree",
            },
            {
              term: "The 8 fallacies",
              def: "The comfortable lies of distributed computing (the network is reliable, latency is zero…). Memorise them.",
              href: "/pro/reliability/failure",
            },
          ]}
        />
      </Block>

      <Block title="Messaging & caching">
        <Glossary
          items={[
            {
              term: "Queue vs stream",
              def: "Queue: each message goes to ONE worker, then it's gone. Stream/log: EVERY consumer group reads it, and it's replayable.",
              href: "/pro/caching/queues",
            },
            {
              term: "Consumer group / offset",
              def: "Kafka: a group shares the partitions; the offset is your bookmark in the log.",
              href: "https://kafka.apache.org/documentation/#introduction",
            },
            {
              term: "Partition key",
              def: "Decides which partition a message lands in — and therefore WHAT'S ORDERED relative to what. Order is per-partition only.",
              href: "https://kafka.apache.org/documentation/#introduction",
            },
            {
              term: "Dead-letter queue",
              def: "After N failures, move the poison message aside so it stops blocking the line.",
              href: "/pro/caching/queues",
            },
            {
              term: "At-least-once",
              def: "The default. Queues redeliver on crash → duplicates → your consumer must be idempotent.",
              href: "/pro/caching/queues",
            },
            {
              term: "Cache-aside",
              def: "Read: check cache → miss → load DB → fill cache. Write: DELETE the key. The 90% pattern.",
              href: "/pro/caching/patterns",
            },
            {
              term: "Write-through / back",
              def: "Write to cache+DB together (safe) vs cache now, DB later (fast, loses data on crash).",
              href: "/pro/caching/patterns",
            },
            {
              term: "Cache stampede",
              def: "A hot key expires → 10,000 requests miss simultaneously → the database dies.",
              href: "/pro/caching/patterns",
            },
            {
              term: "Cache penetration",
              def: "Requests for keys that DON'T EXIST bypass the cache every time. Cache the negative result.",
              href: "/pro/caching/patterns",
            },
            {
              term: "Cache avalanche",
              def: "Many keys share one expiry and die together. Add jitter to every TTL.",
              href: "/pro/caching/patterns",
            },
            {
              term: "Eviction (LRU/LFU)",
              def: "What gets dropped when memory fills. allkeys-lru for a cache; noeviction for a queue.",
              href: "/pro/caching/redis",
            },
          ]}
        />
      </Block>

      <Block title="Reliability & operations">
        <Glossary
          items={[
            {
              term: "SLA / SLO / SLI",
              def: "SLI = the measurement. SLO = your internal target. SLA = the contract with money attached.",
              href: "https://sre.google/sre-book/service-level-objectives/",
            },
            {
              term: "Error budget",
              def: "100% − SLO. Budget left → ship fast. Budget spent → freeze features and fix reliability. Turns an argument into a number.",
              href: "/pro/reliability/failure",
            },
            {
              term: "The nines",
              def: "99% = 3.65 days/yr down. 99.9% = 8.8 hrs. 99.99% = 52 min. Each nine ≈ 10× the cost.",
              href: "/pro/reliability/failure",
            },
            {
              term: "Circuit breaker",
              def: "After N failures, STOP CALLING the broken service and fail fast, so it can recover.",
              href: "/pro/reliability/patterns",
            },
            {
              term: "Bulkhead",
              def: "Separate pools per dependency, so one slow downstream can't consume every worker.",
              href: "/pro/performance/concurrency",
            },
            {
              term: "Retry with jitter",
              def: "Exponential backoff + RANDOMNESS, or 10,000 clients retry in synchronised waves.",
              href: "/pro/reliability/patterns",
            },
            {
              term: "Timeout budget",
              def: "The user's 3s must be DIVIDED down the call chain, not handed to every layer.",
              href: "/pro/reliability/patterns",
            },
            {
              term: "Graceful degradation",
              def: "Recommendations down → show the page WITHOUT them. Degrade, don't die.",
              href: "/pro/reliability/patterns",
            },
            {
              term: "Liveness vs readiness",
              def: "Liveness fails → RESTART me. Readiness fails → STOP SENDING TRAFFIC, but don't kill me. Confusing them causes restart loops.",
              href: "/pro/devops/orchestration",
            },
            {
              term: "Canary / blue-green",
              def: "Canary: 5% of users get the new version. Blue-green: flip 100% at once, flip back instantly.",
              href: "/pro/devops/cicd",
            },
            {
              term: "Feature flag",
              def: "Deploying ≠ releasing. Ship dark, enable from a dashboard, kill in seconds.",
              href: "/pro/devops/cicd",
            },
            {
              term: "Four golden signals",
              def: "Latency, traffic, errors, saturation. Track these and you catch nearly everything.",
              href: "/pro/devops/observability",
            },
            {
              term: "Chaos engineering",
              def: "Break it on purpose in staging, so you find the missing timeout before the outage does.",
              href: "/pro/reliability/data-ops",
            },
          ]}
        />
      </Block>

      <Block title="Probabilistic structures & architecture">
        <Glossary
          items={[
            {
              term: "Bloom filter",
              def: "“Definitely not present” or “probably present”, in tiny memory. NO false negatives. Skips pointless disk reads.",
              href: "https://en.wikipedia.org/wiki/Bloom_filter",
            },
            {
              term: "HyperLogLog",
              def: "Approximate UNIQUE counts (unique visitors) for millions of items in ~12KB.",
              href: "https://en.wikipedia.org/wiki/HyperLogLog",
            },
            {
              term: "Count-min sketch",
              def: "Approximate FREQUENCIES in fixed memory — “what's trending right now”.",
              href: "https://en.wikipedia.org/wiki/Count%E2%80%93min_sketch",
            },
            {
              term: "Trie",
              def: "Prefix tree. The answer to search autocomplete / typeahead.",
              href: "https://en.wikipedia.org/wiki/Trie",
            },
            {
              term: "Inverted index",
              def: "word → list of documents containing it. The core of every search engine.",
              href: "https://en.wikipedia.org/wiki/Inverted_index",
            },
            {
              term: "Geohash / quadtree",
              def: "Turn 2D coordinates into something you can index and range-query. The answer to “find drivers near me”.",
              href: "https://en.wikipedia.org/wiki/Geohash",
            },
            {
              term: "Monolith vs micro",
              def: "Microservices buy independent deploys and scaling; they cost you network calls, distributed transactions, and ops. START MONOLITH.",
              href: "https://martinfowler.com/articles/microservices.html",
            },
            {
              term: "API gateway",
              def: "One front door: routing, auth, rate limiting, TLS termination.",
              href: "/pro/system-design/building-blocks",
            },
            {
              term: "Service mesh / sidecar",
              def: "Move retries, mTLS, timeouts and tracing OUT of your code into a proxy beside every service.",
              href: "https://en.wikipedia.org/wiki/Service_mesh",
            },
            {
              term: "CQRS",
              def: "Separate the WRITE model from the READ model. Powerful, and usually overkill.",
              href: "https://martinfowler.com/bliki/CQRS.html",
            },
            {
              term: "Event sourcing",
              def: "Store the EVENTS, not the current state. Rebuild state by replaying. Full audit log for free.",
              href: "https://martinfowler.com/eaaDev/EventSourcing.html",
            },
            {
              term: "Strangler fig",
              def: "Migrate a legacy system by routing features to the new one ONE AT A TIME, until the old one is dead.",
              href: "https://martinfowler.com/bliki/StranglerFigApplication.html",
            },
            {
              term: "12-factor app",
              def: "The rules that make an app deployable anywhere (config in env, stateless processes, logs to stdout…).",
              href: "https://12factor.net/",
            },
          ]}
        />
      </Block>
    </>
  );
}

/* ═══════════════════════ The 130-question bank ═════════════════════════ */

const DESIGN_PROMPTS: QuestionItem[] = [
  {
    q: "Design a URL shortener (TinyURL)",
    why: "Base62-encode a unique id → collisions become structurally impossible. 302, not 301, or you lose click analytics.",
    href: "/pro/system-design/worked-designs",
    label: "Worked",
  },
  {
    q: "Design Twitter / a news feed",
    why: "Fan-out on write + the celebrity exception. A hybrid, merged at read time.",
    href: "/pro/system-design/worked-designs",
    label: "Worked",
  },
  {
    q: "Design Instagram",
    why: "Feed + object storage for media + CDN. Never store images in the database.",
    href: "/pro/system-design/building-blocks",
  },
  {
    q: "Design WhatsApp / a chat system",
    why: "WebSockets make servers stateful → you need a pub/sub backbone and a presence registry.",
    href: "/pro/system-design/worked-designs",
    label: "Worked",
  },
  {
    q: "Design a rate limiter",
    why: "Token bucket in Redis with an ATOMIC Lua script. Then: fail open or fail closed? Say which.",
    href: "/pro/system-design/worked-designs",
    label: "Worked",
  },
  {
    q: "Design a web crawler",
    why: "Politeness (robots.txt, per-domain limits), URL dedupe via a Bloom filter, a frontier queue.",
    href: "https://en.wikipedia.org/wiki/Bloom_filter",
    label: "Bloom",
  },
  {
    q: "Design search autocomplete / typeahead",
    why: "A trie, with precomputed top-K per prefix, cached hard. The latency budget is ~50ms.",
    href: "https://en.wikipedia.org/wiki/Trie",
    label: "Trie",
  },
  {
    q: "Design YouTube / Netflix",
    why: "Upload → transcode ASYNC into many resolutions → CDN. The database stores metadata only.",
    href: "/pro/caching/queues",
  },
  {
    q: "Design Dropbox / Google Drive",
    why: "Chunk files, hash chunks, dedupe, sync deltas — don't re-upload 2GB for a one-line change.",
    href: "/pro/system-design/building-blocks",
  },
  {
    q: "Design Google Docs (collaborative editing)",
    why: "CRDT or Operational Transform. Last-write-wins destroys people's work.",
    href: "https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type",
    label: "CRDT",
  },
  {
    q: "Design Uber / Lyft",
    why: "Geospatial index (geohash / quadtree) + real-time driver location + matching.",
    href: "https://en.wikipedia.org/wiki/Geohash",
    label: "Geohash",
  },
  {
    q: "Design Yelp / a proximity service",
    why: "Same geospatial core; reads dominate → cache aggressively.",
    href: "https://en.wikipedia.org/wiki/Quadtree",
    label: "Quadtree",
  },
  {
    q: "Design Ticketmaster / seat booking",
    why: "The WHOLE problem is the double-booking race. Pessimistic lock or an atomic conditional update + reservation TTL.",
    href: "/pro/databases/transactions",
    label: "Races",
  },
  {
    q: "Design a payment system",
    why: "Idempotency keys, a double-entry ledger, the outbox — and never trusting the client's amount.",
    href: "/pro/apis/robustness",
    label: "Idempotency",
  },
  {
    q: "Design a notification system",
    why: "Fan-out + per-channel providers + retries + dedupe + user preferences + a DLQ.",
    href: "/pro/caching/queues",
  },
  {
    q: "Design a distributed unique ID generator",
    why: "Snowflake: timestamp + machine id + counter. Time-sortable, needs no coordination.",
    href: "https://en.wikipedia.org/wiki/Snowflake_ID",
    label: "Snowflake",
  },
  {
    q: "Design a distributed cache (Redis-like)",
    why: "Consistent hashing + replication + an eviction policy.",
    href: "/pro/system-design/building-blocks",
  },
  {
    q: "Design a key-value store (Dynamo-like)",
    why: "Consistent hashing, quorums (W+R>N), vector clocks, hinted handoff, read repair.",
    href: "https://www.allthingsdistributed.com/2007/10/amazons_dynamo.html",
    label: "Dynamo",
  },
  {
    q: "Design an object store (S3-like)",
    why: "Immutable blobs, a metadata DB, erasure coding, multipart upload.",
    href: "/pro/system-design/building-blocks",
  },
  {
    q: "Design a distributed job scheduler",
    why: "Leader election, at-least-once execution, idempotent jobs — and the multi-instance cron trap.",
    href: "/pro/caching/queues",
    label: "Queues",
  },
  {
    q: "Design a log aggregation system (ELK)",
    why: "High write volume → append-only, batched, partitioned by time, LSM-backed.",
    href: "/pro/devops/observability",
  },
  {
    q: "Design a metrics / monitoring system",
    why: "Time-series DB, downsampling and rollups. Cardinality explosion is the trap.",
    href: "/pro/devops/observability",
  },
  {
    q: "Design an ad click aggregator",
    why: "Huge write volume, and approximate counts are fine → stream processing + count-min sketch.",
    href: "https://en.wikipedia.org/wiki/Count%E2%80%93min_sketch",
    label: "Sketch",
  },
  {
    q: "Design a leaderboard",
    why: "A Redis sorted set. O(log n) rank. Don't ORDER BY score over 10M rows per request.",
    href: "/pro/caching/redis",
    label: "Redis",
  },
  {
    q: "Design Pastebin",
    why: "Like the shortener, plus TTL/expiry and object storage for large pastes.",
    href: "/pro/system-design/worked-designs",
  },
  {
    q: "Design a stock exchange / order matching engine",
    why: "A single-threaded matching engine per symbol (ordering is everything), event-sourced for audit.",
    href: "https://martinfowler.com/eaaDev/EventSourcing.html",
    label: "ES",
  },
  {
    q: "Design a food delivery app (DoorDash)",
    why: "Geospatial + a real-time state machine per order + eventual consistency on ETAs.",
    href: "https://en.wikipedia.org/wiki/Geohash",
    label: "Geohash",
  },
  {
    q: "Design hotel / airline booking",
    why: "Inventory reservation with a TTL, and a saga across payment + inventory.",
    href: "/pro/reliability/data-ops",
    label: "Saga",
  },
  {
    q: "Design Slack / Discord",
    why: "Chat + channels + fan-out + presence + read receipts (per-user cursors).",
    href: "/pro/system-design/worked-designs",
  },
  {
    q: "Design an email service (SES-like)",
    why: "Queue + per-domain rate limits + bounce/complaint handling + retries with backoff.",
    href: "/pro/reliability/patterns",
  },
  {
    q: "Design a CDN",
    why: "Edge caching, cache keys, purge/invalidation, origin shielding.",
    href: "/pro/caching/layers",
  },
  {
    q: "Design Google Maps / routing",
    why: "Graph partitioning + precomputed shortcuts. You cannot Dijkstra the planet per request.",
    href: "https://github.com/donnemartin/system-design-primer",
    label: "Primer",
  },
  {
    q: "Design an online judge / code runner",
    why: "Untrusted code → sandboxing (containers, seccomp), hard resource limits, queue-based execution.",
    href: "/pro/devops/containers",
  },
  {
    q: "Design a recommendation system",
    why: "Offline batch compute → serve from a precomputed store. NEVER compute ML per request.",
    href: "/pro/caching/layers",
  },
  {
    q: "Design a public API (Stripe-like)",
    why: "Idempotency, versioning, cursor pagination, webhooks, per-customer keys and limits.",
    href: "/pro/apis/robustness",
  },
];

const DEEP_DIVES: QuestionItem[] = [
  {
    q: "How do you generate unique IDs across many servers?",
    why: "Do you say Snowflake/ULID — or 'auto-increment', and not notice it can't work?",
    href: "https://en.wikipedia.org/wiki/Snowflake_ID",
    label: "Snowflake",
  },
  {
    q: "What happens when a celebrity with 50M followers posts?",
    why: "Write amplification. They want the hybrid fan-out.",
    href: "/pro/system-design/worked-designs",
  },
  {
    q: "Your cache goes down. What happens?",
    why: "Do you thundering-herd the database to death? Do you fail open or closed?",
    href: "/pro/caching/patterns",
  },
  {
    q: "How do you avoid double-charging a customer?",
    why: "Idempotency keys. If your answer is 'retries', you failed.",
    href: "/pro/apis/robustness",
  },
  {
    q: "Two users book the last seat at the same time.",
    why: "The lost-update race. An atomic conditional UPDATE, or SELECT … FOR UPDATE.",
    href: "/pro/databases/transactions",
  },
  {
    q: "How would you shard this? What's the shard key?",
    why: "Do you pick by ACCESS PATTERN, or by whatever happens to be unique?",
    href: "/pro/databases/scaling",
  },
  {
    q: "A shard becomes hot. Now what?",
    why: "Hot partition: split it, salt the key, or put a cache in front.",
    href: "/pro/system-design/worked-designs",
  },
  {
    q: "How do you add a cache server without melting the DB?",
    why: "Consistent hashing. hash % N remaps ~80% of keys — every one becomes a miss.",
    href: "/pro/system-design/building-blocks",
  },
  {
    q: "How do you guarantee message ordering?",
    why: "Order is PER-PARTITION. Same key → same partition. Global ordering costs throughput.",
    href: "https://kafka.apache.org/documentation/#introduction",
    label: "Kafka",
  },
  {
    q: "Your queue delivers the same message twice.",
    why: "At-least-once is the default. Make the consumer idempotent.",
    href: "/pro/caching/queues",
  },
  {
    q: "How do you write to the DB and publish an event atomically?",
    why: "The dual-write problem → the transactional outbox.",
    href: "/pro/reliability/data-ops",
  },
  {
    q: "A user updates their profile and it 'doesn't save'.",
    why: "Replica lag. Route their reads to the primary for a few seconds.",
    href: "/pro/databases/scaling",
  },
  {
    q: "How do you paginate a feed that changes constantly?",
    why: "Cursor, not offset — or users see duplicates and gaps.",
    href: "/pro/apis/payloads",
  },
  {
    q: "A downstream service becomes slow (not down).",
    why: "The killer. Timeouts + a circuit breaker, or your pool exhausts and you go down with it.",
    href: "/pro/reliability/patterns",
  },
  {
    q: "10,000 clients all retry at the same moment.",
    why: "Thundering herd → jitter. Retries without it are synchronised waves.",
    href: "/pro/reliability/patterns",
  },
  {
    q: "How do you run a nightly job across 20 instances?",
    why: "The cron trap → a distributed lock, or a real scheduler outside the app.",
    href: "/pro/caching/queues",
  },
  {
    q: "How do you rename a column with zero downtime?",
    why: "Expand/contract — six steps. Old and new code run simultaneously against one schema.",
    href: "/pro/devops/migrations",
  },
  {
    q: "How do you deploy without dropping in-flight requests?",
    why: "Rolling/canary + readiness probes + graceful shutdown on SIGTERM.",
    href: "/pro/devops/cicd",
  },
  {
    q: "Your database hits its connection limit.",
    why: "pool × instances. The multiplication nobody does until the incident. PgBouncer.",
    href: "/pro/databases/scaling",
  },
  {
    q: "How do you find WHICH query is slow?",
    why: "pg_stat_statements ordered by TOTAL time, then EXPLAIN ANALYZE the top offenders.",
    href: "/pro/databases/indexes",
  },
  {
    q: "p99 is 4s but p50 is 50ms. Why?",
    why: "Tail causes differ from median causes: GC pauses, a cold cache, locks, retries, a slow replica.",
    href: "/pro/performance/measure",
  },
  {
    q: "How do you handle a 10× traffic spike?",
    why: "Queue to absorb, autoscale, load shed, and degrade non-critical features.",
    href: "/pro/reliability/patterns",
  },
  {
    q: "How do you stop one customer starving all the others?",
    why: "Per-tenant rate limits + bulkheads (separate pools per dependency).",
    href: "/pro/performance/concurrency",
  },
  {
    q: "How would you store 100M images?",
    why: "Object storage + CDN. Not the database. Not the local disk.",
    href: "/pro/caching/layers",
  },
  {
    q: "How do you implement full-text search?",
    why: "An inverted index (Elasticsearch) BESIDE the source of truth — never AS it.",
    href: "https://en.wikipedia.org/wiki/Inverted_index",
    label: "Index",
  },
  {
    q: "How do you find 'restaurants near me'?",
    why: "Geohash / quadtree. You cannot scan every row and compute distance.",
    href: "https://en.wikipedia.org/wiki/Geohash",
    label: "Geohash",
  },
  {
    q: "How do you count unique visitors cheaply?",
    why: "HyperLogLog — millions of items in ~12KB, approximate.",
    href: "https://en.wikipedia.org/wiki/HyperLogLog",
    label: "HLL",
  },
  {
    q: "How do you avoid pointless disk reads for missing keys?",
    why: "A Bloom filter in front. No false negatives, so a 'no' is always true.",
    href: "https://en.wikipedia.org/wiki/Bloom_filter",
    label: "Bloom",
  },
  {
    q: "What if the leader node dies?",
    why: "Election via consensus (Raft), a majority quorum, and fencing tokens to stop the old leader writing.",
    href: "https://raft.github.io/",
    label: "Raft",
  },
  {
    q: "How would you migrate to a new database with no downtime?",
    why: "Dual-write + backfill + shadow reads + cutover + a rollback plan.",
    href: "/pro/devops/migrations",
  },
];

const CONCEPTS: QuestionItem[] = [
  {
    q: "What is the CAP theorem — and why is 'pick two' misleading?",
    href: "/pro/reliability/cap",
  },
  {
    q: "What is PACELC, and why is it more honest than CAP?",
    href: "https://en.wikipedia.org/wiki/PACELC_theorem",
    label: "PACELC",
  },
  {
    q: "Strong vs eventual consistency — a real example of each?",
    href: "/pro/reliability/cap",
  },
  {
    q: "What is read-your-writes consistency, and why do users notice its absence?",
    href: "/pro/databases/scaling",
  },
  {
    q: "Linearizability vs serializability — what's the difference?",
    href: "https://jepsen.io/consistency",
    label: "Jepsen",
  },
  {
    q: "Explain ACID. Which letter do NoSQL stores usually trade away?",
    href: "/pro/databases/transactions",
  },
  {
    q: "What are the isolation levels, and what anomaly does each still allow?",
    href: "/pro/databases/transactions",
  },
  {
    q: "Define dirty read, non-repeatable read, phantom, and write skew.",
    href: "/pro/databases/transactions",
  },
  {
    q: "Optimistic vs pessimistic locking — when would you use each?",
    href: "/pro/databases/transactions",
  },
  {
    q: "What is MVCC, and why does it mean readers never block writers?",
    href: "/pro/databases/transactions",
  },
  {
    q: "What is a write-ahead log, and what three jobs does it do?",
    href: "/pro/databases/scaling",
  },
  {
    q: "B-tree vs LSM tree — which for a write-heavy workload, and why?",
    href: "https://en.wikipedia.org/wiki/Log-structured_merge-tree",
    label: "LSM",
  },
  {
    q: "How does an index actually make a lookup fast?",
    href: "/pro/databases/indexes",
  },
  {
    q: "Why can an index on (a, b) not serve WHERE b = ?",
    href: "/pro/databases/indexes",
  },
  {
    q: "Why is an index on a boolean column usually useless?",
    href: "/pro/databases/indexes",
  },
  {
    q: "What is an N+1 query, and how does an ORM cause it silently?",
    href: "/pro/databases/indexes",
  },
  {
    q: "Why is OFFSET 100000 slow — and what's the correctness bug?",
    href: "/pro/apis/payloads",
  },
  {
    q: "Partitioning vs sharding — what's the actual difference?",
    href: "/pro/databases/scaling",
  },
  {
    q: "What is consistent hashing, and what breaks with hash % N?",
    href: "/pro/system-design/building-blocks",
  },
  {
    q: "What are virtual nodes, and why do you need them?",
    href: "/pro/system-design/building-blocks",
  },
  {
    q: "What is a quorum? Why W + R > N? Why an ODD number of nodes?",
    href: "/pro/reliability/cap",
  },
  {
    q: "What is split-brain, and what prevents it?",
    href: "https://en.wikipedia.org/wiki/Split-brain_(computing)",
    label: "Wiki",
  },
  {
    q: "Explain Raft in 60 seconds.",
    href: "https://raft.github.io/",
    label: "Raft",
  },
  {
    q: "Why should you never order distributed events by wall-clock time?",
    href: "https://en.wikipedia.org/wiki/Clock_skew",
    label: "Skew",
  },
  {
    q: "What is idempotency, and which HTTP methods are idempotent?",
    href: "/pro/apis/rest",
  },
  {
    q: "Why is 'exactly-once delivery' a myth — and what do you do instead?",
    href: "/pro/caching/queues",
  },
  {
    q: "Queue vs stream (Kafka) — when do you need replay?",
    href: "/pro/caching/queues",
  },
  {
    q: "What is a dead-letter queue, and what problem does it solve?",
    href: "/pro/caching/queues",
  },
  {
    q: "What is the dual-write problem? What is the outbox pattern?",
    href: "/pro/reliability/data-ops",
  },
  {
    q: "What is a saga, and what is a compensating transaction?",
    href: "/pro/reliability/data-ops",
  },
  {
    q: "Why avoid two-phase commit?",
    href: "https://en.wikipedia.org/wiki/Two-phase_commit_protocol",
    label: "2PC",
  },
  {
    q: "Cache-aside vs write-through vs write-back — the trade-offs?",
    href: "/pro/caching/patterns",
  },
  {
    q: "Why DELETE the cache key on write instead of updating it?",
    href: "/pro/caching/patterns",
  },
  {
    q: "What are cache stampede, penetration, and avalanche?",
    href: "/pro/caching/patterns",
  },
  {
    q: "What is a circuit breaker? What are its three states?",
    href: "/pro/reliability/patterns",
  },
  { q: "Why must retries have jitter?", href: "/pro/reliability/patterns" },
  {
    q: "Liveness vs readiness probe — what breaks if you confuse them?",
    href: "/pro/devops/orchestration",
  },
  {
    q: "SLA vs SLO vs SLI. What is an error budget FOR?",
    href: "/pro/reliability/failure",
  },
  {
    q: "What is a Bloom filter? Can it produce a false negative?",
    href: "https://en.wikipedia.org/wiki/Bloom_filter",
    label: "Bloom",
  },
  {
    q: "Why is CORS not a security feature of your API?",
    href: "/pro/apis/robustness",
  },
];

const ESTIMATION: QuestionItem[] = [
  {
    q: "How many requests per second is 1M requests/day?",
    why: "1M ÷ 86,400 ≈ 12/s. Peak ≈ 2–10× that.",
    href: "/pro/system-design/estimation",
  },
  {
    q: "Estimate QPS for 100M DAU doing 10 actions/day.",
    why: "1B ÷ 86,400 ≈ 11.5k/s average; peak ~50–100k/s.",
    href: "/pro/system-design/estimation",
  },
  {
    q: "Storage for 500M tweets/day at 300 bytes, kept 5 years?",
    why: "500M × 300B × 365 × 5 ≈ 270 TB.",
    href: "/pro/system-design/estimation",
  },
  {
    q: "How many servers for 100k QPS?",
    why: "Assume per-server QPS (1–5k) → 20–100 boxes + headroom. STATE YOUR ASSUMPTION.",
    href: "/pro/system-design/estimation",
  },
  {
    q: "Memory to cache the hot 20% of 100M users?",
    why: "20M × ~1KB ≈ 20 GB → a few Redis nodes.",
    href: "/pro/caching/layers",
  },
  {
    q: "Bandwidth to stream video to 1M concurrent users at 5 Mbps?",
    why: "5 Tbps. This is precisely why CDNs exist.",
    href: "/pro/caching/layers",
  },
  {
    q: "Can this fit on one machine?",
    why: "Almost always yes below ~1TB and ~10k QPS. Saying so IS the senior answer.",
    href: "/pro/databases/scaling",
  },
  {
    q: "Latency budget for a page making 20 backend calls?",
    why: "If the page must be <1s, each call gets ~50ms — or they must run in parallel.",
    href: "/pro/performance/suspects",
  },
  {
    q: "How many database connections should the pool have?",
    why: "≈ 2 × cores → 10–30, not 300. Then multiply by instance count.",
    href: "/pro/databases/scaling",
  },
  {
    q: "How long to backfill 500M rows?",
    why: "Batches of ~10k, rate-limited to protect prod. Never one UPDATE.",
    href: "/pro/devops/migrations",
  },
  {
    q: "How big is the index on a 100M-row table?",
    why: "Roughly rows × key size × ~1.5. It must fit in RAM to stay fast.",
    href: "/pro/databases/indexes",
  },
  {
    q: "What read:write ratio makes caching worth it?",
    why: "Anything read-heavy. At 100:1, caching IS the design.",
    href: "/pro/caching/layers",
  },
];

const TRADEOFFS: QuestionItem[] = [
  {
    q: "SQL or NoSQL for this?",
    why: "“What's the access pattern?” Start with Postgres, and justify leaving it.",
    href: "/pro/databases/choosing",
  },
  {
    q: "Monolith or microservices?",
    why: "Start monolith. Microservices buy independent deploys, cost you distributed transactions.",
    href: "https://martinfowler.com/articles/microservices.html",
    label: "Fowler",
  },
  {
    q: "Strong or eventual consistency?",
    why: "PER FIELD. The balance is strong; the like-count is eventual.",
    href: "/pro/reliability/cap",
  },
  {
    q: "Fan-out on write or on read?",
    why: "Hybrid. Write for normal users, read for celebrities.",
    href: "/pro/system-design/worked-designs",
  },
  {
    q: "Sync or async?",
    why: "If the user doesn't need the result to continue → async, on a queue.",
    href: "/pro/caching/queues",
  },
  {
    q: "REST or gRPC?",
    why: "Public/browser → REST. Internal, high-volume, typed → gRPC.",
    href: "/pro/apis/beyond-rest",
  },
  {
    q: "REST or GraphQL?",
    why: "GraphQL for many clients with varied shapes — but you now own N+1 and caching.",
    href: "/pro/apis/beyond-rest",
  },
  {
    q: "Cache TTL or explicit invalidation?",
    why: "Both. Invalidate on write, and keep a TTL as the backstop for the bug you didn't foresee.",
    href: "/pro/caching/patterns",
  },
  {
    q: "Fail open or fail closed when Redis dies?",
    why: "Open for a normal API. Closed for login and payments. Saying which IS the answer.",
    href: "/pro/system-design/worked-designs",
  },
  {
    q: "Read replica or cache?",
    why: "Cache for hot repeated reads. Replica for broad read scaling. Both cost you staleness.",
    href: "/pro/databases/scaling",
  },
  {
    q: "Polling, SSE, or WebSockets?",
    why: "Poll if seconds are fine. SSE for one-way push. WebSockets only if truly bidirectional.",
    href: "/pro/apis/beyond-rest",
  },
  {
    q: "Shard now or later?",
    why: "Later. Index, fix N+1s, cache, replicate, partition — THEN shard.",
    href: "/pro/databases/scaling",
  },
  {
    q: "Build or buy?",
    why: "Buy — until the thing you'd buy becomes your core differentiator.",
    href: "/pro/system-design/method",
  },
];

export function QuestionBank() {
  return (
    <>
      <Callout tone="info" title="The question is never the question">
        Each one below says <b>what they're really testing</b>. Answer the
        surface question and you sound junior; answer the <i>real</i> one and
        you sound like you've run this in production. Every entry links to the
        page here that teaches it.
      </Callout>

      <Block title="A · The 35 classic “Design X” prompts">
        <Questions start={1} items={DESIGN_PROMPTS} />
      </Block>

      <Block title="B · 30 follow-up deep dives — where you're actually judged">
        <Note>
          These are the “okay, now what if…” questions that come after your
          first diagram. <b>This is the real interview.</b>
        </Note>
        <Questions start={36} items={DEEP_DIVES} />
      </Block>

      <Block title="C · 40 concept & terminology questions">
        <Note>
          Rapid-fire. If you can't answer in <b>two sentences</b>, you don't
          know it yet.
        </Note>
        <Questions start={66} items={CONCEPTS} />
      </Block>

      <Block title="D · 12 estimation questions">
        <Note>
          They want <b>orders of magnitude</b>, not decimals. Round 86,400 to
          “~100k” and move on.
        </Note>
        <Questions start={106} items={ESTIMATION} />
      </Block>

      <Block title="E · 13 trade-off questions">
        <Note>
          “It depends” is correct — but only if you then say{" "}
          <b>what it depends on</b>.
        </Note>
        <Questions start={118} items={TRADEOFFS} />
      </Block>

      <Learn
        links={[
          {
            label: "System Design Primer — worked solutions",
            href: "https://github.com/donnemartin/system-design-primer#system-design-interview-questions-with-solutions",
            note: "Pastebin, Twitter, a web crawler — with diagrams. Free.",
          },
          {
            label: "ByteByteGo (YouTube)",
            href: "https://www.youtube.com/@ByteByteGo",
            note: "Short walkthroughs of most of the prompts above.",
          },
          {
            label: "Jepsen analyses",
            href: "https://jepsen.io/analyses",
            note: "What databases actually guarantee, tested to destruction.",
          },
        ]}
      />
    </>
  );
}
