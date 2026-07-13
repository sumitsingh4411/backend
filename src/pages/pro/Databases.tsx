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

/* ─────────────────────────── 01 · Choosing a database ─────────────────── */

function Choosing() {
  return (
    <>
      <Block title="The default answer">
        <Callout
          tone="good"
          title="PostgreSQL — the default, and it isn't close"
        >
          Start with Postgres unless you have a <b>specific, measured</b> reason
          not to. You get real transactions, joins, constraints, JSONB when you
          want schemaless, full-text search, geospatial (PostGIS) — and it
          scales far past where most products ever get.
          <br />
          “We'll need to scale, so let's use NoSQL” is a decision made about a
          problem you don't have, and it <b>costs you correctness today</b>. One
          well-indexed Postgres box comfortably serves thousands of requests per
          second.
        </Callout>
        <Note>
          The real question is never “SQL or NoSQL?”. It's{" "}
          <b>“what is my access pattern?”</b> — how you <i>read</i> the data
          decides the store, not how you like to write code.
        </Note>
      </Block>

      <Block title="The engines, and what each is genuinely for">
        <RefTable
          head={["Store", "Shape", "Reach for it when"]}
          rows={[
            ["PostgreSQL", "relational", "almost always — the default"],
            [
              "MySQL",
              "relational",
              "you already run it, or the ecosystem needs it",
            ],
            [
              "SQLite",
              "relational, embedded",
              "single-node apps, tests, edge, CLI tools",
            ],
            [
              "MongoDB",
              "document",
              "records genuinely differ in shape; you never join",
            ],
            [
              "Redis",
              "key-value, in-memory",
              "cache, rate limits, queues, sessions, leaderboards",
            ],
            [
              "Cassandra / DynamoDB",
              "wide-column / KV",
              "huge write volume, one known query pattern",
            ],
            [
              "Elasticsearch",
              "inverted index",
              "search and analytics — never the source of truth",
            ],
            ["ClickHouse", "columnar", "analytics over billions of rows"],
            [
              "Neo4j",
              "graph",
              "the relationship IS the query (fraud rings, friends-of-friends)",
            ],
          ]}
        />
        <Note>
          <b>Polyglot persistence</b> is normal: Postgres as the source of
          truth, Redis in front for speed, Elasticsearch beside it for search.
          What is <i>not</i> normal is two systems both claiming to be the
          source of truth — that's the dual-write problem, and the two will
          drift apart.
        </Note>
      </Block>

      <Block title="Relational vs document — the honest comparison">
        <VS
          good={{
            title: "Relational buys you",
            body: (
              <>
                Constraints the database <b>enforces</b> (foreign keys, unique,
                check) — so bad data <i>cannot</i> exist, even when a buggy
                service tries. Joins mean a fact is stored <b>once</b>.
                Transactions across many rows. Ad-hoc queries you never planned
                for.
              </>
            ),
          }}
          bad={{
            title: "Document costs you",
            body: (
              <>
                No joins ⇒ you <b>duplicate</b> data ⇒ you now own keeping the
                copies in sync, forever. “Schemaless” doesn't mean no schema —
                it means the schema lives in{" "}
                <b>your application code, unenforced</b>, in five places, at
                four different versions.
              </>
            ),
          }}
        />
        <Callout tone="info" title="When a document store is genuinely right">
          The document <i>is</i> the unit of access: you always fetch the whole
          thing by id, records really do differ in shape (CMS content, product
          catalogues, event payloads), and you never ask questions across
          records. The moment you write an application-side join,{" "}
          <b>you picked wrong</b>.
        </Callout>
      </Block>

      <Block title="ACID vs BASE">
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniCard label="ACID (relational)">
            <b>A</b>tomic (all or nothing) · <b>C</b>onsistent (constraints
            hold) · <b>I</b>solated (concurrent transactions don't see each
            other's half-finished work) · <b>D</b>urable (committed survives a
            crash).
          </MiniCard>
          <MiniCard label="BASE (many NoSQL)">
            <b>B</b>asically available · <b>S</b>oft state · <b>E</b>ventually
            consistent. You trade “always correct” for “always answers”, and you
            handle the disagreement yourself.
          </MiniCard>
        </div>
        <Note>
          <b>Money, inventory, bookings → ACID.</b> Likes, view counts, feeds →
          eventual is fine. This is a <i>per-field</i> decision, not a
          per-company religion.
        </Note>
      </Block>

      <Learn
        links={[
          {
            label: "PostgreSQL documentation",
            href: "https://www.postgresql.org/docs/current/",
            note: "The best database manual ever written. Start with Tutorial + Data Types.",
          },
          {
            label: "Designing Data-Intensive Applications",
            href: "https://dataintensive.net/",
            note: "The one book that makes you dangerous. Ch. 2–3 cover this page in depth.",
          },
          {
            label: "Jepsen — what databases actually guarantee",
            href: "https://jepsen.io/analyses",
            note: "Vendors' claims, tested to destruction. Read the one for your store.",
          },
        ]}
      />

      <RedFlags
        items={[
          "Choosing NoSQL for scale you don't have yet",
          "Two systems both treated as the source of truth",
          "Application-side joins in a document store",
          "Elasticsearch (or the cache) as the system of record",
          "No foreign keys 'for performance' — you moved integrity into bugs",
        ]}
      />
    </>
  );
}

