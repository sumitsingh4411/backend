import type { ProSection } from "../../lib/proTopics";
import {
  Block,
  Callout,
  Ladder,
  Learn,
  MiniCard,
  Note,
  Numbers,
  RedFlags,
  RefTable,
  Rules,
  Snippet,
} from "../../components/ProKit";

/* ─────────────────────────── 01 · The method ─────────────────────────── */

function Method() {
  return (
    <>
      <Block title="The method — works for any prompt">
        <Ladder
          ordered
          steps={[
            [
              "Clarify",
              "functional + non-functional. Read:write ratio, scale, consistency, latency budget",
            ],
            [
              "Estimate",
              "back-of-envelope → let the numbers reveal the REAL problem",
            ],
            ["API", "define the endpoints / the contract"],
            [
              "Data model",
              "entities, and the access patterns that drive storage choice",
            ],
            [
              "High-level design",
              "boxes and arrows: client → LB → service → store",
            ],
            [
              "Core algorithm",
              "the one genuinely hard part (unique IDs, ranking, dedupe)",
            ],
            [
              "Bottleneck & scale",
              "optimise the dominant cost, then scale it out",
            ],
          ]}
        />
        <Callout
          tone="info"
          title="What the interviewer is actually listening for"
        >
          Not the “right” answer — <b>your reasoning</b>. Say the trade-off out
          loud: “reads dominate 100:1, <i>so</i> I'll cache aggressively”, “this
          must not double-charge, <i>so</i> idempotency keys”, “a stale like
          count is fine, <i>so</i> eventual consistency here.”{" "}
          <b>The 'so' is the job.</b> The same habit makes you a better engineer
          in real work, where nobody hands you the requirements either.
        </Callout>
      </Block>

      <Block title="Clarify before you draw a single box">
        <Rules
          items={[
            <>
              <b>Functional:</b> what must it <i>do</i>? Nail the top 2–3
              features and ignore the rest — “post and read tweets”, not “also
              DMs, ads, and trends”. Scope is a choice you make out loud.
            </>,
            <>
              <b>Non-functional:</b> how many users, read:write ratio, latency
              budget, consistency needs, availability target.{" "}
              <b>These decide the architecture</b> far more than the features
              do.
            </>,
            <>
              <b>Restate it back.</b> “So: 100M daily users, read-heavy, feeds
              can be a few seconds stale, must not lose a post — right?” Now
              you're designing the correct system, not a plausible one.
            </>,
          ]}
        />
      </Block>

      <Learn
        links={[
          {
            label: "System Design Primer",
            href: "https://github.com/donnemartin/system-design-primer",
            note: "The most complete free resource. Start here and keep it open.",
          },
          {
            label: "ByteByteGo (Alex Xu)",
            href: "https://bytebytego.com/",
            note: "Clear diagrams and the classic problems worked through.",
          },
          {
            label: "Designing Data-Intensive Applications",
            href: "https://dataintensive.net/",
            note: "The theory underneath every design on this shelf.",
          },
        ]}
      />

      <RedFlags
        items={[
          "Jumping to a solution before clarifying requirements",
          "Designing every feature instead of the top two or three",
          "Not restating the problem — solving the wrong one confidently",
        ]}
      />
    </>
  );
}

/* ─────────────────────────── 02 · Estimation ─────────────────────────── */

