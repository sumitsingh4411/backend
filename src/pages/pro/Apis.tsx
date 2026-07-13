import type { ProSection } from "../../lib/proTopics";
import {
  Block,
  Callout,
  Ladder,
  Learn,
  MiniCard,
  Note,
  RedFlags,
  RefTable,
  Rules,
  Snippet,
  VS,
} from "../../components/ProKit";

/* ─────────────────────────── 01 · REST design ─────────────────────────── */

function Rest() {
  return (
    <>
      <Block title="Resources are nouns. Methods are the verbs.">
        <VS
          good={{
            title: "Resource-oriented",
            body: (
              <Snippet
                lang="text"
                code={`GET    /users            list
POST   /users            create
GET    /users/42         read one
PATCH  /users/42         partial update
DELETE /users/42         delete
GET    /users/42/orders  a sub-resource`}
              />
            ),
          }}
          bad={{
            title: "RPC in a trench coat",
            body: (
              <Snippet
                lang="text"
                code={`POST /getUser
POST /createUserV2
POST /updateUserEmailNow
POST /deleteUserReally
GET  /getAllOrdersForUser?id=42`}
              />
            ),
          }}
        />
        <Note>
          Plural nouns. Lowercase, hyphenated paths (<code>/order-items</code>).
          Nest only <b>one</b> level deep —{" "}
          <code>/users/42/orders/7/items/3</code> is a URL nobody can maintain.
          Once a sub-resource has its own identity, give it a top-level path:{" "}
          <code>/orders/7/items</code>.
        </Note>
      </Block>

      <Block title="Safe, idempotent, neither">
        <RefTable
          head={["Method", "Safe?", "Idempotent?", "Meaning"]}
          rows={[
            ["GET", "yes", "yes", "read, never changes state"],
            ["PUT", "no", "yes", "replace the whole resource"],
            ["PATCH", "no", "usually", "change some fields"],
            ["DELETE", "no", "yes", "gone; deleting twice is still gone"],
            ["POST", "no", "NO ❗", "create / do — the dangerous one"],
          ]}
        />
        <Callout
          tone="warn"
          title="Idempotent means: doing it twice = doing it once"
        >
          This isn't trivia. A flaky network causes retries, and retries hit{" "}
          <b>POST</b> hardest — the client never learns whether the first
          attempt worked, so it tries again and creates a second order.
          Everything else on this list is naturally safe to repeat. POST needs
          help (see <i>Idempotency & webhooks</i>).
        </Callout>
      </Block>

      <Block title="Status codes that mean something">
        <RefTable
          head={["Code", "Say it when"]}
          rows={[
            ["200 OK", "it worked and here's the body"],
            [
              "201 Created",
              "you made something — return it, plus a Location header",
            ],
            [
              "202 Accepted",
              "queued; it will happen later (give them a status URL)",
            ],
            ["204 No Content", "it worked, there's nothing to send back"],
            ["400 Bad Request", "malformed / invalid input"],
            [
              "401 Unauthorized",
              "I don't know who you are (really: unauthenticated)",
            ],
            ["403 Forbidden", "I know who you are, and no"],
            [
              "404 Not Found",
              "no such resource — also the right answer to hide one",
            ],
            [
              "409 Conflict",
              "it clashes with current state (duplicate, version mismatch)",
            ],
            [
              "422 Unprocessable",
              "syntax fine, semantics wrong (email already taken)",
            ],
            ["429 Too Many Requests", "rate limited — always add Retry-After"],
            ["500 Internal", "we broke. never leak the stack trace"],
            ["503 Unavailable", "overloaded or down — Retry-After again"],
          ]}
        />
        <Callout
          tone="bad"
          title="200 OK { error: true } is the worst thing you can do"
        >
          Every client, proxy, retry policy, monitor and alerting rule in the
          world reads the <b>status code</b>. Lie in it and none of them work:
          your error rate looks like 0%, your dashboards are green, and your
          users are stuck. <b>The status line is part of the API</b>, not
          decoration.
        </Callout>
      </Block>

      <Learn
        links={[
          {
            label: "MDN: HTTP response status codes",
            href: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status",
            note: "The reference. Bookmark it.",
          },
          {
            label: "Google API Design Guide",
            href: "https://cloud.google.com/apis/design",
            note: "How a company with thousands of APIs keeps them consistent.",
          },
          {
            label: "Stripe API reference",
            href: "https://docs.stripe.com/api",
            note: "The gold standard. Copy its shapes, its errors, its docs.",
          },
        ]}
      />

      <RedFlags
        items={[
          "Verbs in the path (/getUser, /doPayment)",
          "200 with an error body",
          "401 and 403 used interchangeably",
          "Deep nesting (/a/1/b/2/c/3)",
          "POST used for reads because 'the query got long'",
        ]}
      />
    </>
  );
}

