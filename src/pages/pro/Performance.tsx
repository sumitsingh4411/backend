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
  VS,
} from "../../components/ProKit";

/* ─────────────────────────── 01 · Measure first ──────────────────────── */

function Measure() {
  return (
    <>
      <Block title="The one rule: measure before you touch anything">
        <Callout tone="bad" title="Your intuition about what's slow is wrong">
          Every experienced engineer has spent a day optimising a function that
          turned out to be 0.1% of the request, while the real cost — a missing
          index, an N+1, a synchronous call to a slow API — sat untouched.{" "}
          <b>
            Profile first. Optimise the thing the profiler points at. Measure
            again.
          </b>{" "}
          Guessing is how you make code uglier and no faster.
        </Callout>
        <Ladder
          ordered
          steps={[
            [
              "Measure",
              "profiler, traces, real percentiles — find the actual cost",
            ],
            [
              "Find the dominant cost",
              "Amdahl's law: 90% of the time is in one place",
            ],
            ["Fix that one thing", "and nothing else yet"],
            ["Measure again", "confirm it moved; find the new bottleneck"],
            [
              "Stop",
              "when it's fast enough. 'Fast enough' is a real, valid answer.",
            ],
          ]}
        />
      </Block>

      <Block title="p95/p99 — the average is a liar">
        <Callout tone="warn" title="Nobody experiences the average">
          Mean latency 50ms sounds great — but if p99 is 4 seconds, then{" "}
          <b>1 in 100 requests</b> is awful. A user loading a page that makes 20
          calls hits that p99 on nearly <i>every</i> page load. Averages hide
          your worst experiences; percentiles expose them.{" "}
          <b>Always report p50 / p95 / p99, never the mean.</b>
        </Callout>
        <Numbers
          wide
          items={[
            ["p50", "the typical user"],
            ["p95", "your slowest 1 in 20"],
            ["p99", "the tail that pages you"],
            ["<100ms", "feels instant"],
            ["<1s", "feels responsive"],
            [">3s", "users leave"],
          ]}
        />
        <Note>
          The tail is usually a <i>different cause</i> than the median: a cold
          cache, a GC pause, a lock, a slow replica, a retry. That's why you
          can't fix p99 by making the median faster — go find what the slow
          requests have in common.
        </Note>
      </Block>

      <Block title="Know your latency numbers">
        <Numbers
          wide
          items={[
            ["0.1ms", "memory read"],
            ["1ms", "Redis / SSD"],
            ["10ms", "indexed DB query"],
            ["50ms", "same-region API"],
            ["150ms", "cross-continent"],
            ["Never", "the DB call in a loop"],
          ]}
        />
        <Note>
          Internalise these and you can estimate a design's latency on a
          whiteboard before writing a line. A request that makes 30 sequential
          10ms database calls <i>cannot</i> be faster than 300ms — the fix isn't
          faster queries, it's <b>fewer round trips</b>.
        </Note>
      </Block>

      <Learn
        links={[
          {
            label: "Latency numbers every programmer should know",
            href: "https://gist.github.com/jboner/2841832",
            note: "The table to memorise. Everything downstream comes from it.",
          },
          {
            label: "Brendan Gregg — Systems Performance",
            href: "https://www.brendangregg.com/systems-performance-2nd-edition-book.html",
            note: "The definitive book on measuring and reasoning about performance.",
          },
          {
            label: "How NOT to measure latency (Gil Tene)",
            href: "https://www.youtube.com/watch?v=lJ8ydIuPFeU",
            note: "Why your percentiles are probably lying — 'coordinated omission'.",
          },
        ]}
      />

      <RedFlags
        items={[
          "Optimising without a profile",
          "Reporting mean latency instead of percentiles",
          "Sequential round trips that could run in parallel",
          "Declaring victory without a second measurement",
        ]}
      />
    </>
  );
}

/* ─────────────────────────── 02 · The usual suspects ─────────────────── */