function Estimation() {
  return (
    <>
      <Block title="Back-of-envelope, fast">
        <div className="grid gap-3 sm:grid-cols-3">
          <MiniCard label="Traffic">
            DAU × actions/day ÷ 86,400 ≈ <b>avg req/s</b>. Peak ≈ <b>2–10×</b>{" "}
            average.
          </MiniCard>
          <MiniCard label="Storage">
            items/day × bytes × retention. <b>Round hard</b> — you want orders
            of magnitude, not decimals.
          </MiniCard>
          <MiniCard label="The tell">
            A <b>100:1 read:write</b> ratio means the design is{" "}
            <b>about reads</b> → do the expensive work at <i>write</i> time and
            cache.
          </MiniCard>
        </div>
        <Numbers
          wide
          items={[
            ["86,400", "seconds/day"],
            ["1M/day", "≈ 12 req/s"],
            ["2–10×", "peak multiplier"],
            ["~500B", "a typical row"],
            ["0.5ms", "same-DC round trip"],
            ["150ms", "cross-continent"],
          ]}
        />
      </Block>

      <Block title="A worked estimate — Twitter-scale feed">
        <Snippet
          lang="text"
          code={`Assume: 200M daily users, each reads the feed 10×/day,
        each posts 0.1×/day (reads ≫ writes).

Reads:  200M × 10 = 2B reads/day  ÷ 86,400 ≈ 23,000 req/s  (peak ~5× → 115k)
Writes: 200M × 0.1 = 20M posts/day ÷ 86,400 ≈    230 req/s

Ratio: ~100:1 read:write.
  → THE DESIGN IS ABOUT READS. Precompute feeds at WRITE time; cache hard.

Storage: 20M posts/day × 300 bytes × 365 × 5yr ≈ 11 TB of post text.
  → Fits comfortably; the hard part is fan-out and read latency, not size.`}
        />
        <Callout tone="info" title="The estimate tells you what the problem IS">
          You didn't do this arithmetic for the number — you did it to discover
          that this is a <b>read-scaling</b> problem, not a storage one. That
          one finding dictates every later decision. <b>Round aggressively:</b>{" "}
          86,400 is “~100k”, and nobody expects three significant figures.
        </Callout>
      </Block>

      <Learn
        links={[
          {
            label: "Latency numbers every programmer should know",
            href: "https://gist.github.com/jboner/2841832",
            note: "The constants your estimates are built from.",
          },
          {
            label: "Google's 'powers of two' estimation talk",
            href: "https://www.youtube.com/watch?v=modXC5IWTJI",
            note: "How to do capacity math on a whiteboard, fast.",
          },
        ]}
      />

      <RedFlags
        items={[
          "Skipping estimation — the numbers tell you what to build",
          "Chasing precision instead of orders of magnitude",
          "Missing the read:write ratio — it decides the whole design",
        ]}
      />
    </>
  );
}

/* ─────────────────────────── 03 · Building blocks ────────────────────── */

function BuildingBlocks() {
  return (
    <>
      <Block title="Reach for these — and know what each buys you">
        <RefTable
          head={["Block", "Buys you"]}
          rows={[
            [
              "Load balancer",
              "spread traffic, health-check out dead servers, TLS termination",
            ],
            [
              "Cache (Redis)",
              "kill read latency — power-law traffic makes it enormously effective",
            ],
            [
              "Queue / pub-sub",
              "respond fast now, do slow work later; absorb spikes",
            ],
            ["CDN", "static assets + content physically close to users"],
            ["Read replicas", "scale reads (mind replication lag)"],
            [
              "Sharding",
              "scale writes & data size — needs a high-cardinality key",
            ],
            ["Object storage (S3)", "files/uploads — never the local disk"],
            [
              "Full-text index (Elastic)",
              "search — beside the source of truth, not instead of it",
            ],
          ]}
        />
        <Note>
          The prerequisite for all of it: <b>stateless app servers</b>. Push
          sessions to Redis/JWT, files to S3, cache to Redis, jobs to a queue.{" "}
          <i>Can I kill any server at random and lose nothing?</i> If yes, you
          can scale horizontally — just add more boxes behind the load balancer.
        </Note>
      </Block>

      <Block title="Consistent hashing — why `hash % N` is a trap">
        <Callout
          tone="bad"
          title="Adding one cache server can take down your database"
        >
          With <code>hash(key) % N</code>, changing N from 4 → 5 remaps{" "}
          <b>~80% of keys</b>. Every one is now a <b>cache miss</b>, and 80% of
          traffic slams the database at once —{" "}
          <i>while you were trying to relieve load</i>.
          <br />
          <b>Consistent hashing</b> puts servers and keys on a <b>ring</b>; a
          key belongs to the first server clockwise. Adding/removing a server
          moves only <b>~1/N of keys</b>. Use <b>virtual nodes</b> (100–200
          points per server) so load spreads evenly and a dead server's keys are
          inherited by <i>many</i> survivors, not one.
        </Callout>
      </Block>

      <Block title="The trade-offs you must voice">
        <div className="grid gap-3 sm:grid-cols-2">
          <Callout tone="info" title="Consistency">
            Partitions are unavoidable, so the real choice is <b>C vs A</b> when
            the network splits. Money & inventory → <b>strong (CP)</b>. Feeds &
            counts → <b>eventual (AP)</b>. Choose <b>per field</b>.
          </Callout>
          <Callout tone="good" title="Idempotency">
            Retries are inevitable (timeouts, at-least-once queues). Make writes
            safe to repeat: <b>idempotency key</b>, a unique constraint, or a
            conditional update. <b>POST is the dangerous method.</b>
          </Callout>
          <Callout tone="warn" title="Read-heavy vs write-heavy">
            Read-heavy → <b>cache + replicas + fan-out-on-write</b>. Write-heavy
            → <b>queue + shard + LSM store</b>.
          </Callout>
          <Callout tone="bad" title="Rate limiting">
            <b>Token bucket</b> (allows natural bursts). Counters in{" "}
            <b>Redis</b> with an <b>atomic</b> Lua script — a read-then-write is
            a race. Return <b>429 + Retry-After</b>.
          </Callout>
        </div>
      </Block>

      <Learn
        links={[
          {
            label: "Consistent hashing explained",
            href: "https://www.toptal.com/big-data/consistent-hashing",
            note: "The ring, virtual nodes, and why % N hurts — with pictures.",
          },
          {
            label: "The System Design Primer: index",
            href: "https://github.com/donnemartin/system-design-primer#index-of-system-design-topics",
            note: "A block-by-block reference for load balancers, caches, sharding.",
          },
        ]}
      />

      <RedFlags
        items={[
          "Stateful app servers (sessions/files in local memory)",
          "hash(key) % N for cache or shard placement",
          "Sharding as a first resort",
          "No idempotency story for POST / payments",
        ]}
      />
    </>
  );
}