/* ─────────────────────── 02 · Pagination, filtering, errors ───────────── */

function Payloads() {
  return (
    <>
      <Block title="🚨 Never return an unbounded list">
        <Callout tone="bad" title="GET /users with no limit is a time bomb">
          It works beautifully with 50 users in dev, and takes the database down
          when a customer has 400,000.{" "}
          <b>
            Every collection endpoint has a default limit and a maximum limit
          </b>{" "}
          — no exceptions, from day one.
        </Callout>
        <RefTable
          head={["Style", "Good", "Bad"]}
          rows={[
            [
              "Offset (?page=3)",
              "simple, jump to any page",
              "slow at depth; rows shift under you",
            ],
            [
              "Cursor (?after=…) ⭐",
              "stable, fast at any depth",
              "no random page access",
            ],
          ]}
        />
        <Snippet
          lang="sql"
          code={`-- ❌ OFFSET: the database must WALK AND DISCARD 100,000 rows first
SELECT * FROM posts ORDER BY created_at DESC LIMIT 20 OFFSET 100000;

-- ✅ CURSOR ("keyset"): jump straight to the position via the index
SELECT * FROM posts
 WHERE (created_at, id) < ($1, $2)      -- the cursor from the last page
 ORDER BY created_at DESC, id DESC
 LIMIT 20;
-- constant time at page 1 and page 50,000`}
        />
        <Note>
          Offset also has a <b>correctness</b> bug, not just a speed one: if
          someone inserts a row while the user pages, rows shift down and page 2
          repeats an item from page 1. Cursors are anchored to a <i>row</i>, so
          they can't skip or duplicate. Include the <b>id as a tiebreaker</b> —
          timestamps collide more than you think.
        </Note>
      </Block>

      <Block title="One response envelope, everywhere">
        <Snippet
          lang="json"
          code={`{
  "data": [ { "id": "usr_42", "email": "a@b.com" } ],
  "page": {
    "next_cursor": "eyJjIjoiMjAyNC0wMS0wMSJ9",
    "has_more": true
  }
}`}
        />
        <Rules
          items={[
            <>
              <b>Filtering:</b> <code>?status=active&amp;created_after=…</code>.
              Whitelist the fields — never interpolate a query param into SQL,
              and never let a client sort by an unindexed column.
            </>,
            <>
              <b>Sparse fields:</b> <code>?fields=id,name</code> lets a mobile
              client stop downloading 40KB it will never render.
            </>,
            <>
              <b>Prefixed ids</b> (<code>usr_42</code>, <code>ord_7</code>) — a
              trick borrowed from Stripe. You can tell at a glance what an id
              is, and passing an order id where a user id belongs fails loudly
              instead of silently returning someone else's data.
            </>,
          ]}
        />
      </Block>

      <Block title="Errors people can actually act on">
        <VS
          good={{
            title: "Structured, specific, traceable",
            body: (
              <Snippet
                lang="json"
                code={`{
  "error": {
    "type": "validation_error",
    "message": "Email is already registered.",
    "fields": { "email": "already_taken" },
    "request_id": "req_01HZX9"
  }
}`}
              />
            ),
          }}
          bad={{
            title: "Useless, and a security leak",
            body: (
              <Snippet
                lang="json"
                code={`{ "error": "Something went wrong" }

{ "error": "PG::UniqueViolation:
   duplicate key value violates
   constraint users_email_key
   at /app/db/users.rb:42" }`}
              />
            ),
          }}
        />
        <Callout
          tone="info"
          title="request_id is the single highest-leverage field in your API"
        >
          Put the same id in the response body, the response header, and every
          log line for that request. Now a user pastes <code>req_01HZX9</code>{" "}
          into a support ticket, and you find the exact request across five
          services in one search. Without it, support is archaeology.
        </Callout>
        <Note>
          Consider <b>RFC 9457 (problem+json)</b> for a standard error shape.
          Whatever you choose — <b>be consistent</b>. A client should be able to
          write one error handler for your whole API.
        </Note>
      </Block>

      <Learn
        links={[
          {
            label: "Cursor pagination, properly explained",
            href: "https://use-the-index-luke.com/no-offset",
            note: "Why OFFSET gets slower the deeper you go — with the SQL to fix it.",
          },
          {
            label: "RFC 9457 — Problem Details for HTTP APIs",
            href: "https://www.rfc-editor.org/rfc/rfc9457.html",
            note: "A standard error body, so clients don't have to guess.",
          },
          {
            label: "JSON:API specification",
            href: "https://jsonapi.org/",
            note: "If you'd rather adopt an envelope than invent one.",
          },
        ]}
      />

      <RedFlags
        items={[
          "A list endpoint with no default limit",
          "OFFSET pagination on a table that grows",
          "Errors that are a bare string",
          "Database error text returned to the client",
          "A different response shape on every endpoint",
        ]}
      />
    </>
  );
}