function Suspects() {
  return (
    <>
      <Block title="Ranked by how often it's actually the problem">
        <RefTable
          head={["#", "Suspect", "Tell", "Fix"]}
          rows={[
            [
              "1",
              "N+1 queries",
              "hundreds of tiny identical queries",
              "eager-load / join / DataLoader",
            ],
            ["2", "Missing index", "Seq Scan in EXPLAIN", "add the index"],
            [
              "3",
              "Serial I/O",
              "waits that could overlap",
              "parallelise independent calls",
            ],
            [
              "4",
              "No caching",
              "same expensive read, over and over",
              "cache-aside + TTL",
            ],
            [
              "5",
              "Over-fetching",
              "SELECT * / 40KB JSON for a name",
              "select only needed columns/fields",
            ],
            [
              "6",
              "Chatty services",
              "20 network hops for one page",
              "batch, or co-locate the data",
            ],
            [
              "7",
              "Big serialization",
              "CPU burning on JSON encode",
              "smaller payloads, streaming",
            ],
            [
              "8",
              "Lock contention",
              "throughput flat as you add load",
              "shorter transactions, less locking",
            ],
          ]}
        />
        <Note>
          Nearly every “our app is slow” ticket is #1, #2, or #3 — and all three
          are in the <b>database and I/O</b>, not the CPU. That's why measuring
          matters: the instinct to “optimise the code” aims at the wrong layer.
        </Note>
      </Block>

      <Block title="🚨 Parallelise independent I/O">
        <VS
          good={{
            title: "Concurrent — as slow as the slowest",
            body: (
              <Snippet
                lang="javascript"
                code={`const [user, orders, prefs] =
  await Promise.all([
    getUser(id),      // 30ms ┐
    getOrders(id),    // 50ms │ all at once
    getPrefs(id),     // 20ms ┘
  ]);
// total ≈ 50ms`}
              />
            ),
          }}
          bad={{
            title: "Serial — the sum of all waits",
            body: (
              <Snippet
                lang="javascript"
                code={`const user   = await getUser(id);   // 30
const orders = await getOrders(id); // +50
const prefs  = await getPrefs(id);  // +20
// total = 100ms — for no reason;
// none of these depend on each other`}
              />
            ),
          }}
        />
        <Note>
          If two calls don't depend on each other's results, they should run at
          the same time. This one change routinely halves a slow endpoint — and
          it's <code>Promise.all</code>, <code>errgroup</code>,{" "}
          <code>asyncio.gather</code>, or a virtual-thread fan-out, depending on
          your language.
        </Note>
      </Block>

      <Block title="The database is almost always the answer">
        <Rules
          items={[
            <>
              <b>
                Start with <code>pg_stat_statements</code>
              </b>{" "}
              sorted by total time. The query eating the most database CPU is
              very often your whole problem, and you'll never have guessed which
              one.
            </>,
            <>
              <b>
                <code>EXPLAIN ANALYZE</code> the top offenders.
              </b>{" "}
              A Seq Scan on a big table is a missing index; “rows removed by
              filter: millions” means you read rows just to throw them away.
            </>,
            <>
              <b>Then reach for caching</b> — but only for the reads that are
              hot <i>and</i> tolerate a little staleness. Caching to paper over
              a missing index is treating the symptom.
            </>,
          ]}
        />
      </Block>

      <Learn
        links={[
          {
            label: "Use The Index, Luke",
            href: "https://use-the-index-luke.com/",
            note: "The database half of performance, which is most of it.",
          },
          {
            label: "web.dev: Core Web Vitals",
            href: "https://web.dev/articles/vitals",
            note: "The front-of-the-stack counterpart — what 'fast' means to a user.",
          },
        ]}
      />

      <RedFlags
        items={[
          "An ORM relation touched inside a loop",
          "Independent awaits run one after another",
          "SELECT * when you need three columns",
          "Caching to hide a missing index",
          "Optimising CPU when the time is all in I/O",
        ]}
      />
    </>
  );
}

/* ─────────────────────────── 03 · Profiling ──────────────────────────── */

