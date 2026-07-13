import type { ProSection } from "../../lib/proTopics";
import {
  Block,
  Callout,
  Ladder,
  Learn,
  Note,
  Numbers,
  RedFlags,
  RefTable,
  Rules,
  Snippet,
} from "../../components/ProKit";

/* ─────────────────────────── 01 · Failure is normal ──────────────────── */

function FailureIsNormal() {
  return (
    <>
      <Block title="The fallacies of distributed computing">
        <Callout
          tone="bad"
          title="Every one of these assumptions will betray you"
        >
          The moment your code makes a network call, you've inherited a set of
          lies that feel true in development and are false in production. Design
          as if each has <i>already</i> failed, because at scale, right now, one
          of them has.
        </Callout>
        <RefTable
          head={["The comforting lie", "The reality"]}
          rows={[
            [
              "The network is reliable",
              "packets drop; connections die mid-request",
            ],
            ["Latency is zero", "every hop costs milliseconds that add up"],
            ["Bandwidth is infinite", "big payloads clog and time out"],
            [
              "The network is secure",
              "assume it's hostile; encrypt everything",
            ],
            ["Topology doesn't change", "servers come and go constantly"],
            [
              "There's one administrator",
              "many owners, many configs, many failures",
            ],
            [
              "Transport cost is zero",
              "serialization and bandwidth are real money",
            ],
            [
              "The network is homogeneous",
              "mixed hardware, versions, and speeds",
            ],
          ]}
        />
      </Block>

      <Block title="The numbers behind 'how many nines'">
        <Numbers
          wide
          items={[
            ["99%", "3.65 days/yr down"],
            ["99.9%", "8.8 hrs/yr"],
            ["99.99%", "52 min/yr"],
            ["99.999%", "5 min/yr"],
            ["×", "each nine ≈ 10× the cost"],
            ["SLO", "the target you design to"],
          ]}
        />
        <Note>
          More nines cost exponentially more, so{" "}
          <b>pick the SLO the business actually needs</b> — a photo-sharing app
          is not a payment rail. Then spend your <b>error budget</b>: if your
          SLO allows 52 minutes of downtime a year and you've used 5, you have
          room to ship boldly; if you've used 50, freeze features and shore up
          reliability. It turns “move fast” vs “be stable” into a number instead
          of an argument.
        </Note>
      </Block>

      <Learn
        links={[
          {
            label: "Fallacies of distributed computing",
            href: "https://en.wikipedia.org/wiki/Fallacies_of_distributed_computing",
            note: "The eight assumptions, and why each one bites.",
          },
          {
            label: "Google SRE Book (free online)",
            href: "https://sre.google/sre-book/table-of-contents/",
            note: "SLOs, error budgets, and how Google actually runs services.",
          },
          {
            label: "Release It! — Michael Nygard",
            href: "https://pragprog.com/titles/mnee2/release-it-second-edition/",
            note: "Stability patterns and the outages that inspired them.",
          },
        ]}
      />

      <RedFlags
        items={[
          "Code that assumes the network never fails",
          "Chasing more nines than the business needs",
          "No SLO, so 'reliable enough' is an opinion",
          "No error budget, so every roadmap fight is a vibe",
        ]}
      />
    </>
  );
}

/* ─────────────────────────── 02 · Resilience patterns ────────────────── */