/* ─────────────────────────── 02 · Data modelling ──────────────────────── */

function Modelling() {
  return (
    <>
      <Block title="The rules">
        <Rules
          items={[
            <>
              <b>One fact, one place.</b> If a user's email lives in three
              tables, two of them are already wrong. Normalise first;
              denormalise later, deliberately, with a reason.
            </>,
            <>
              <b>Let the database enforce truth.</b> <code>NOT NULL</code>,{" "}
              <code>UNIQUE</code>, <code>CHECK</code> and foreign keys are
              guarantees. Application-only validation is a <i>hope</i> — another
              service, a migration script, or a bug will eventually write around
              it.
            </>,
            <>
              <b>Pick the right types.</b> Money is <code>NUMERIC</code> (or
              integer cents), never <code>FLOAT</code> — 0.1 + 0.2 ≠ 0.3 and
              your ledger won't balance. Time is <code>TIMESTAMPTZ</code>,
              always UTC. <code>TEXT</code> is fine; <code>VARCHAR(255)</code>{" "}
              is cargo cult.
            </>,
            <>
              <b>Every table gets a primary key</b>, <code>created_at</code> and{" "}
              <code>updated_at</code>. You will want them at 3am.
            </>,
            <>
              <b>Prefer UUIDv7 / ULID to UUIDv4</b> for public ids: they look
              random but are <i>time-ordered</i>, so inserts land at the end of
              the index instead of scattering random writes across the whole
              B-tree.
            </>,
          ]}
        />
      </Block>

      <Block title="Relationships, concretely">
        <Snippet
          lang="sql"
          code={`-- one-to-many: the MANY side holds the key
CREATE TABLE users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL UNIQUE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id          bigserial PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_cents bigint NOT NULL CHECK (total_cents >= 0),
  status      text   NOT NULL CHECK (status IN ('pending','paid','shipped')),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON orders (user_id, created_at DESC);  -- "this user's recent orders"

-- many-to-many: a JOIN TABLE, never a comma-separated column
CREATE TABLE order_items (
  order_id   bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id bigint NOT NULL REFERENCES products(id),
  quantity   int    NOT NULL CHECK (quantity > 0),
  unit_cents bigint NOT NULL,       -- the price AT PURCHASE TIME, not a lookup
  PRIMARY KEY (order_id, product_id)
);`}
        />
        <Callout tone="warn" title="Copy the price onto the order. On purpose.">
          That looks like duplication, and it is — the <i>correct</i> kind.
          Prices change; an invoice must say what the customer{" "}
          <b>actually paid</b>, not what the product costs today. The rule isn't
          “never duplicate”, it's <b>“never duplicate a live fact”</b>. A
          historical fact is a different fact.
        </Callout>
      </Block>

      <Block title="Denormalise on purpose, never by accident">
        <RefTable
          head={["Situation", "Do"]}
          rows={[
            [
              "Reads outnumber writes 100:1",
              "cache or precompute the read shape",
            ],
            [
              "A count shown everywhere (likes, comments)",
              "keep a counter column — updated in the same transaction",
            ],
            [
              "Historical values (price, address, name on an invoice)",
              "copy them: they're snapshots, not references",
            ],
            [
              "A join that's slow in EXPLAIN but fine in production",
              "leave it alone",
            ],
          ]}
        />
        <Note>
          Every denormalised value can <b>drift</b>. If you keep one, update it{" "}
          <b>inside the same transaction</b> as the source of truth — or rebuild
          it on a schedule and accept that it's approximate.
        </Note>
      </Block>

      <Block title="Soft deletes, state, and time">
        <Rules
          items={[
            <>
              <b>Soft delete</b> (<code>deleted_at timestamptz</code>) keeps
              history and makes undo possible — but now <i>every</i> query must
              remember <code>WHERE deleted_at IS NULL</code>. Forget once and
              you leak deleted data. Hide it behind a <b>view</b> or a partial
              index so you can't forget.
            </>,
            <>
              <b>Store events, not only state.</b> A row saying{" "}
              <code>status = 'shipped'</code> can't tell you when it shipped or
              who changed it. An <code>order_events</code> table answers
              questions you haven't thought of yet.
            </>,
            <>
              <b>Store UTC, render local.</b> Timezone is a presentation
              concern. One exception: a future event tied to a place (“9am in
              Berlin”) — store the <b>timezone id</b> too, because governments
              change offsets.
            </>,
            <>
              <b>Enum-ish columns:</b> a <code>CHECK</code> constraint or a
              lookup table beats a native enum — adding a value to a Postgres
              enum is a migration, and removing one is a nightmare.
            </>,
          ]}
        />
      </Block>

      <Learn
        links={[
          {
            label: "PostgreSQL data types",
            href: "https://www.postgresql.org/docs/current/datatype.html",
            note: "Read once, end to end. It will change how you model.",
          },
          {
            label: "UUIDv7 — time-ordered ids",
            href: "https://uuid7.com/",
            note: "Why random ids quietly wreck your index write path.",
          },
          {
            label: "Modern SQL — a guide past SQL-92",
            href: "https://modern-sql.com/",
            note: "Window functions, CTEs, upserts — the SQL most people never learned.",
          },
        ]}
      />

      <RedFlags
        items={[
          "FLOAT for money",
          "Timestamps stored without a timezone",
          "A many-to-many relationship crammed into one column",
          "Soft deletes with no view or index guarding the WHERE clause",
          "Counters updated outside the transaction that changed the source",
        ]}
      />
    </>
  );
}

