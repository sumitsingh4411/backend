import type { ProSection } from "../../lib/proTopics";
import {
  Block,
  Callout,
  FeaturedLink,
  Ladder,
  Learn,
  MiniCard,
  Note,
  RedFlags,
  RefTable,
  Rules,
  Snippet,
} from "../../components/ProKit";

/**
 * The featured DevOps resource — sits at the top of every DevOps page so it's
 * one tap away wherever you are in the topic.
 */
const devopsResource = (
  <FeaturedLink
    eyebrow="Featured · learn more"
    title="DevOps guides, tooling & interview prep"
    note="Hands-on roadmaps and job-ready practice at"
    href="https://devops.nextjoblist.com/"
  />
);

/* ─────────────────────────── 01 · Containers ─────────────────────────── */

function Containers() {
  return (
    <>
      {devopsResource}
      <Block title="Why containers won">
        <Callout
          tone="info"
          title="'Works on my machine' becomes 'ships as one artifact'"
        >
          A container bundles your app <i>and</i> its entire runtime —
          libraries, system deps, the lot — into one image. The image that
          passed CI is byte-for-byte the image that runs in production. That
          reproducibility, not isolation, is the whole point.
        </Callout>
        <Rules
          items={[
            <>
              <b>Image</b> = the immutable, versioned blueprint.{" "}
              <b>Container</b> = a running instance of it. One image → many
              identical containers — that's how you scale horizontally.
            </>,
            <>
              <b>Containers are ephemeral.</b> Never store data inside one — it
              vanishes on restart. State goes to a volume, a database, or object
              storage.
            </>,
          ]}
        />
      </Block>

      <Block title="A Dockerfile that isn't slow and insecure">
        <Snippet
          lang="dockerfile"
          code={`# Multi-stage: build in one stage, ship a lean runtime
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci                      # ← cached UNLESS package files change
COPY . .
RUN npm run build

FROM node:22-alpine             # final image: no build tools, much smaller
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
USER node                       # ✅ don't run as root
CMD ["node", "dist/server.js"]`}
        />
        <Rules
          items={[
            <>
              <b>Copy package files and install deps BEFORE the source.</b> Each
              instruction is a cached layer, and a changed layer invalidates{" "}
              <b>every layer after it</b>. Copy source first and you reinstall
              every dependency on every one-line change.
            </>,
            <>
              <b>Multi-stage build.</b> Compile in a fat stage, copy only the
              output into a tiny runtime stage — smaller images pull faster and
              carry a smaller attack surface (no compilers in production).
            </>,
            <>
              <b>Never bake secrets into an image.</b> Anyone who pulls it can
              read every layer. Inject at runtime.
            </>,
            <>
              <b>Run as non-root</b>, <b>pin versions</b> (
              <code>node:22-alpine</code>, never <code>:latest</code> —
              reproducibility is the point), and use a{" "}
              <code>.dockerignore</code> so you don't copy{" "}
              <code>node_modules</code> or <code>.env</code> into the build.
            </>,
          ]}
        />
      </Block>

      <Learn
        links={[
          {
            label: "Docker: build best practices",
            href: "https://docs.docker.com/build/building/best-practices/",
            note: "Layer caching, multi-stage, and image size — from the source.",
          },
          {
            label: "Google: distroless images",
            href: "https://github.com/GoogleContainerTools/distroless",
            note: "The smallest, most secure base images — just your app and its runtime.",
          },
          {
            label: "Docker curriculum (hands-on)",
            href: "https://docker-curriculum.com/",
            note: "From zero to multi-container, if containers are new to you.",
          },
        ]}
      />

      <RedFlags
        items={[
          "COPY . . before installing dependencies",
          "FROM …:latest instead of a pinned version",
          "Running as root",
          "Secrets baked into image layers",
          "Storing data inside a container",
        ]}
      />
    </>
  );
}

/* ─────────────────────────── 02 · Orchestration ──────────────────────── */