/* ─────────────────────── 03 · Versioning & evolution ──────────────────── */

function Evolution() {
  return (
    <>
      <Block title="You cannot un-ship a field">
        <Callout
          tone="warn"
          title="Someone's mobile app from 2021 is still calling you"
        >
          Web clients update when you deploy. <b>Mobile apps don't</b> — a user
          on an old build may never update. Once a field is public, assume it is
          load-bearing for someone, forever.
        </Callout>
        <RefTable
          head={["Change", "Breaking?"]}
          rows={[
            ["Add an optional field to a response", "no ✅"],
            ["Add an optional request parameter", "no ✅"],
            ["Add a new endpoint", "no ✅"],
            ["Remove or rename a field", "YES ❌"],
            ["Change a type (string → number)", "YES ❌"],
            ["Make an optional param required", "YES ❌"],
            [
              "Add a value to an enum",
              "maybe ⚠️ — strict clients reject unknowns",
            ],
            ["Change a default", "YES ❌ — silently changes behaviour"],
          ]}
        />
      </Block>

      <Block title="How to version">
        <Rules
          items={[
            <>
              <b>URL versioning</b> (<code>/v1/users</code>) — ugly, obvious,
              cacheable, and by far the easiest to operate. Start here.
            </>,
            <>
              <b>Header versioning</b> (
              <code>Accept: application/vnd.api.v2+json</code>) — cleaner URLs,
              but invisible in logs and easy to get wrong in a curl. Now your
              cache key must include the header.
            </>,
            <>
              <b>Don't version at all — evolve.</b> Only additive changes, ever.
              This is the discipline that lets Stripe run one API for a decade.
            </>,
            <>
              When you must break: run <b>both versions side by side</b>,
              announce a deprecation date, send a <code>Deprecation</code>/
              <code>Sunset</code> header, measure who's still calling v1, and
              turn it off only when that number is zero (or you've emailed
              everyone left).
            </>,
          ]}
        />
        <Note>
          <b>Clients must ignore unknown fields.</b> If your client crashes when
          the server adds a field, <i>your client</i> is the bug — and every
          server change becomes a breaking change.
        </Note>
      </Block>

      <Block title="The contract is the product">
        <Ladder
          steps={[
            [
              "Write the OpenAPI spec first",
              "the contract, not an afterthought",
            ],
            [
              "Generate types/clients from it",
              "frontend and backend cannot drift",
            ],
            ["Validate requests against it", "the spec becomes runtime truth"],
            ["Publish it", "docs, Swagger UI, a Postman collection"],
            [
              "Contract-test it in CI",
              "a breaking change fails the build, not production",
            ],
          ]}
        />
        <Note>
          Hand-written docs are wrong within a month. Generated docs are wrong
          only when the code is.
        </Note>
      </Block>

      <Learn
        links={[
          {
            label: "OpenAPI specification",
            href: "https://spec.openapis.org/oas/latest.html",
            note: "The contract format everything else generates from.",
          },
          {
            label: "Stripe's API versioning strategy",
            href: "https://stripe.com/blog/api-versioning",
            note: "How to never break a client while shipping constantly.",
          },
          {
            label: "Zalando RESTful API guidelines",
            href: "https://opensource.zalando.com/restful-api-guidelines/",
            note: "The most complete public style guide for REST APIs.",
          },
        ]}
      />

      <RedFlags
        items={[
          "Renaming a field 'because it's cleaner'",
          "Changing a default value in place",
          "A client that crashes on unknown fields",
          "Deprecating v1 with no measurement of who still uses it",
          "Docs written by hand, drifting from the code",
        ]}
      />
    </>
  );
}