function ResiliencePatterns() {
  return (
    <>
      <Block title="🚨 Timeouts — the default is 'wait forever'">
        <Callout tone="bad" title="One slow dependency becomes a total outage">
          A downstream service hangs. Your requests to it don't error — they{" "}
          <i>wait</i>. Each waiting request holds a thread and a connection. In
          seconds every worker is stuck waiting on the one slow thing, your pool
          is exhausted, and{" "}
          <b>your whole service is down — because something else was slow.</b>{" "}
          This cascade is the most common way distributed systems fail.
        </Callout>
        <Rules
          items={[
            <>
              <b>Set an explicit timeout on every network call.</b> No
              exceptions. A request with no deadline is a resource leak waiting
              for a bad day.
            </>,
            <>
              <b>Budget timeouts down the chain.</b> If the user's request has
              3s, a call three services deep can't also be given 3s — each layer
              must leave time for the ones above it, or the outer request has
              already given up.
            </>,
            <>
              <b>Separate connect and read timeouts</b>, and keep them tight.
              “Waited 30s” is almost never better than “failed at 1s and served
              a fallback”.
            </>,
          ]}
        />
      </Block>

      <Block title="Retries — necessary, and dangerous">
        <Snippet
          lang="javascript"
          code={`// exponential backoff + JITTER — the jitter is not optional
async function withRetry(fn, max = 4) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= max || !isRetriable(err)) throw err;  // 4xx: don't retry
      const base = Math.min(1000 * 2 ** attempt, 20_000);  // 1s,2s,4s,8s… capped
      const wait = Math.random() * base;                   // spread the herd
      await sleep(wait);
    }
  }
}`}
        />
        <Callout
          tone="warn"
          title="Retries without jitter cause a thundering herd"
        >
          A service blips, and 10,000 clients all retry at exactly 1s, then 2s,
          then 4s — synchronised waves that hammer the recovering service back
          into the ground. <b>Jitter</b> (randomising the delay) spreads them
          out. Also: <b>only retry idempotent operations</b> — retrying a
          payment can charge twice — and <b>never retry a 4xx</b>; the request
          was wrong and will be wrong again.
        </Callout>
      </Block>

      <Block title="Circuit breakers — stop kicking a service that's down">
        <Snippet
          lang="text"
          code={`         failures exceed threshold
  CLOSED ───────────────────────────▶ OPEN
   ▲  (normal: requests flow)      (fail FAST, don't even try —
   │                                give the service room to recover)
   │  success                          │ after a cooldown
   │                                   ▼
   └──────────────────────────── HALF-OPEN
        (let ONE test request through; ok → CLOSED, fail → OPEN)`}
        />
        <Note>
          A retry says “try again”; a circuit breaker says{" "}
          <b>“stop trying for a while”</b>. Once failures cross a threshold it
          trips <b>open</b> and fails instantly — no threads wait, the
          struggling service gets breathing room, and you can serve a{" "}
          <b>fallback</b> (a cached value, a default, a graceful “try later”)
          instead of hanging. Retries and breakers are partners: retry the
          blips, break on the outages.
        </Note>
      </Block>

      <Block title="Graceful degradation">
        <Rules
          items={[
            <>
              <b>Rank features by criticality.</b> Checkout is critical;
              recommendations are not. When recommendations are down, show the
              page <b>without</b> them — never fail the whole page for a
              nice-to-have.
            </>,
            <>
              <b>Every non-critical dependency needs a fallback:</b> a cached
              value, an empty state, a sensible default. “Degrade, don't die.”
            </>,
            <>
              <b>Shed load</b> before you collapse. Under extreme pressure,
              reject a fraction of requests fast (<code>503</code>) so the rest
              still get served. Half up beats all down.
            </>,
          ]}
        />
      </Block>

      <Learn
        links={[
          {
            label: "AWS: timeouts, retries and backoff with jitter",
            href: "https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/",
            note: "The definitive, practical write-up. Read it twice.",
          },
          {
            label: "Martin Fowler: CircuitBreaker",
            href: "https://martinfowler.com/bliki/CircuitBreaker.html",
            note: "The pattern, its states, and when to use it.",
          },
          {
            label: "AWS Builders' Library",
            href: "https://aws.amazon.com/builders-library/",
            note: "How a hyperscaler builds resilient services — free and excellent.",
          },
        ]}
      />

      <RedFlags
        items={[
          "A network call with no timeout",
          "Retries with no jitter, or retrying non-idempotent writes",
          "Retrying 4xx errors",
          "No circuit breaker on a flaky dependency",
          "A nice-to-have feature able to take down the whole page",
        ]}
      />
    </>
  );
}

/* ─────────────────────────── 03 · CAP & consistency ──────────────────── */