function Orchestration() {
  return (
    <>
      {devopsResource}
      <Block title="Kubernetes — the 20% you actually need">
        <Note>
          You <b>declare desired state</b>; Kubernetes continuously makes
          reality match it. “I want 3 replicas” → a pod dies, it starts another.
          Forever, without you. That reconciliation loop is the entire idea.
        </Note>
        <RefTable
          head={["Object", "What it is"]}
          rows={[
            [
              "Pod",
              "the smallest unit — disposable, killed and replaced constantly",
            ],
            [
              "Deployment",
              "manages N identical pods · rolling updates · rollback",
            ],
            ["Service", "a STABLE address + load balancing over changing pods"],
            ["Ingress", "routes external HTTP in (host/path + TLS)"],
            [
              "ConfigMap / Secret",
              "inject config and secrets as env vars or files",
            ],
            ["HPA", "autoscale replicas on CPU / custom metrics"],
          ]}
        />
      </Block>

      <Block title="The two probes — get these right">
        <Callout
          tone="warn"
          title="Confusing liveness and readiness causes classic outages"
        >
          <b>livenessProbe</b> — “are you alive?” Fails → <b>restart the pod</b>
          .
          <br />
          <b>readinessProbe</b> — “can you take traffic <i>right now</i>?” Fails
          (DB unreachable, still warming up) → <b>pull from the Service</b>, but{" "}
          <i>don't</i> kill it.
          <br />A slow-starting app with an aggressive liveness probe gets{" "}
          <b>restart-looped forever</b> — it never lives long enough to finish
          booting. Add a <b>startupProbe</b> for slow boots, and always set{" "}
          <b>resource requests/limits</b> so one greedy pod can't starve the
          node.
        </Callout>
      </Block>

      <Block title="Do you even need Kubernetes?">
        <Callout tone="info" title="Usually, not yet">
          Kubernetes is a distributed operating system with a real learning
          curve and real ops cost. With a handful of services, a <b>PaaS</b>{" "}
          (Render, Fly.io, Railway, App Runner) gives you 90% of the benefit for
          10% of the complexity — deploys, scaling, TLS, and rollbacks without a
          cluster to babysit.{" "}
          <b>Reach for Kubernetes when you've outgrown the PaaS</b>, not before.
          “We might need it later” is not “we need it now”.
        </Callout>
      </Block>

      <Learn
        links={[
          {
            label: "Kubernetes: concepts",
            href: "https://kubernetes.io/docs/concepts/",
            note: "Pods, Deployments, Services — the mental model, official.",
          },
          {
            label: "Kubernetes the Hard Way",
            href: "https://github.com/kelseyhightower/kubernetes-the-hard-way",
            note: "Build a cluster by hand once and it stops being magic.",
          },
          {
            label: "The Twelve-Factor App",
            href: "https://12factor.net/",
            note: "The principles that make an app deployable anywhere — read before any platform.",
          },
        ]}
      />

      <RedFlags
        items={[
          "Kubernetes for three services and no ops team",
          "Liveness and readiness probes conflated",
          "No resource requests/limits → one pod starves the node",
          "No startupProbe on a slow-booting app → restart loop",
        ]}
      />
    </>
  );
}

/* ─────────────────────────── 03 · CI/CD & releases ───────────────────── */