/* ─────────────────────────── 03 · Indexes & plans ─────────────────────── */

function Indexes() {
  return (
    <>
      <Block title="What an index actually is">
        <Callout
          tone="info"
          title="A sorted lookup structure — the book's index, not the book"
        >
          Without one, finding <code>email = 'a@b.com'</code> means reading{" "}
          <b>every row</b> (a sequential scan). With a B-tree, the database
          walks a shallow tree: 10 million rows is about <b>3–4 hops</b>. That's
          the difference between 800ms and 0.2ms.
          <br />
          The cost: every <code>INSERT</code>/<code>UPDATE</code>/
          <code>DELETE</code> must update <i>every</i> index on the table, and
          each index eats disk and memory.{" "}
          <b>Indexes trade write speed for read speed</b> — they are never free.
        </Callout>
        <Numbers
          wide
          items={[
            ["3–4", "hops through 10M rows"],
            ["~0.2ms", "indexed point lookup"],
            ["100ms+", "seq scan of 1M rows"],
            ["5–10", "indexes/table = too many"],
            ["~10%", "selectivity where an index stops winning"],
            ["1", "index a new table needs (its PK)"],
          ]}
        />
      </Block>

      <Block title="Index these — and, at first, nothing else">
        <Rules
          items={[
            <>
              <b>Foreign keys.</b> Postgres does <i>not</i> index them for you,
              and every join and every cascading delete needs it.
            </>,
            <>
              <b>Selective columns in WHERE.</b> An index on{" "}
              <code>is_active</code> where 95% of rows are active is{" "}
              <b>useless</b> — the planner will do a seq scan anyway, and it's
              right to.
            </>,
            <>
              <b>Columns you ORDER BY + LIMIT.</b> An index returns rows already
              sorted, turning “sort two million rows, keep 20” into “read 20
              rows”.
            </>,
            <>
              <b>Composite indexes, in the right order:</b>{" "}
              <code>(tenant_id, created_at DESC)</code>. The{" "}
              <b>leftmost-prefix rule</b> — that index serves{" "}
              <code>WHERE tenant_id = ?</code> and{" "}
              <code>WHERE tenant_id = ? ORDER BY created_at</code>, but{" "}
              <b>not</b> <code>WHERE created_at &gt; ?</code> on its own. Column
              order is the whole game.
            </>,
            <>
              <b>Partial indexes</b> for the query you actually run:{" "}
              <code>
                CREATE INDEX ON jobs (created_at) WHERE status = 'pending'
              </code>{" "}
              — tiny, hot, and perfect for a queue table where 99% of rows are
              done.
            </>,
            <>
              <b>Covering indexes</b> (<code>INCLUDE (…)</code>) let the
              database answer entirely from the index — an{" "}
              <i>Index Only Scan</i>, which never touches the table at all.
            </>,
          ]}
        />
      </Block>

      <Block title="Reading an EXPLAIN plan">
        <Snippet
          lang="sql"
          code={`EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE user_id = 42 ORDER BY created_at DESC LIMIT 20;

-- ❌ BEFORE
Limit  (cost=18543.12..18543.17 rows=20 width=64)
        (actual time=142.318..142.325 rows=20 loops=1)
  ->  Sort  (cost=18543.12..18571.40 rows=11312 width=64)
        Sort Method: top-N heapsort  Memory: 27kB
        ->  Seq Scan on orders  (rows=11312)         ← read the WHOLE table
              Filter: (user_id = 42)
              Rows Removed by Filter: 1988688        ← threw away 2M rows 😱
Execution Time: 142.401 ms

CREATE INDEX ON orders (user_id, created_at DESC);

-- ✅ AFTER
Limit  (actual time=0.031..0.038 rows=20 loops=1)
  ->  Index Scan using orders_user_id_created_at_idx on orders
        Index Cond: (user_id = 42)                   ← walked straight to them
Execution Time: 0.061 ms                             ← 2,300× faster`}
        />
        <RefTable
          head={["You see", "It means"]}
          rows={[
            ["Seq Scan on a big table", "🚨 no usable index — this is the bug"],
            ["Index Scan", "✅ what you want"],
            [
              "Index Only Scan",
              "✅✅ answered from the index; never touched the table",
            ],
            ["Bitmap Heap Scan", "fine — many matches, batched reads"],
            ["Nested Loop", "great for few rows, catastrophic for many"],
            ["Hash Join", "normal when joining two large sets"],
            [
              "Rows Removed by Filter: huge",
              "🚨 you read rows just to throw them away",
            ],
            ["actual rows ≫ estimated rows", "stale statistics — run ANALYZE"],
          ]}
        />
        <Note>
          <b>ANALYZE runs the query for real.</b> Never{" "}
          <code>EXPLAIN ANALYZE</code> a <code>DELETE</code> outside a
          transaction you intend to roll back. Paste plans into{" "}
          <b>explain.dalibo.com</b> to see where the time actually went.
        </Note>
      </Block>

      <Block title="Find the slow query before you guess">
        <Snippet
          lang="sql"
          code={`-- the single most valuable query you can run in production
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT substring(query, 1, 60) AS query,
       calls,
       round(mean_exec_time::numeric, 2) AS avg_ms,
       round(total_exec_time::numeric)   AS total_ms
FROM pg_stat_statements
ORDER BY total_exec_time DESC        -- ← TOTAL, not average
LIMIT 10;`}
        />
        <Callout tone="warn" title="Sort by total time, not average">
          A 2-second report run once a day is <b>not</b> your problem. A 40ms
          query called 200,000 times an hour <b>is</b> — that's 2.2 hours of
          database CPU per hour. The average hides it; the total exposes it.
        </Callout>
      </Block>

      <Block title="The N+1 query — the most common bug in backend code">
        <VS
          good={{
            title: "One round trip",
            body: (
              <Snippet
                lang="sql"
                code={`SELECT * FROM posts
JOIN users ON users.id = posts.user_id
WHERE posts.created_at > now() - interval '1 day';`}
              />
            ),
          }}
          bad={{
            title: "1 + N round trips",
            body: (
              <Snippet
                lang="javascript"
                code={`const posts = await db.posts.findAll();   // 1
for (const p of posts) {                  // + 100
  p.author = await db.users.find(p.userId);
}
// 101 × 1ms = 101ms of pure waiting`}
              />
            ),
          }}
        />
        <Note>
          Your ORM does this <b>silently</b> every time you touch a lazy
          relation inside a loop. The fix is <code>include</code> /{" "}
          <code>joinedload</code> / <code>preload</code>, or a <b>DataLoader</b>{" "}
          that batches the ids into one <code>WHERE id = ANY($1)</code>. Turn on
          SQL logging in dev for one afternoon — you will find several.
        </Note>
      </Block>

      <Learn
        links={[
          {
            label: "Use The Index, Luke",
            href: "https://use-the-index-luke.com/sql/anatomy",
            note: "Free book. The clearest explanation of B-trees and leftmost prefixes there is.",
          },
          {
            label: "explain.dalibo.com",
            href: "https://explain.dalibo.com/",
            note: "Paste a plan, get a visual breakdown of where the time went.",
          },
          {
            label: "pg_stat_statements",
            href: "https://www.postgresql.org/docs/current/pgstatstatements.html",
            note: "How to find the query that's actually costing you.",
          },
        ]}
      />

      <RedFlags
        items={[
          "An index on every column 'to be safe' — every write now pays for all of them",
          "Indexing a low-selectivity boolean",
          "A composite index whose column order doesn't match the query",
          "Optimising a query you never ran EXPLAIN on",
          "An ORM call inside a loop",
        ]}
      />
    </>
  );
}