/* ─────────────────────────── 04 · Worked designs ─────────────────────── */

function WorkedDesigns() {
  return (
    <>
      <Block title="Design: URL shortener">
        <Rules
          items={[
            <>
              <b>The insight:</b> writes are tiny, reads are 100×.{" "}
              <b>Optimise reads</b> → cache in front of a key-value store.
            </>,
            <>
              <b>The core algorithm:</b> take a globally unique id and{" "}
              <b>Base62-encode</b> it (<code>a-zA-Z0-9</code>).{" "}
              <b>Collisions become structurally impossible</b> — no
              check-and-retry on every write. <code>62^7 ≈ 3.5 trillion</code>{" "}
              codes.
            </>,
            <>
              ⚠️ Sequential ids are <b>guessable</b> — scramble/hash before
              encoding. Get unique ids at scale from <b>Snowflake</b> or
              pre-allocated ranges per server (no coordination on the hot path).
            </>,
            <>
              <b>302, not 301</b> — a permanent redirect gets cached by the
              browser and <b>you lose click analytics</b> (usually the business
              model).
            </>,
            <>
              Count clicks <b>asynchronously</b> via a queue — never make the
              user's redirect wait on an analytics write.
            </>,
          ]}
        />
      </Block>

      <Block title="Design: news feed (the celebrity problem)">
        <Callout tone="bad" title="Where the naive design breaks">
          <b>Fan-out on write</b> (push each new post into every follower's
          precomputed feed) makes reads O(1) — perfect, since reads dominate
          100:1.
          <br />
          Then a user with <b>50 million followers</b> posts →{" "}
          <b>50,000,000 writes for one post</b>. It takes minutes, saturates
          your write path, and delays everyone else. This is{" "}
          <b>write amplification</b>.
        </Callout>
        <Callout
          tone="good"
          title="✅ The hybrid — the answer they're listening for"
        >
          <b>Normal users → fan-out on WRITE</b> (precomputed into followers'
          feeds).
          <br />
          <b>Celebrities → fan-out on READ</b> (not pushed anywhere).
          <br />
          <b>Merge at read time.</b> A celebrity's post is written <b>once</b>,
          and since a user follows only a handful of celebrities, the pull half
          is small — and its results are <b>shared by millions</b>, so cache
          them hard. You get push's fast reads <i>and</i> pull's cheap writes.
        </Callout>
        <Note>
          Store <b>post ids</b> (not content) in capped Redis lists; hydrate
          from a shared post cache. Skip <b>inactive users</b> (~60% of
          accounts) — instantly halves write volume. Paginate with a{" "}
          <b>cursor</b> (the feed shifts constantly). <b>Delete lazily</b> at
          read time — never hunt an id through 50M lists.
        </Note>
      </Block>

      <Block title="Design: chat system">
        <Rules
          items={[
            <>
              Needs <b>server push</b> → <b>WebSockets</b>. This makes
              connections <b>stateful</b> — the crux of the whole design.
            </>,
            <>
              <b>The problem:</b> Alice is on server-1, Bob on server-3.
              Server-1 can't reach Bob's socket directly.
            </>,
            <>
              <b>The fix:</b> a <b>pub/sub backbone</b> (Redis/Kafka). Server-1
              publishes to <code>user:bob</code>; server-3 — subscribed since
              Bob connected — pushes it down his socket. Servers stay ignorant
              of each other; direct server-to-server would be O(n²) and brittle.
            </>,
            <>
              A <b>presence registry</b> (<code>user → server</code>, in Redis)
              powers “online” <i>and</i> tells you when to fall back to a{" "}
              <b>push notification</b>.
            </>,
            <>
              <b>Persist BEFORE you acknowledge.</b> Ack first and crash → the
              message is gone while Alice believes it sent.
            </>,
            <>
              Order by a <b>monotonic sequence / Snowflake id</b>, never
              wall-clock timestamps — server clocks drift.
            </>,
          ]}
        />
      </Block>

      <Block title="Design: rate limiter">
        <Snippet
          lang="text"
          code={`Token bucket:  capacity 10, refill 1/sec

  ▸ idle a while      → bucket fills to 10
  ▸ burst of 10       → all allowed instantly (spends the savings)
  ▸ after that        → ~1/sec as it refills

Why it wins: allows the SHORT NATURAL BURSTS real users create,
while enforcing a steady average. O(1) memory: {tokens, last_refill}.`}
        />
        <Callout tone="bad" title="The naive version is a race condition">
          <code>GET count → if ok → SET count+1</code> — two servers both read
          “99” and <b>both pass</b>. Check-then-act isn't atomic.
          <br />
          Fix: a <b>Redis Lua script</b> (refill + consume in one atomic step).
          Redis is also what makes the limit <b>global</b> — an in-memory
          counter silently multiplies your limit by the number of servers.
          <br />
          <b>Decide fail-open vs fail-closed</b> if Redis dies: fail <i>open</i>{" "}
          for a normal API (a cache outage shouldn't kill the site), fail{" "}
          <i>closed</i> for login/payments.{" "}
          <b>Saying which, and why, is the answer.</b>
        </Callout>
      </Block>

      <Learn
        links={[
          {
            label: "System Design Primer: worked examples",
            href: "https://github.com/donnemartin/system-design-primer#system-design-interview-questions-with-solutions",
            note: "Pastebin, Twitter, a web crawler — solutions with diagrams.",
          },
          {
            label: "ByteByteGo YouTube",
            href: "https://www.youtube.com/@ByteByteGo",
            note: "Short, sharp walkthroughs of exactly these designs.",
          },
          {
            label: "High Scalability — real architectures",
            href: "http://highscalability.com/",
            note: "How real companies actually built it. The best sanity check.",
          },
        ]}
      />

      <RedFlags
        items={[
          "301 (cached) redirects on a link shortener → lost analytics",
          "Fan-out on write with no celebrity exception",
          "Chat servers talking directly to each other (O(n²))",
          "Acknowledging a message before persisting it",
          "A rate limiter that reads-then-writes instead of one atomic op",
        ]}
      />
    </>
  );
}

export const systemDesignSections: ProSection[] = [
  {
    id: "method",
    title: "The method",
    icon: "🗺️",
    kicker:
      "The seven steps, and why the interviewer cares about your 'so' more than your answer.",
    minutes: 6,
    Content: Method,
  },
  {
    id: "estimation",
    title: "Back-of-envelope estimation",
    icon: "🧮",
    kicker:
      "The numbers to know, and a worked estimate that reveals the real problem.",
    minutes: 5,
    Content: Estimation,
  },
  {
    id: "building-blocks",
    title: "Building blocks & trade-offs",
    icon: "🧩",
    kicker:
      "Load balancers to sharding, consistent hashing, and the trade-offs you must say out loud.",
    minutes: 7,
    Content: BuildingBlocks,
  },
  {
    id: "worked-designs",
    title: "Classic designs, worked",
    icon: "✍️",
    kicker:
      "URL shortener, the news-feed celebrity problem, chat, and a rate limiter — end to end.",
    minutes: 9,
    Content: WorkedDesigns,
  },
];