function CiCd() {
  return (
    <>
      {devopsResource}
      <Block title="The pipeline is the only path to production">
        <Rules
          items={[
            <>
              <b>Order stages fast-to-slow:</b> lint → typecheck → unit → build
              → integration → security scan → deploy. <b>Fail in 20 seconds</b>,
              not 20 minutes.
            </>,
            <>
              <b>Build once, promote the SAME artifact</b> through staging →
              prod. Rebuilding per environment means you never tested what you
              actually ship.
            </>,
            <>
              <b>
                No manual <code>scp</code>, ever.
              </b>{" "}
              If the pipeline is the only way to production, then production
              always matches a known commit — and rollback means redeploying a
              known-good one.
            </>,
            <>
              <b>Keep it under 10 minutes.</b> A 45-minute pipeline gets
              bypassed by frustrated humans, and a bypassed pipeline protects
              nothing.
            </>,
            <>
              <b>Make rollback trivial — and practise it.</b> The best incident
              response is “roll back first, investigate second”. A rollback path
              you've never tested is not a rollback path.
            </>,
          ]}
        />
      </Block>

      <Block title="Deployment strategies">
        <RefTable
          head={["Strategy", "Downtime", "Blast radius"]}
          rows={[
            ["Recreate", "yes ❌", "everyone, briefly down"],
            ["Rolling (K8s default)", "none", "grows as pods swap"],
            [
              "Blue-green",
              "none",
              "100% switch at once — instant rollback (flip the LB)",
            ],
            ["Canary ⭐", "none", "a bug hits 5% of users, not all of them"],
          ]}
        />
        <Note>
          <b>Automate the canary decision:</b> compare the new version's error
          rate and p95 against the baseline and <b>auto-rollback</b> if it
          degrades (Argo Rollouts, Flagger). A canary nobody is watching is just
          a slow deploy.
        </Note>
      </Block>

      <Block title="Feature flags — deploying ≠ releasing">
        <Callout tone="good" title="Separate the risky moment from the deploy">
          Ship code to production <b>dark</b> (disabled), continuously. Then
          turn it on for 1% → your team → 10% → everyone, from a dashboard —{" "}
          <i>without</i> a redeploy. A bug? <b>Flip the flag off in seconds.</b>
          <br />
          This is how companies deploy dozens of times a day safely: the
          dangerous moment isn't the deploy, it's the <i>release</i> — and a
          flag makes the release instantly reversible and gradual.
        </Callout>
        <Note>
          ⚠️ Flags are debt. <b>Delete them</b> once a feature is fully rolled
          out, or you'll drown in dead branches and combinatorial test cases.
        </Note>
      </Block>

      <Learn
        links={[
          {
            label: "Google: DORA / Accelerate metrics",
            href: "https://dora.dev/",
            note: "Deploy frequency, lead time, change-fail rate, MTTR — the four that predict performance.",
          },
          {
            label: "Martin Fowler: Continuous Integration",
            href: "https://martinfowler.com/articles/continuousIntegration.html",
            note: "What CI actually means, beyond 'we have a pipeline'.",
          },
          {
            label: "Feature Toggles (Pete Hodgson)",
            href: "https://martinfowler.com/articles/feature-toggles.html",
            note: "The taxonomy of flags and how to keep them from rotting.",
          },
        ]}
      />

      <RedFlags
        items={[
          "Rebuilding the artifact per environment",
          "Any manual step to reach production",
          "A pipeline slow enough that people route around it",
          "A rollback path you have never actually tested",
          "Feature flags that never get cleaned up",
        ]}
      />
    </>
  );
}

/* ─────────────────────────── 04 · Zero-downtime migrations ───────────── */