/* ─────────────────────────── 04 · Transactions ────────────────────────── */

function Transactions() {
  return (
    <>
      <Block title="Isolation levels — what each one still lets through">
        <RefTable
          head={["Level", "Still possible", "Use for"]}
          rows={[
            ["Read uncommitted", "dirty reads", "nothing. ever."],
            [
              "Read committed (default)",
              "non-repeatable reads, phantoms",
              "99% of queries",
            ],
            [
              "Repeatable read",
              "phantoms / write skew",
              "reports that must be self-consistent",
            ],
            [
              "Serializable",
              "nothing — but expect retries",
              "money, inventory, bookings",
            ],
          ]}
        />
        <Callout tone="info" title="The anomalies, one line each">
          <b>Dirty read</b> — you saw a change that then rolled back.
          <br />
          <b>Non-repeatable read</b> — you read the same row twice and got two
          answers.
          <br />
          <b>Phantom</b> — you ran the same <code>WHERE</code> twice and new
          rows appeared.
          <br />
          <b>Write skew</b> — two transactions each check a condition, both
          pass, both write, and <i>together</i> they break it (both doctors go
          off-call, and the hospital has no cover).
        </Callout>
        <Note>
          Under <b>SERIALIZABLE</b>, Postgres may abort your transaction with a
          serialization failure. That isn't a bug — it's the guarantee doing its
          job. <b>Your code must retry</b> (2–3 attempts, small random backoff).
        </Note>
      </Block>

      <Block title="🚨 The lost update — a race you WILL write">
        <Snippet
          lang="text"
          code={`Two requests spend from the same wallet (balance = 100):

  T1: SELECT balance → 100      ┐
  T2: SELECT balance → 100      │ both read the same value
  T1: UPDATE balance = 100 - 60 │
  T2: UPDATE balance = 100 - 80 ┘ last writer wins

  balance = 20. You just paid out 140 from a wallet holding 100.`}
        />
        <p className="text-[13px] font-semibold text-ink-900 dark:text-white">
          Three correct fixes, in order of preference:
        </p>
        <Snippet
          lang="sql"
          code={`-- 1) ATOMIC UPDATE — best when it fits in one statement.
--    The database does the read and the write as one indivisible step.
UPDATE wallets
   SET balance = balance - 60
 WHERE id = 1 AND balance >= 60;
-- 0 rows updated → insufficient funds. No race. No lock you have to manage.

-- 2) PESSIMISTIC LOCK — when you must read, think, then write.
BEGIN;
  SELECT balance FROM wallets WHERE id = 1 FOR UPDATE;  -- others WAIT here
  -- ... application logic ...
  UPDATE wallets SET balance = balance - 60 WHERE id = 1;
COMMIT;

-- 3) OPTIMISTIC LOCK — when conflicts are rare and locking is too costly.
UPDATE wallets SET balance = 40, version = version + 1
 WHERE id = 1 AND version = 7;
-- 0 rows updated → someone beat you to it → re-read and retry.`}
        />
      </Block>

      <Block title="Deadlocks, and the one rule that prevents most of them">
        <Callout tone="bad" title="Two transactions, each waiting on the other">
          T1 locks row A and wants B. T2 locks B and wants A. Neither can move,
          so the database kills one and returns an error.
          <br />
          <b>The rule: always take locks in the same order</b> (e.g. always by
          ascending id). Nearly every deadlock is two code paths touching the
          same two rows in opposite orders.
        </Callout>
        <Rules
          items={[
            <>
              <b>Keep transactions short.</b> Never make an HTTP call inside one
              — you'd be holding locks while waiting on someone else's network.
            </>,
            <>
              <b>Set a lock timeout</b> (<code>SET lock_timeout = '3s'</code>)
              so a stuck transaction fails fast instead of building a queue of
              waiters until connections run out.
            </>,
            <>
              <b>Retry deadlock and serialization errors</b> — they're expected,
              not exceptional. Wrap the whole transaction in a retry with
              jitter.
            </>,
          ]}
        />
      </Block>

      <Block title="MVCC — why readers never block writers">
        <Note>
          Postgres doesn't overwrite a row; it writes a <b>new version</b> and
          keeps the old one visible to transactions that started earlier. That's{" "}
          <b>MVCC</b>, and it's why a long report can run while writes carry on.
          <br />
          The bill: dead versions pile up, and <b>VACUUM</b> reclaims them. A
          long-running transaction <i>prevents</i> vacuum from cleaning anything
          newer than itself — which is how “someone left a transaction open in a
          psql tab” becomes <b>table bloat</b> and a disk alert at 2am.
        </Note>
      </Block>

      <Learn
        links={[
          {
            label: "PostgreSQL: transaction isolation",
            href: "https://www.postgresql.org/docs/current/transaction-iso.html",
            note: "Short, precise, with a worked example of every anomaly.",
          },
          {
            label: "Jepsen: consistency models",
            href: "https://jepsen.io/consistency",
            note: "A map of every guarantee and what it really costs.",
          },
          {
            label: "PostgreSQL Anti-Patterns (2ndQuadrant/EDB blog)",
            href: "https://www.enterprisedb.com/blog",
            note: "Long-running transactions, bloat, and the ops mistakes behind them.",
          },
        ]}
      />

      <RedFlags
        items={[
          "read-modify-write with no lock, atomic update, or version check",
          "An HTTP call inside a transaction",
          "No retry on deadlock / serialization failures",
          "Transactions left open (they block VACUUM and bloat the table)",
          "SELECT FOR UPDATE held across user think-time",
        ]}
      />
    </>
  );
}