function Profiling() {
  return (
    <>
      <Block title="Read a request the way a profiler shows it">
        <Snippet
          lang="text"
          code={`GET /api/dashboard                     total 340ms
├─ auth check              ▓ 5ms
├─ getUser (DB)            ▓▓ 12ms
├─ getOrders (DB)          ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 210ms  ← 62% of the request 🎯
│   └─ Seq Scan on orders  (no index on user_id)
├─ getRecommendations      ▓▓▓▓ 80ms  (external API — parallelise me)
└─ render JSON             ▓ 33ms

Fix the 210ms first. The 5ms auth check is not your problem.`}
        />
        <Callout
          tone="info"
          title="A flame graph shows you where the time lives"
        >
          Width = time. The widest bar is your target, every time. A{" "}
          <b>distributed trace</b> (OpenTelemetry) does the same across services
          — it's the only way to see that “the API is slow” is really “one
          downstream call is slow”. Instrument once; read it forever.
        </Callout>
      </Block>

      <Block title="The right tool per language">
        <RefTable
          head={["Language", "Reach for"]}
          rows={[
            ["Node.js", "--prof, clinic.js, 0x (flame graphs)"],
            ["Python", "py-spy (no code changes), cProfile, Scalene"],
            ["Go", "pprof (built in) — CPU, heap, blocking, goroutines"],
            ["Java / JVM", "async-profiler, JFR, VisualVM"],
            ["Any HTTP service", "OpenTelemetry traces + a p99 dashboard"],
          ]}
        />
        <Note>
          <b>py-spy</b> and <b>async-profiler</b> can attach to an{" "}
          <i>already-running production process</i> without restarting or
          changing it — so you profile the real workload, not a synthetic one
          that behaves differently.
        </Note>
      </Block>

      <Block title="Memory: leaks and churn">
        <Rules
          items={[
            <>
              <b>A leak</b> is memory that climbs and never falls until an OOM
              kill. Usual causes: an unbounded cache/map, event listeners never
              removed, closures holding big objects. Take two heap snapshots and
              diff what grew.
            </>,
            <>
              <b>Churn</b> is allocating and freeing so fast the garbage
              collector runs constantly — and{" "}
              <b>GC pauses are a top cause of p99 tails</b>. The fix is
              allocating less: reuse buffers, stream instead of building giant
              arrays.
            </>,
            <>
              <b>Watch RSS over time.</b> A sawtooth that trends upward is a
              leak; a steady sawtooth is healthy GC.
            </>,
          ]}
        />
      </Block>

      <Learn
        links={[
          {
            label: "Brendan Gregg — Flame Graphs",
            href: "https://www.brendangregg.com/flamegraphs.html",
            note: "What they are and how to read them, from the person who invented them.",
          },
          {
            label: "Go: profiling with pprof",
            href: "https://go.dev/blog/pprof",
            note: "Even if you don't write Go, the mental model transfers.",
          },
          {
            label: "py-spy",
            href: "https://github.com/benfred/py-spy",
            note: "Sampling profiler you can point at a live process. Magic.",
          },
        ]}
      />

      <RedFlags
        items={[
          "No tracing, so 'the service is slow' can't be localised",
          "Profiling a synthetic load that doesn't match production",
          "Ignoring GC pauses when chasing p99",
          "An unbounded in-memory cache (a leak in waiting)",
        ]}
      />
    </>
  );
}

/* ─────────────────────────── 04 · Concurrency & load ─────────────────── */

