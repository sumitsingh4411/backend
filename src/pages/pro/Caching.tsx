import type { ProSection } from "../../lib/proTopics";
import {
  Block,
  Callout,
  Learn,
  MiniCard,
  Note,
  Numbers,
  RedFlags,
  RefTable,
  Rules,
  Snippet,
} from "../../components/ProKit";

/* ─────────────────────────── 01 · Caching layers ─────────────────────── */

function Layers() {
  return (
    <>
      <Block title="Caching is buying speed with staleness">
        <Callout
          tone="info"
          title="The only two hard problems, and you own both"
        >
          A cache trades <b>freshness for latency</b>. Every cache can serve
          data that's <i>wrong</i> (stale), and every cache entry has to be
          removed at the right moment (invalidation). Phil Karlton's line —
          “there are only two hard things: cache invalidation and naming things”
          — is a warning, not a joke. Cache the things where a few seconds of
          stale is fine, and think hard before caching anything else.
        </Callout>
        <Numbers
          wide
          items={[
            ["~0.1ms", "in-process memory"],
            ["~1ms", "Redis, same DC"],
            ["~10ms", "Postgres, indexed"],
            ["10–50ms", "S3 / object store"],
            [">90%", "hit rate worth having"],
            ["100:1", "read:write that makes caching pay"],
          ]}
        />
      </Block>

      <Block title="The layers, cheapest first">
        <RefTable
          head={["Layer", "Caches", "Watch out for"]}
          rows={[
            [
              "Browser / HTTP",
              "static assets, GET responses",
              "Cache-Control + ETag do the work",
            ],
            [
              "CDN",
              "assets + cacheable API reads, near the user",
              "cache key, and how you purge",
            ],
            [
              "In-process (LRU map)",
              "hot config, tiny lookups",
              "each instance has its own → inconsistency",
            ],
            [
              "Redis / Memcached",
              "shared app cache, sessions, counters",
              "the network hop, and eviction",
            ],
            [
              "Database / materialized views",
              "precomputed heavy queries",
              "refresh cost",
            ],
          ]}
        />
        <Note>
          The fastest cache is the one you never call. Reach for HTTP and CDN
          caching <b>before</b> a shared Redis — a request answered at the edge
          never touches your servers at all. In-process caches are fastest of
          all but drift between instances; keep those to data that's fine to be
          a little inconsistent.
        </Note>
      </Block>

      <Block title="HTTP caching for free">
        <Rules
          items={[
            <>
              <code>Cache-Control: max-age=…</code> tells the browser and CDN
              how long they may reuse a response without asking. Immutable
              assets (hashed filenames) get a year; API reads get seconds.
            </>,
            <>
              <b>ETag / If-None-Match:</b> the server sends a content hash; next
              time the client sends it back, and you answer{" "}
              <code>304 Not Modified</code> with an empty body — saving the
              bandwidth, not the round trip.
            </>,
            <>
              <code>stale-while-revalidate</code> serves the slightly-stale copy{" "}
              <i>instantly</i> and refreshes it in the background — the best
              latency/freshness trade on the web.
            </>,
          ]}
        />
      </Block>

      <Learn
        links={[
          {
            label: "MDN: HTTP caching",
            href: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching",
            note: "Cache-Control, ETag, and the whole freshness model.",
          },
          {
            label: "Redis in 30 minutes (official)",
            href: "https://redis.io/learn/howtos/quick-start",
            note: "Hands-on with the data types you'll actually use.",
          },
          {
            label: "Latency numbers every programmer should know",
            href: "https://gist.github.com/jboner/2841832",
            note: "The orders of magnitude that make caching worth it.",
          },
        ]}
      />

      <RedFlags
        items={[
          "Caching data that must be exactly correct (balances, permissions)",
          "In-process caches where instances must agree",
          "No Cache-Control / ETag on static assets",
          "A CDN you can't purge on demand",
        ]}
      />
    </>
  );
}

/* ─────────────────────────── 02 · Patterns & failure ─────────────────── */