/* ─────────────────────────── 05 · Scaling & ops ───────────────────────── */

function Scaling() {
  return (
    <>
      <Block title="Scale in this order — stop as soon as it's fast enough">
        <Ladder
          ordered
          steps={[
            ["Index it", "free, instant, and usually the entire answer"],
            ["Fix the N+1s", "free, and often bigger than the index"],
            ["Cache the hot reads", "cheap — but you now own invalidation"],
            ["Add read replicas", "scales reads; costs you replication lag"],
            [
              "Partition big tables",
              "still one machine: faster scans, instant drops of old data",
            ],
            [
              "Shard",
              "scales writes; costs you cross-shard joins and your weekends",
            ],
          ]}
        />
        <Note>
          Almost nobody needs step 6. A single Postgres instance on decent
          hardware handles <b>tens of thousands of reads/sec</b> and terabytes
          of data. Sharding first is the most expensive mistake on this page.
        </Note>
      </Block>

      <Block title="🚨 Connection pooling — the one that takes down production">
        <Callout
          tone="bad"
          title="Postgres connections are processes, not threads"
        >
          Each costs ~5–10MB plus real scheduling overhead, and Postgres tops
          out around <b>100–500</b> of them. Now: your app runs{" "}
          <b>20 instances</b>, each with a pool of <b>20</b> →{" "}
          <b>400 connections</b> the moment traffic spikes. New connections get
          refused, health checks fail, instances restart, and the restart storm
          makes it worse.
          <br />
          <b>Your real pool size is pool × instances.</b> Do that multiplication{" "}
          <i>before</i> you deploy, not during the incident.
        </Callout>
        <Rules
          items={[
            <>
              Put <b>PgBouncer</b> (transaction mode) between app and database:
              hundreds of app connections multiplex onto a few dozen real ones.
            </>,
            <>
              Rule of thumb:{" "}
              <code>connections ≈ (2 × cores) + effective_spindles</code>. On
              most boxes that's <b>10–30</b>, not 300. Past that point more
              connections make throughput <i>worse</i>.
            </>,
            <>
              Set <b>statement_timeout</b> and{" "}
              <b>idle_in_transaction_session_timeout</b>. One forgotten open
              transaction can hold locks and block VACUUM indefinitely.
            </>,
            <>
              Serverless functions and connection pools are natural enemies —
              each invocation wants its own connection. Use a proxy (PgBouncer,
              RDS Proxy, Neon/Supabase pooler) or you'll exhaust the database on
              the first spike.
            </>,
          ]}
        />
      </Block>

      <Block title="Replication, and the lag that bites you">
        <Callout tone="warn" title="Read-your-own-writes">
          The user updates their profile (→ primary), you redirect, the read
          lands on a <b>replica 200ms behind</b>, and they see the <i>old</i>{" "}
          name. So they save again. Now you have a duplicate and a support
          ticket.
          <br />
          <b>Fix:</b> after a user writes, route <i>their</i> reads to the
          primary for a few seconds. Replicas are for <i>other people's</i>{" "}
          data.
        </Callout>
        <RefTable
          head={["Mode", "Guarantee", "Cost"]}
          rows={[
            [
              "Async (default)",
              "replica may lag",
              "fast writes; can lose recent commits on failover",
            ],
            [
              "Sync",
              "commit only once a replica has it",
              "slower writes; no data loss",
            ],
            [
              "Quorum",
              "N of M replicas confirm",
              "the practical middle ground",
            ],
          ]}
        />
      </Block>

      <Block title="Partitioning vs sharding">
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniCard label="Partitioning (one database)">
            Split a huge table by range (usually <b>time</b>) or list. A query
            with a date filter touches <b>one partition</b>, and dropping last
            year is <code>DROP TABLE</code> — instant, instead of a six-hour
            DELETE. Do this first.
          </MiniCard>
          <MiniCard label="Sharding (many databases)">
            Split rows across <b>machines</b> by a shard key. Scales writes and
            storage past one box — and buys you cross-shard joins, global
            uniqueness problems, distributed transactions, and rebalancing.
          </MiniCard>
        </div>
        <Note>
          Choose the shard key by <b>how you query</b> (<code>tenant_id</code>{" "}
          in B2B, <code>user_id</code> in consumer apps). Get it wrong and every
          query fans out to every shard — slower than the single box you left
          behind. Use <b>consistent hashing</b> so adding a node moves ~1/N of
          the keys, not 80% of them.
        </Note>
      </Block>

      <Block title="Migrations and backups — the boring stuff that saves you">
        <Rules
          items={[
            <>
              <b>Migrations are code:</b> versioned, in git, applied by CI,
              never by hand. Every one needs a tested <b>rollback</b>.
            </>,
            <>
              <b>Additive first.</b> Add a nullable column → backfill in batches
              → switch reads → drop the old one. Old and new code run{" "}
              <i>simultaneously</i> during a deploy, so the schema must satisfy
              both.
            </>,
            <>
              <code>CREATE INDEX CONCURRENTLY</code>. A plain{" "}
              <code>CREATE INDEX</code> takes a lock that <b>blocks writes</b> —
              on a big hot table, that's an outage.
            </>,
            <>
              <b>A backup you have never restored is not a backup.</b> Practise
              the restore and <i>time</i> it: “how long to recover?” is a number
              the business needs before the incident, not during it.
            </>,
            <>
              Know your <b>RPO</b> (how much data may I lose?) and <b>RTO</b>{" "}
              (how long may I be down?). <b>PITR</b> — point-in-time recovery,
              built on the WAL — is what lets you rewind to ten seconds before
              the bad <code>DELETE</code>.
            </>,
          ]}
        />
      </Block>

      <Block title="Under the hood: B-tree vs LSM, and the WAL">
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniCard label="B-tree (Postgres, MySQL)">
            Updates in place. <b>Fast, predictable reads.</b> Random writes cost
            more.
          </MiniCard>
          <MiniCard label="LSM tree (Cassandra, RocksDB)">
            Appends to memory, flushes sorted files, compacts later.{" "}
            <b>Very fast writes.</b> A read may have to check several files.
          </MiniCard>
        </div>
        <Note>
          That's <i>why</i> write-heavy stores are LSM-based — the engine choice
          is a read/write trade-off, not a brand preference.
          <br />
          The <b>WAL</b> (write-ahead log) is the trick behind durability: the
          change is appended to a sequential log and <code>fsync</code>ed{" "}
          <i>before</i> the data files are touched, so a crash mid-write is
          repaired by replaying the log. Replication and PITR are built on that
          same log — one log, three jobs.
        </Note>
      </Block>

      <Learn
        links={[
          {
            label: "PgBouncer",
            href: "https://www.pgbouncer.org/usage.html",
            note: "Transaction pooling — the fix for connection exhaustion.",
          },
          {
            label: "PostgreSQL: table partitioning",
            href: "https://www.postgresql.org/docs/current/ddl-partitioning.html",
            note: "Do this long before you think about sharding.",
          },
          {
            label: "The Log — Jay Kreps",
            href: "https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying",
            note: "Why the write-ahead log sits at the centre of modern data systems.",
          },
        ]}
      />

      <RedFlags
        items={[
          "pool size × instance count exceeds what the database will accept",
          "Reading from a replica immediately after writing to the primary",
          "Sharding before indexing, caching, and partitioning",
          "CREATE INDEX (not CONCURRENTLY) on a hot table",
          "Backups that have never once been restored",
        ]}
      />
    </>
  );
}