/* ─────────────────── 04 · Idempotency, limits, CORS, webhooks ─────────── */

function Robustness() {
  return (
    <>
      <Block title="🚨 Idempotency keys — how you stop double charges">
        <Callout tone="bad" title="The lost response, not the lost request">
          The client POSTs a payment. Your server charges the card and{" "}
          <i>then</i> the connection drops. The client sees a timeout and has{" "}
          <b>no way to know</b> whether it worked — so it retries.{" "}
          <b>The customer is charged twice.</b>
        </Callout>
        <Snippet
          lang="javascript"
          code={`// Client sends a key it generated (a UUID) — same key on every retry
// POST /payments   Idempotency-Key: 4f8c...e21

app.post("/payments", async (req, res) => {
  const key = req.header("Idempotency-Key");
  if (!key) return res.status(400).json({ error: "Idempotency-Key required" });

  // UNIQUE(key) on the table is what makes this a real guarantee
  const existing = await db.idempotency.find(key);
  if (existing) return res.status(existing.status).json(existing.response); // replay

  const result = await charge(req.body);
  await db.idempotency.insert({ key, status: 201, response: result }); // same txn
  res.status(201).json(result);
});`}
        />
        <Note>
          Store the key <b>and the response</b>, so a retry replays the original
          result instead of doing the work again. Expire keys after ~24h. This
          is exactly how Stripe, and every payments API worth using, works.
        </Note>
      </Block>

      <Block title="Rate limiting">
        <Rules
          items={[
            <>
              <b>Token bucket</b> is the default: a bucket of N tokens refilled
              at a steady rate. It allows the <b>short natural bursts</b> real
              users create while still enforcing an average.
            </>,
            <>
              Counters live in <b>Redis</b>, not in process memory — otherwise
              your limit is silently multiplied by the number of instances.
              Increment with an <b>atomic Lua script</b>: a read-then-write is a
              race, and two servers will both let request #100 through.
            </>,
            <>
              Answer <code>429</code> with <b>Retry-After</b>, and send{" "}
              <code>X-RateLimit-Limit / -Remaining / -Reset</code> on every
              response so good clients can self-pace.
            </>,
            <>
              Limit per <b>API key or user</b>, not per IP — one office NAT is
              thousands of users, and one attacker has thousands of IPs.
            </>,
            <>
              Decide <b>fail-open vs fail-closed</b> when Redis is down. Open
              for a normal API (a cache outage shouldn't take the product down),
              closed for login and payments.
            </>,
          ]}
        />
      </Block>

      <Block title="CORS — what it actually is">
        <Callout
          tone="info"
          title="A browser rule. Not a security feature of your API."
        >
          The <b>same-origin policy</b> stops JavaScript on{" "}
          <code>evil.com</code> from reading a response from{" "}
          <code>your-api.com</code>. CORS headers are how your server says “this
          origin may read me”.
          <br />
          It is enforced <b>by the browser, for browsers</b>. curl, Postman, a
          Go service and an attacker's script <b>ignore it entirely</b>. So CORS
          protects your <i>users</i>; it does nothing to protect your API.{" "}
          <b>Auth is what protects your API.</b>
        </Callout>
        <Rules
          items={[
            <>
              A <b>preflight</b> <code>OPTIONS</code> request happens before
              anything non-simple (custom headers, PUT/DELETE, JSON content
              type). Answer it, and cache it with{" "}
              <code>Access-Control-Max-Age</code>.
            </>,
            <>
              <code>Access-Control-Allow-Origin: *</code> <b>cannot</b> be
              combined with credentials. Echo a specific allowed origin instead
              — and never reflect whatever origin was sent without checking it
              against a list.
            </>,
          ]}
        />
      </Block>

      <Block title="Webhooks — being a good API citizen">
        <Rules
          items={[
            <>
              <b>Sign every payload</b> (HMAC-SHA256 with a shared secret) and
              verify it over the <b>raw body</b> — parsing to JSON and
              re-serialising changes the bytes and the signature will never
              match.
            </>,
            <>
              Include a <b>timestamp</b> in the signed payload and reject old
              ones — otherwise a captured request can be <b>replayed</b>{" "}
              forever.
            </>,
            <>
              <b>Respond 200 fast, then do the work.</b> Push it onto a queue.
              If you process inline and take 30 seconds, the sender times out
              and retries — and now you're doing it twice.
            </>,
            <>
              <b>Retry with exponential backoff</b> when you're the sender, and
              expect duplicates when you're the receiver —{" "}
              <b>webhooks are at-least-once</b>. Dedupe on the event id.
            </>,
          ]}
        />
      </Block>

      <Learn
        links={[
          {
            label: "Stripe: idempotent requests",
            href: "https://docs.stripe.com/api/idempotent_requests",
            note: "The canonical design. Two pages, and you'll never double-charge.",
          },
          {
            label: "MDN: CORS",
            href: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS",
            note: "Preflights, credentials, and every header explained.",
          },
          {
            label: "Standard Webhooks",
            href: "https://www.standardwebhooks.com/",
            note: "An open spec for signing, timestamps and retries.",
          },
        ]}
      />

      <RedFlags
        items={[
          "POST /payments with no idempotency key",
          "Rate limits counted in process memory",
          "Verifying a webhook signature against the re-serialised body",
          "Processing a webhook inline for 30 seconds",
          "Reflecting any Origin back in Access-Control-Allow-Origin",
        ]}
      />
    </>
  );
}

/* ─────────────────────── 05 · Beyond REST ─────────────────────────────── */

function BeyondRest() {
  return (
    <>
      <Block title="REST vs GraphQL vs gRPC">
        <RefTable
          head={["", "REST", "GraphQL", "gRPC"]}
          rows={[
            [
              "Best for",
              "public APIs, CRUD",
              "many clients, varied shapes",
              "service-to-service",
            ],
            [
              "Transport",
              "HTTP/JSON",
              "HTTP/JSON",
              "HTTP/2 + protobuf (binary)",
            ],
            [
              "Schema",
              "OpenAPI (optional)",
              "built in, mandatory",
              "built in, mandatory",
            ],
            ["Caching", "free (HTTP)", "you build it", "you build it"],
            [
              "Streaming",
              "SSE / WebSockets",
              "subscriptions",
              "native, both directions",
            ],
            ["Browser support", "native", "native", "needs a proxy (grpc-web)"],
          ]}
        />
      </Block>

      <Block title="What GraphQL actually solves — and costs">
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniCard label="Solves">
            <b>Over-fetching</b> (mobile downloads 40KB to show a name) and{" "}
            <b>under-fetching</b> (six round trips to render one screen). The
            client asks for exactly the tree it needs, once.
          </MiniCard>
          <MiniCard label="Costs">
            HTTP caching is gone (everything is a POST to <code>/graphql</code>
            ). <b>N+1 is the default</b> — every field is a resolver; you need{" "}
            <b>DataLoader</b> from day one. And a malicious client can ask for a
            deeply nested query that melts your database.
          </MiniCard>
        </div>
        <Note>
          If you adopt it: <b>depth-limit and cost-limit every query</b>,
          persist the allowed queries, and batch every resolver. GraphQL without
          DataLoader is a performance incident with a nice schema.
        </Note>
      </Block>

      <Block title="Real-time: pick the lightest thing that works">
        <RefTable
          head={["Need", "Use"]}
          rows={[
            ["Client asks, server answers", "plain HTTP"],
            [
              "Server pushes updates one way (feeds, progress, notifications)",
              "SSE — simple, over plain HTTP, auto-reconnects",
            ],
            [
              "Both directions, low latency (chat, presence, games)",
              "WebSockets",
            ],
            ["Service → service, high volume, typed", "gRPC"],
          ]}
        />
        <Callout tone="warn" title="WebSockets make your servers stateful">
          A socket lives on <i>one</i> instance. Alice on server-1 can't be
          reached by server-3 — so you need a <b>pub/sub backbone</b> (Redis,
          NATS, Kafka) between them, plus sticky sessions or a presence
          registry. <b>Don't reach for WebSockets when SSE would do.</b>
        </Callout>
      </Block>

      <Learn
        links={[
          {
            label: "gRPC — core concepts",
            href: "https://grpc.io/docs/what-is-grpc/core-concepts/",
            note: "Protobuf, streaming, deadlines — the internal-API workhorse.",
          },
          {
            label: "GraphQL — best practices",
            href: "https://graphql.org/learn/best-practices/",
            note: "Read the caching and N+1 sections before you commit.",
          },
          {
            label: "MDN: Server-Sent Events",
            href: "https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events",
            note: "The one-way push most teams should be using instead of WebSockets.",
          },
        ]}
      />

      <RedFlags
        items={[
          "GraphQL with no DataLoader, depth limit, or cost limit",
          "WebSockets for something a 5-second poll or SSE would solve",
          "gRPC exposed directly to browsers",
          "Choosing the transport before knowing the access pattern",
        ]}
      />
    </>
  );
}

export const apisSections: ProSection[] = [
  {
    id: "rest",
    title: "REST design",
    icon: "🧱",
    kicker:
      "Resources, methods, and status codes that every client, proxy and monitor already understands.",
    minutes: 7,
    Content: Rest,
  },
  {
    id: "payloads",
    title: "Pagination, filtering & errors",
    icon: "📄",
    kicker:
      "Cursor pagination, one response envelope, and errors a human can act on.",
    minutes: 7,
    Content: Payloads,
  },
  {
    id: "evolution",
    title: "Versioning & evolution",
    icon: "🔀",
    kicker:
      "What breaks a client, how to version, and why the contract is the product.",
    minutes: 6,
    Content: Evolution,
  },
  {
    id: "robustness",
    title: "Idempotency, limits & webhooks",
    icon: "🛡️",
    kicker:
      "Stop double charges, rate-limit properly, understand CORS, and send webhooks people trust.",
    minutes: 8,
    Content: Robustness,
  },
  {
    id: "beyond-rest",
    title: "GraphQL, gRPC & real-time",
    icon: "🛰️",
    kicker:
      "When REST isn't the answer — and what each alternative actually costs you.",
    minutes: 6,
    Content: BeyondRest,
  },
];