function CapConsensus() {
  return (
    <>
      <Block title="CAP — you don't get to keep all three">
        <Callout tone="info" title="When the network splits, you choose C or A">
          Consistency, Availability, Partition-tolerance — pick two. But
          partitions <i>will</i> happen (see the fallacies), so P isn't
          optional. The real, unavoidable choice is: when a partition occurs, do
          you <b>refuse to answer rather than risk a wrong answer (CP)</b>, or{" "}
          <b>answer with possibly-stale data rather than fail (AP)</b>?
        </Callout>
        <RefTable
          head={["Pick", "Behaviour on a partition", "Right for"]}
          rows={[
            [
              "CP",
              "reject writes/reads rather than serve stale",
              "money, inventory, bookings",
            ],
            [
              "AP",
              "keep serving, reconcile later",
              "feeds, carts, social, metrics",
            ],
          ]}
        />
        <Note>
          This is a <b>per-feature</b> decision inside one product. The bank
          balance is CP; the “last seen” timestamp beside it is AP. Saying
          which, and why, is the whole skill.
        </Note>
      </Block>

      <Block title="The spectrum of consistency">
        <RefTable
          head={["Model", "Guarantee"]}
          rows={[
            [
              "Strong / linearizable",
              "everyone sees the latest write immediately (slowest)",
            ],
            ["Read-your-writes", "you see your own changes; others may lag"],
            ["Monotonic reads", "you never see time go backwards"],
            ["Eventual", "all replicas converge… eventually (fastest)"],
          ]}
        />
        <Note>
          “Eventual” is fine far more often than beginners think — a like count
          that's briefly off by one harms nobody. But{" "}
          <b>“read-your-writes” is usually the real requirement</b>: users must
          see <i>their own</i> changes at once, even if everyone else's view
          lags. That's the bug behind “I updated my profile and it didn't save”
          (it did — you read a stale replica).
        </Note>
      </Block>

      <Block title="Consensus & quorums — how nodes agree">
        <Rules
          items={[
            <>
              <b>Consensus algorithms</b> (<b>Raft</b>, Paxos) let a cluster
              agree on one value despite failures. They elect a <b>leader</b>;
              the leader orders all writes. This is how etcd, Consul,
              CockroachDB and Kafka's controller stay consistent.
            </>,
            <>
              <b>Quorum:</b> require a <b>majority</b> to agree before
              committing (<code>W + R &gt; N</code>). A majority can't exist on
              both sides of a split, which is exactly what prevents{" "}
              <b>split-brain</b> — two halves both electing leaders and
              diverging.
            </>,
            <>
              <b>Always run an odd number</b> (3 or 5). Three nodes tolerate one
              failure; five tolerate two. An even count buys no extra failure
              tolerance and invites ties.
            </>,
          ]}
        />
      </Block>

      <Learn
        links={[
          {
            label: "The Raft consensus algorithm (visual)",
            href: "https://raft.github.io/",
            note: "An animation that makes leader election and quorums click.",
          },
          {
            label: "Jepsen: consistency models",
            href: "https://jepsen.io/consistency",
            note: "A precise map of every consistency guarantee and its cost.",
          },
          {
            label: "You Can't Sacrifice Partition Tolerance",
            href: "https://codahale.com/you-cant-sacrifice-partition-tolerance/",
            note: "Why CAP is really just C-vs-A, argued clearly.",
          },
        ]}
      />

      <RedFlags
        items={[
          "Claiming 'strong consistency everywhere' without pricing it",
          "Treating CAP as a one-time company-wide choice, not per-feature",
          "Reading a replica right after a write, then wondering why it's stale",
          "An even number of nodes in a consensus cluster",
        ]}
      />
    </>
  );
}

/* ─────────────────────────── 04 · Data & operations ──────────────────── */