export const databasesSections: ProSection[] = [
  {
    id: "choosing",
    title: "Choosing a database",
    icon: "🧭",
    kicker:
      "SQL vs NoSQL, what each engine is genuinely for, and why Postgres is the default answer.",
    minutes: 6,
    Content: Choosing,
  },
  {
    id: "modelling",
    title: "Data modelling",
    icon: "📐",
    kicker:
      "One fact in one place, constraints the database enforces, and denormalising on purpose.",
    minutes: 7,
    Content: Modelling,
  },
  {
    id: "indexes",
    title: "Indexes & query plans",
    icon: "🔍",
    kicker:
      "How a B-tree finds a row in three hops, how to read an EXPLAIN plan, and how to find the query that's actually slow.",
    minutes: 9,
    Content: Indexes,
  },
  {
    id: "transactions",
    title: "Transactions & locking",
    icon: "🔒",
    kicker:
      "Isolation levels, the lost update you will write, deadlocks, and what MVCC costs you.",
    minutes: 8,
    Content: Transactions,
  },
  {
    id: "scaling",
    title: "Scaling & operations",
    icon: "📈",
    kicker:
      "Connection pools, replica lag, partitioning vs sharding, migrations, backups, and the WAL.",
    minutes: 9,
    Content: Scaling,
  },
];