function Migrations() {
  return (
    <>
      {devopsResource}
      <Block title="🚨 Old and new code run at the same time">
        <Callout tone="bad" title="This is the fact that makes migrations hard">
          During any rolling or canary deploy, both the old and new versions hit
          the <b>same database</b> for minutes. So{" "}
          <b>the schema must work with BOTH</b> at once.
          <br />
          Run <code>ALTER TABLE users RENAME COLUMN name TO full_name</code> and
          every still-running old instance — which queries <code>name</code> —{" "}
          <b>starts throwing errors instantly</b>. You've caused an outage in
          the middle of a “zero-downtime” deploy.
        </Callout>
      </Block>

      <Block title="Expand / contract — the six-step rename">
        <Ladder
          ordered
          steps={[
            [
              "EXPAND — add the new column (nullable)",
              "old code ignores it · nothing breaks",
            ],
            [
              "Deploy code that WRITES BOTH, reads the old",
              "the columns stay in sync from now on",
            ],
            [
              "BACKFILL in batches",
              "never one giant UPDATE that locks millions of rows",
            ],
            [
              "Deploy code that READS the new column",
              "safe now — it's fully populated",
            ],
            [
              "Deploy code that stops using the old one",
              "nothing references it any more",
            ],
            [
              "CONTRACT — finally drop the old column",
              "the schema is clean again",
            ],
          ]}
        />
        <Note>
          Six steps and several deploys to rename one column.{" "}
          <b>That is the real cost of zero downtime</b> — and why experienced
          engineers are so careful with schema changes. Ship each step as its
          own small, reversible deploy.
        </Note>
      </Block>

      <Block title="Safe vs dangerous operations">
        <RefTable
          head={["✅ Safe (backward-compatible)", "❌ Dangerous"]}
          rows={[
            ["Add a NULLABLE column", "Add NOT NULL without a default"],
            ["Add a new table", "Drop a column/table still in use"],
            ["Add an index CONCURRENTLY", "Rename a column"],
            ["Add a new optional API field", "Change a column's type"],
            ["Backfill in small batches", "One UPDATE across millions of rows"],
            ["", "Add a constraint existing rows violate"],
          ]}
        />
        <Callout tone="warn" title="Two Postgres-specific landmines">
          <code>CREATE INDEX CONCURRENTLY</code> — a plain{" "}
          <code>CREATE INDEX</code> <b>locks writes</b> on the table, which on a
          big hot table is an outage.
          <br />
          Adding a column with a <b>volatile default</b> can rewrite the whole
          table under a lock on older engines. Add the column, then backfill
          separately.
        </Callout>
      </Block>

      <Learn
        links={[
          {
            label: "Expand/contract pattern (PlanetScale)",
            href: "https://planetscale.com/blog/backwards-compatible-databases-changes",
            note: "The rename dance, worked through with real DDL.",
          },
          {
            label: "strong_migrations (Rails, but universal)",
            href: "https://github.com/ankane/strong_migrations",
            note: "A catalogue of dangerous operations and their safe rewrites.",
          },
          {
            label: "PostgreSQL: ALTER TABLE locking",
            href: "https://www.postgresql.org/docs/current/sql-altertable.html",
            note: "Exactly which changes take which lock. Know before you run one.",
          },
        ]}
      />

      <RedFlags
        items={[
          "Renaming or dropping a column in a single migration",
          "CREATE INDEX (not CONCURRENTLY) on a hot table",
          "One UPDATE that locks millions of rows",
          "Adding NOT NULL with no default to an existing table",
          "A migration with no rollback",
        ]}
      />
    </>
  );
}

/* ─────────────────────────── 05 · IaC & observability ────────────────── */