function Patterns() {
  return (
    <>
      <Block title="Cache-aside — the pattern you'll use 90% of the time">
        <Snippet
          lang="javascript"
          code={`async function getUser(id) {
  const key = \`user:\${id}\`;

  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);          // hit

  const user = await db.users.find(id);           // miss → source of truth
  await redis.set(key, JSON.stringify(user), "EX", 300);  // TTL 5 min
  return user;
}

// On write, INVALIDATE (don't try to update the cache):
async function updateUser(id, data) {
  const user = await db.users.update(id, data);
  await redis.del(\`user:\${id}\`);                  // next read repopulates
  return user;
}`}
        />
        <Callout tone="warn" title="Delete on write. Don't update.">
          Updating both the database and the cache is two writes that can
          interleave: two concurrent updates can leave the cache holding the{" "}
          <i>older</i> value permanently. <b>Deleting</b> the key sidesteps the
          whole race — the next read simply refills it from the source of truth.
          And <b>always set a TTL</b>, even with perfect invalidation: it's the
          backstop for the bug you didn't foresee.
        </Callout>
      </Block>

      <Block title="Write-through vs write-back">
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniCard label="Write-through">
            Write to cache and database together, synchronously. Cache is always
            fresh; writes are a touch slower. Simple and safe.
          </MiniCard>
          <MiniCard label="Write-back">
            Write to cache now, flush to the database later. <b>Fast</b>, and{" "}
            <b>dangerous</b> — a crash before the flush loses data. Only for
            data you can afford to lose (view counts, not orders).
          </MiniCard>
        </div>
      </Block>

      <Block title="🚨 The three ways a cache takes down your database">
        <RefTable
          head={["Failure", "What happens", "Fix"]}
          rows={[
            [
              "Stampede / dogpile",
              "a hot key expires; 10,000 requests all miss and hit the DB at once",
              "lock so ONE rebuilds; or refresh early in the background",
            ],
            [
              "Penetration",
              "requests for keys that don't exist skip the cache every time (often an attack)",
              "cache the negative result (a short-TTL 'null')",
            ],
            [
              "Avalanche",
              "many keys share one expiry and all die together",
              "add random jitter to every TTL",
            ],
          ]}
        />
        <Callout tone="bad" title="The stampede is the one that pages you">
          One popular product's cache entry expires. In the same millisecond,
          10,000 in-flight requests all miss, and all 10,000 run the same
          expensive query against the database <i>simultaneously</i>. The
          database falls over, every request slows, more pile up. The fix is a{" "}
          <b>lock</b> (or “single-flight”): the first miss rebuilds the value
          while everyone else waits for it — or you refresh the key a little{" "}
          <i>before</i> it expires so it never goes cold.
        </Callout>
      </Block>

      <Learn
        links={[
          {
            label: "AWS: caching best practices",
            href: "https://aws.amazon.com/caching/best-practices/",
            note: "Cache-aside, TTLs, and the failure modes, vendor-neutral enough to keep.",
          },
          {
            label: "Redis: cache patterns",
            href: "https://redis.io/learn/howtos/solutions/microservices/caching",
            note: "Cache-aside and write-through with real Redis commands.",
          },
          {
            label: "Cache stampede (Wikipedia)",
            href: "https://en.wikipedia.org/wiki/Cache_stampede",
            note: "Locking and probabilistic early expiration, explained.",
          },
        ]}
      />

      <RedFlags
        items={[
          "Updating the cache on write instead of deleting the key",
          "No TTL as a backstop",
          "No stampede protection on hot keys",
          "Not caching negative results → cache penetration",
          "Every key sharing one expiry time",
        ]}
      />
    </>
  );
}

/* ─────────────────────────── 03 · Redis in practice ───────────────────── */