function ConcurrencyLoad() {
  return (
    <>
      <Block title="More concurrency is not more throughput">
        <Callout
          tone="warn"
          title="Past the sweet spot, adding load makes everything slower"
        >
          Throughput climbs as you add concurrency — until a resource saturates
          (CPU, the connection pool, a lock). Past that point, more concurrent
          work just means more <b>waiting</b>: latency shoots up while
          throughput flatlines or drops. This is the{" "}
          <b>Universal Scalability Law</b>, and it's why “just add more threads”
          eventually backfires.
        </Callout>
        <Rules
          items={[
            <>
              <b>Bound your concurrency.</b> A limited worker pool or a
              semaphore beats unbounded parallelism — 10,000 simultaneous DB
              queries don't finish faster, they just exhaust the pool and time
              out.
            </>,
            <>
              <b>Bulkheads:</b> give each dependency its own pool, so a slow
              downstream can't consume every worker and take the whole service
              down with it.
            </>,
            <>
              <b>Backpressure &gt; unbounded buffering.</b> When you can't keep
              up, reject fast (<code>429</code>) or slow the producer. An
              infinite in-memory queue just moves the crash to an OOM.
            </>,
          ]}
        />
      </Block>

      <Block title="Blocking vs non-blocking, without the hype">
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniCard label="I/O-bound (most web apps)">
            The time goes to <i>waiting</i> on DB and network. Async / an event
            loop / green threads let one core juggle thousands of waits. This is
            where Node and Go shine.
          </MiniCard>
          <MiniCard label="CPU-bound (image, crypto, ML)">
            The time goes to <i>computing</i>. Async does nothing here — you
            need more cores, worker processes, or offloading to a queue. Doing
            it on the event loop <b>blocks every other request</b>.
          </MiniCard>
        </div>
        <Note>
          The classic Node mistake: a heavy CPU task (resize an image, hash a
          big file) on the event loop <b>freezes the entire server</b> for every
          user until it finishes. Move it to a worker thread or a job queue.
        </Note>
      </Block>

      <Block title="Load test before your users do it for you">
        <Snippet
          lang="javascript"
          code={`// k6 — ramp up, then hold, and watch where p95 breaks
import http from "k6/http";
import { check } from "k6";

export const options = {
  stages: [
    { duration: "1m", target: 100 },   // ramp to 100 virtual users
    { duration: "3m", target: 100 },   // hold — this is the real test
    { duration: "1m", target: 0 },     // ramp down
  ],
  thresholds: { http_req_duration: ["p(95)<500"] },  // fail the run if p95 > 500ms
};

export default function () {
  const res = http.get("https://staging.example.com/api/dashboard");
  check(res, { "status 200": (r) => r.status === 200 });
}`}
        />
        <Rules
          items={[
            <>
              <b>Find the knee.</b> Ramp load until latency turns sharply upward
              — that req/s is your real capacity, and the number that sizes your
              autoscaling.
            </>,
            <>
              <b>Test staging, not prod</b> (a load test is a self-DoS), with
              production-shaped data — an empty database lies about every query
              plan.
            </>,
            <>
              <b>Load</b> (expected traffic) and <b>stress</b> (push to
              breaking) answer different questions. Run both; know how you fail,
              not just that you cope.
            </>,
          ]}
        />
      </Block>

      <Learn
        links={[
          {
            label: "k6 documentation",
            href: "https://grafana.com/docs/k6/latest/",
            note: "Scriptable load testing that fits in CI.",
          },
          {
            label: "The Universal Scalability Law",
            href: "https://www.vividcortex.com/resources/universal-scalability-law/",
            note: "Why throughput stops rising — and starts falling — as you add concurrency.",
          },
          {
            label: "Node.js: don't block the event loop",
            href: "https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop",
            note: "The single most important performance doc for a Node backend.",
          },
        ]}
      />

      <RedFlags
        items={[
          "Unbounded concurrency (no pool, no semaphore)",
          "A CPU-heavy task on the event loop",
          "Infinite in-memory buffering instead of backpressure",
          "Shipping a service that was never load tested",
          "Load testing against an empty database",
        ]}
      />
    </>
  );
}

export const performanceSections: ProSection[] = [
  {
    id: "measure",
    title: "Measure first",
    icon: "📏",
    kicker:
      "Why your intuition is wrong, p95/p99 vs the average, and the latency numbers to memorise.",
    minutes: 6,
    Content: Measure,
  },
  {
    id: "suspects",
    title: "The usual suspects",
    icon: "🔎",
    kicker:
      "The bottlenecks ranked by how often they're really the cause — and parallelising I/O.",
    minutes: 6,
    Content: Suspects,
  },
  {
    id: "profiling",
    title: "Profiling & memory",
    icon: "🔥",
    kicker:
      "Reading a trace waterfall and flame graph, the right profiler per language, and leaks vs churn.",
    minutes: 7,
    Content: Profiling,
  },
  {
    id: "concurrency",
    title: "Concurrency & load testing",
    icon: "🚦",
    kicker:
      "Why more threads backfire, bulkheads and backpressure, I/O vs CPU bound, and finding the knee.",
    minutes: 8,
    Content: ConcurrencyLoad,
  },
];