function IacObservability() {
  return (
    <>
      {devopsResource}
      <Block title="Infrastructure as Code">
        <Rules
          items={[
            <>
              <b>ClickOps drifts.</b> Infrastructure clicked together in a
              console isn't reproducible, reviewable, versioned, or recoverable
              — and it <b>drifts</b> from what you think you have. If it isn't
              in code, it doesn't really exist.
            </>,
            <>
              IaC is <b>declarative</b>: you state the desired end state and the
              tool computes the diff. <code>terraform plan</code> ⇒{" "}
              <code>terraform apply</code>.
            </>,
            <>
              <b>ALWAYS read the plan</b> — especially any line that says{" "}
              <code>destroy</code>. It's your last defence against “it's going
              to delete the production database.” Put <code>plan</code> in CI on
              every PR.
            </>,
            <>
              <b>State must be remote, encrypted, and locked</b> (e.g. S3 +
              DynamoDB lock). It contains <b>secrets in plaintext</b> — never on
              a laptop, never in git.
            </>,
            <>
              Use <b>modules</b> so staging is a genuine (smaller) copy of
              production — killing an entire class of “but it worked in staging”
              bugs. Scan with <code>tfsec</code>/<code>checkov</code> in CI.
            </>,
          ]}
        />
      </Block>

      <Block title="The three pillars of observability">
        <div className="grid gap-3 sm:grid-cols-3">
          <MiniCard label="Logs">
            Discrete events. Structured <b>JSON</b>, never{" "}
            <code>console.log</code>. Attach a <b>correlation id</b> so you can
            follow one request across five services.
          </MiniCard>
          <MiniCard label="Metrics">
            Numbers over time — cheap to store, great for dashboards and alerts.{" "}
            <b>The four golden signals:</b> latency, traffic, errors,
            saturation.
          </MiniCard>
          <MiniCard label="Traces">
            One request's whole journey across every service. The only way to
            see
            <i> which</i> hop is slow. Use <b>OpenTelemetry</b> — instrument
            once, stay vendor-neutral.
          </MiniCard>
        </div>
        <Note>
          Monitoring answers “<i>is</i> it broken?” (known questions,
          dashboards). Observability answers “<i>why</i> is it broken?”
          (questions you didn't predict). You need both, and traces are the
          piece most teams skip and most regret skipping.
        </Note>
      </Block>

      <Block title="Alert on symptoms, not causes">
        <Callout
          tone="warn"
          title="An alert nobody acts on trains everyone to ignore alerts"
        >
          Don't alert on “CPU is 90%” — that might be perfectly healthy. Alert
          on what <b>users feel</b>: <i>error rate &gt; 1% for 5 minutes</i>,{" "}
          <i>p95 &gt; 1s</i>, <i>checkout success dropped</i>. Every alert must
          be <b>actionable</b> and point at a runbook. Alert fatigue is how real
          outages slip past a tired on-call at 3am.
        </Callout>
        <Note>
          <b>Never log secrets, tokens, or PII</b> — a logged token is a leaked
          token, and logs ship to third-party services. Sample high-volume logs,
          keep error logs complete, and put an SLO on the dashboards so “slow”
          has a definition.
        </Note>
      </Block>

      <Learn
        links={[
          {
            label: "Google SRE: monitoring distributed systems",
            href: "https://sre.google/sre-book/monitoring-distributed-systems/",
            note: "The four golden signals, and symptom-based alerting, from the source.",
          },
          {
            label: "OpenTelemetry documentation",
            href: "https://opentelemetry.io/docs/",
            note: "The vendor-neutral standard for logs, metrics, and traces.",
          },
          {
            label: "Terraform: get started",
            href: "https://developer.hashicorp.com/terraform/tutorials",
            note: "Plan, apply, state, and modules — the IaC workhorse.",
          },
        ]}
      />

      <RedFlags
        items={[
          "Changing production by hand (drift — if it isn't in code, it doesn't exist)",
          "terraform apply without reading the plan",
          "Terraform state in git or on a laptop",
          "Alerting on causes (CPU) instead of symptoms (error rate, p95)",
          "No distributed tracing, so 'why is it slow' is guesswork",
          "Secrets or PII written to logs",
        ]}
      />
    </>
  );
}

export const devopsSections: ProSection[] = [
  {
    id: "containers",
    title: "Containers",
    icon: "📦",
    kicker:
      "Images vs containers, a multi-stage Dockerfile that isn't slow or insecure, and layer caching.",
    minutes: 6,
    Content: Containers,
  },
  {
    id: "orchestration",
    title: "Kubernetes & orchestration",
    icon: "☸️",
    kicker:
      "The objects you actually need, the two probes people always confuse, and whether you need K8s at all.",
    minutes: 7,
    Content: Orchestration,
  },
  {
    id: "cicd",
    title: "CI/CD & releases",
    icon: "🔁",
    kicker:
      "Fast-to-slow pipelines, build-once-promote, canary deploys, and feature flags.",
    minutes: 7,
    Content: CiCd,
  },
  {
    id: "migrations",
    title: "Zero-downtime migrations",
    icon: "🪜",
    kicker:
      "Why old and new code overlap, the six-step expand/contract rename, and the dangerous DDL list.",
    minutes: 7,
    Content: Migrations,
  },
  {
    id: "observability",
    title: "IaC & observability",
    icon: "📊",
    kicker:
      "Infrastructure as code without drift, the three pillars, and alerting on symptoms not causes.",
    minutes: 7,
    Content: IacObservability,
  },
];