function RedisInPractice() {
  return (
    <>
      <Block title="Redis is a data-structure server, not just a cache">
        <RefTable
          head={["Structure", "Great for"]}
          rows={[
            [
              "String / counter",
              "cache values, atomic INCR for rate limits & counts",
            ],
            ["Hash", "an object's fields without serialising the whole thing"],
            [
              "Sorted set (ZSET)",
              "leaderboards, time-ordered feeds, priority queues",
            ],
            ["Set", "unique membership, tags, 'has this user seen X?'"],
            ["List", "simple queues, recent-N buffers"],
            ["Stream", "durable event log with consumer groups (a mini-Kafka)"],
            ["HyperLogLog", "approximate unique counts in ~12KB for millions"],
          ]}
        />
        <Note>
          Redis is <b>single-threaded</b> for commands, which is <i>why</i>{" "}
          <code>INCR</code> and friends are atomic — there's no interleaving. It
          also means <b>one slow command blocks everything</b>: never run{" "}
          <code>KEYS *</code> in production (use <code>SCAN</code>), and never
          <code>ZRANGE</code> a million-element set on the hot path.
        </Note>
      </Block>

      <Block title="Atomicity: the reason a cache becomes a race fixer">
        <Snippet
          lang="text"
          code={`-- ❌ read-then-write: two clients both read 99, both allow request #100
GET  rate:user:42        → 99
if < 100: SET rate:user:42 100

-- ✅ one atomic op: the increment IS the check
INCR rate:user:42        → 100   (returns the new value)
EXPIRE rate:user:42 60   (first time only)
-- for multi-step logic, wrap it in a Lua script so it runs indivisibly`}
        />
        <Callout tone="warn" title="A Lua script is Redis's transaction">
          When your logic is “read, decide, write”, do it in a <b>Lua script</b>{" "}
          (or a <code>MULTI/EXEC</code> transaction). Redis runs the whole
          script without interleaving, which turns a check-then-act race into a
          single atomic step — this is how correct rate limiters and distributed
          locks are built.
        </Callout>
      </Block>

      <Block title="Operating Redis without surprises">
        <Rules
          items={[
            <>
              <b>Set an eviction policy.</b> As a cache, use{" "}
              <code>allkeys-lru</code> so Redis drops cold keys when full. As a
              queue or a source of truth, use <code>noeviction</code> — silently
              evicting jobs is a disaster.
            </>,
            <>
              <b>Decide if you can lose it.</b> Pure cache → persistence off,
              rebuild on restart. Sessions/queues → enable <b>AOF</b> and
              replication. Know which mode you're in.
            </>,
            <>
              <b>Namespace your keys</b> (<code>user:42:profile</code>) and give
              everything a TTL. An unbounded key with no expiry is a slow memory
              leak that ends in an OOM at 3am.
            </>,
            <>
              <b>Watch memory and the hit rate.</b> A hit rate under ~80% means
              the cache is barely helping; memory near <code>maxmemory</code>{" "}
              means eviction is about to start hurting.
            </>,
          ]}
        />
      </Block>

      <Learn
        links={[
          {
            label: "Redis data types tutorial",
            href: "https://redis.io/docs/latest/develop/data-types/",
            note: "Every structure with the commands and when to use it.",
          },
          {
            label: "Redis: keyspace & eviction",
            href: "https://redis.io/docs/latest/develop/reference/eviction/",
            note: "The policies that decide what gets dropped when memory fills.",
          },
          {
            label: "Redis Lua scripting",
            href: "https://redis.io/docs/latest/develop/interact/programmability/eval-intro/",
            note: "How to make multi-step operations atomic.",
          },
        ]}
      />

      <RedFlags
        items={[
          "KEYS * on a production instance",
          "read-then-write where INCR or a Lua script belongs",
          "allkeys-lru eviction on a Redis used as a queue",
          "Keys with no TTL and no namespace",
          "Treating Redis as durable with persistence turned off",
        ]}
      />
    </>
  );
}

/* ─────────────────────────── 04 · Queues & jobs ───────────────────────── */