function DataAndOps() {
  return (
    <>
      <Block title="🚨 The dual-write problem">
        <Callout
          tone="bad"
          title="Two systems, one update, and no transaction between them"
        >
          You save an order to the database, then publish “order created” to
          Kafka. The database commit succeeds — and then the app crashes before
          the publish. Now the order{" "}
          <b>exists but no downstream ever hears about it</b>: no email, no
          fulfilment, no analytics. There is no shared transaction across a
          database and a message broker, so this <i>will</i> happen.
        </Callout>
        <p className="text-[13px] font-semibold text-ink-900 dark:text-white">
          The transactional outbox — write both in one transaction:
        </p>
        <Snippet
          lang="sql"
          code={`BEGIN;
  INSERT INTO orders (id, ...) VALUES (...);
  INSERT INTO outbox (topic, payload)          -- SAME transaction
         VALUES ('order.created', '{...}');
COMMIT;   -- both land, or neither does

-- a separate relay polls the outbox and publishes to Kafka,
-- marking rows sent. Crash mid-publish? It re-sends → AT-LEAST-ONCE,
-- so consumers must dedupe on the event id.`}
        />
        <Note>
          The outbox turns two unreliable writes into{" "}
          <b>one atomic write plus a reliable relay</b>. It's the standard fix,
          and it's why every consumer downstream must be idempotent — the relay
          guarantees delivery, not uniqueness.
        </Note>
      </Block>

      <Block title="Sagas — transactions across services">
        <Callout
          tone="info"
          title="No distributed transaction? Undo instead of roll back."
        >
          Booking a trip touches flights, hotels, and payments — three services,
          no shared transaction. A <b>saga</b> is a sequence of local
          transactions, each with a <b>compensating action</b> that undoes it.
          If the hotel step fails, you <i>compensate</i> the flight (cancel it)
          rather than rolling back a transaction that never existed.
        </Callout>
        <Ladder
          steps={[
            ["Reserve flight ✅", "local transaction in the flight service"],
            ["Reserve hotel ✅", "local transaction in the hotel service"],
            ["Charge card ❌ fails", "now unwind, in reverse"],
            ["Compensate: release hotel", "the undo action for step 2"],
            ["Compensate: release flight", "the undo action for step 1"],
          ]}
        />
        <Note>
          Sagas give you <b>eventual</b> consistency, not atomic — for a while
          the flight is booked and the hotel isn't. Design the compensations up
          front, and make every step idempotent (a compensation may itself be
          retried).
        </Note>
      </Block>

      <Block title="Being on call for it: health, drills, blameless learning">
        <Rules
          items={[
            <>
              <b>Liveness vs readiness.</b> <i>Liveness</i> = “am I alive?” —
              fail it and get restarted. <i>Readiness</i> = “can I take
              traffic?” — fail it (e.g. the DB is unreachable) and get pulled
              from the load balancer
              <i> without</i> a restart. Confusing them causes restart loops.
            </>,
            <>
              <b>Graceful shutdown.</b> On SIGTERM: stop accepting new work,
              finish in-flight requests, close connections, <i>then</i> exit.
              Skip this and every deploy drops live requests.
            </>,
            <>
              <b>Practise failure.</b> Chaos testing (kill a node, add latency,
              drop the database in staging) finds the missing timeout{" "}
              <i>before</i> a real outage does. A failover you've never tested
              doesn't work.
            </>,
            <>
              <b>Blameless post-mortems.</b> Systems fail, not people. Ask what
              made the mistake <i>possible</i> and fix that. Blame just teaches
              everyone to hide problems, which is how small incidents grow into
              big ones.
            </>,
          ]}
        />
      </Block>

      <Learn
        links={[
          {
            label: "microservices.io: transactional outbox",
            href: "https://microservices.io/patterns/data/transactional-outbox.html",
            note: "The canonical write-up, with the saga pattern next door.",
          },
          {
            label: "Google SRE: postmortem culture",
            href: "https://sre.google/sre-book/postmortem-culture/",
            note: "How to run a blameless post-mortem that actually improves things.",
          },
          {
            label: "Principles of Chaos Engineering",
            href: "https://principlesofchaos.org/",
            note: "Testing resilience by breaking things on purpose.",
          },
        ]}
      />

      <RedFlags
        items={[
          "Writing to a database and a broker with no outbox",
          "A multi-service workflow with no compensating actions",
          "Consumers that aren't idempotent (delivery is at-least-once)",
          "Liveness and readiness probes conflated",
          "No graceful shutdown → deploys drop in-flight requests",
          "Post-mortems that assign blame instead of fixing the system",
        ]}
      />
    </>
  );
}

export const reliabilitySections: ProSection[] = [
  {
    id: "failure",
    title: "Failure is the normal case",
    icon: "🌩️",
    kicker:
      "The eight fallacies of distributed computing, the cost of each 'nine', and error budgets.",
    minutes: 6,
    Content: FailureIsNormal,
  },
  {
    id: "patterns",
    title: "Resilience patterns",
    icon: "🧯",
    kicker:
      "Timeouts, retries with jitter, circuit breakers, and degrading instead of dying.",
    minutes: 8,
    Content: ResiliencePatterns,
  },
  {
    id: "cap",
    title: "CAP, consistency & consensus",
    icon: "⚖️",
    kicker:
      "The C-vs-A choice, the consistency spectrum, and how quorums stop split-brain.",
    minutes: 7,
    Content: CapConsensus,
  },
  {
    id: "data-ops",
    title: "Dual writes, sagas & on-call",
    icon: "📦",
    kicker:
      "The outbox pattern, compensating transactions, health probes, and blameless post-mortems.",
    minutes: 8,
    Content: DataAndOps,
  },
];