function Queues() {
  return (
    <>
      <Block title="Why a queue exists: respond now, work later">
        <Callout
          tone="info"
          title="The user should never wait on work they don't need to see"
        >
          Signup fires a welcome email, thumbnails, an analytics event, a CRM
          sync. Do all that inline and the request takes 4 seconds and fails if
          any downstream is down. <b>Put a job on a queue and return in 50ms</b>
          ; a worker handles the rest. Queues also <b>absorb spikes</b> — a
          flood of work piles up in the queue instead of knocking the service
          over.
        </Callout>
        <RefTable
          head={["You want", "Reach for"]}
          rows={[
            [
              "Simple background jobs",
              "Redis-backed (BullMQ, Sidekiq, Celery)",
            ],
            ["Reliable work queue, many consumers", "RabbitMQ / SQS"],
            ["Event stream, replayable, many readers", "Kafka / Redpanda"],
            ["Fan-out to N subscribers", "pub/sub (Redis, NATS, SNS)"],
          ]}
        />
      </Block>

      <Block title="Queue vs stream — a real distinction">
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniCard label="Queue (work distribution)">
            Each message goes to <b>one</b> worker; once handled, it's gone. “Do
            this task.” Scale by adding workers that share the load.
          </MiniCard>
          <MiniCard label="Stream / log (event distribution)">
            Each message is read by <b>every</b> consumer group, and stays in
            the log to be <b>replayed</b>. “This happened.” New consumers can
            read history from the start.
          </MiniCard>
        </div>
        <Note>
          Getting this wrong is a classic mistake: use a stream when several
          independent services each need to react to the same event, and a queue
          when one pool of workers shares out tasks. A queue can't replay; a
          stream doesn't delete on read.
        </Note>
      </Block>

      <Block title="🚨 At-least-once means duplicates. Make jobs idempotent.">
        <Callout tone="bad" title="Almost every queue delivers at LEAST once">
          A worker pulls a job, does the work, then crashes <i>before</i>{" "}
          acknowledging it. The queue, seeing no ack, redelivers it — so it runs
          again. If that job charged a card, you just charged it twice.{" "}
          <b>Design every job to be safe to run more than once.</b>
        </Callout>
        <Rules
          items={[
            <>
              <b>Idempotency:</b> key the work on a job id and record “job 123
              done”. On redelivery, see it's done and skip. Or make the
              operation naturally idempotent (upsert, not insert).
            </>,
            <>
              <b>Ack after the work, never before.</b> Ack-then-process loses
              the job on a crash. Process-then-ack risks a duplicate — the safe
              direction, which idempotency then absorbs.
            </>,
            <>
              <b>Retry with backoff + jitter</b>, and cap the attempts. A job
              that retries instantly and forever is a self-inflicted DDoS on
              whatever it depends on.
            </>,
            <>
              <b>Dead-letter queue.</b> After N failures, move the job aside so
              it stops blocking the line — then alert a human. A poison message
              that retries forever stalls the whole queue.
            </>,
            <>
              <b>Keep jobs small and re-runnable.</b> “Send email #5”, not “send
              emails 1–1000” — a crash at 700 shouldn't resend the first 700.
            </>,
          ]}
        />
      </Block>

      <Block title="🚨 The scheduled-job trap on multiple instances">
        <Callout tone="bad" title="Your daily email just went out 20 times">
          You run a nightly job with a cron in your app. In production the app
          runs on <b>20 instances</b> — so the cron fires on <i>all twenty</i>,
          and every customer gets the newsletter twenty times.
          <br />
          <b>Fix:</b> a distributed lock (<code>SET lock NX EX 3600</code> in
          Redis) so exactly one instance wins the job; or a real scheduler
          (Kubernetes CronJob, a dedicated scheduler service) that runs the task{" "}
          <b>once</b>, off to the side, rather than inside every app process.
        </Callout>
      </Block>

      <Learn
        links={[
          {
            label: "Enterprise Integration Patterns",
            href: "https://www.enterpriseintegrationpatterns.com/patterns/messaging/",
            note: "The vocabulary of queues, DLQs, and idempotency — still the reference.",
          },
          {
            label: "Kafka: introduction",
            href: "https://kafka.apache.org/documentation/#introduction",
            note: "The log model, consumer groups, and replay.",
          },
          {
            label: "AWS SQS developer guide",
            href: "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html",
            note: "Visibility timeout, DLQs, at-least-once — the practical mechanics.",
          },
        ]}
      />

      <RedFlags
        items={[
          "A job that isn't safe to run twice (at-least-once delivery)",
          "Acknowledging a message before the work is done",
          "Retries with no backoff, jitter, or attempt cap",
          "No dead-letter queue → one poison message stalls everything",
          "A cron inside an app that runs on many instances",
        ]}
      />
    </>
  );
}

export const cachingSections: ProSection[] = [
  {
    id: "layers",
    title: "Caching layers",
    icon: "🧊",
    kicker:
      "Where to cache, cheapest first — browser, CDN, in-process, Redis — and free HTTP caching.",
    minutes: 6,
    Content: Layers,
  },
  {
    id: "patterns",
    title: "Patterns & failure modes",
    icon: "♻️",
    kicker:
      "Cache-aside, why you delete on write, and the three ways a cache takes down your database.",
    minutes: 7,
    Content: Patterns,
  },
  {
    id: "redis",
    title: "Redis in practice",
    icon: "🟥",
    kicker:
      "The data structures, why single-threaded means atomic, Lua scripts, and operating it safely.",
    minutes: 7,
    Content: RedisInPractice,
  },
  {
    id: "queues",
    title: "Queues & background jobs",
    icon: "📮",
    kicker:
      "Respond-now-work-later, queue vs stream, at-least-once duplicates, and the multi-instance cron trap.",
    minutes: 8,
    Content: Queues,
  },
];
