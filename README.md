# BackendPath — Learn Backend Like a Pro

A premium, interactive learning site that takes a **frontend developer** from *"what even is a server?"* all the way to **system design** — with a visual roadmap, progress tracking, quizzes, and every code example shown in **JavaScript, Python, Go, and Java**.

Content is plain **Markdown**, read from a `roadmap.json` manifest — so you can edit lessons without touching a line of app code.

---

## Quick start

```bash
npm install
npm run dev        # → http://localhost:5173
```

Other commands:

```bash
npm test           # unit + smoke tests
npm run build      # typecheck + production build → dist/
npm run preview    # preview the production build
```

---

## What's inside

**11 stages · 68 lessons · 120 quiz questions · 177 curated links · ~51,000 words**
Beginner → expert.

| Stage | Topics |
|---|---|
| 0 · Foundations | What is backend, frontend vs backend, how the internet works, DNS, client–server |
| 1 · The Web & HTTP | HTTP/HTTPS, request/response anatomy, methods, status codes, headers & cookies, HTTP/1.1 vs 2 vs 3 |
| 2 · Servers & Runtimes | What a server is, processes/threads/concurrency, serverless vs traditional |
| 3 · APIs | REST in depth, JSON, API design/pagination/versioning, GraphQL & gRPC, WebSockets, webhooks |
| 4 · Databases | SQL vs NoSQL, modeling, joins, indexes, query optimization & EXPLAIN, transactions/ACID, ORMs & migrations, connection pooling |
| 5 · Auth & Security | AuthN vs AuthZ, sessions & JWT, OAuth/OIDC, password hashing, OWASP Top 10, CORS & rate limiting, secrets & TLS |
| 6 · Beyond Basics | Caching & Redis, cache invalidation, queues & pub/sub, background jobs, config & logging, observability |
| 7 · Architecture | Scaling, load balancing, consistent hashing, monolith vs microservices, event-driven architecture, API gateways & service mesh, replication & sharding, CAP & idempotency |
| 8 · DevOps | Docker, Kubernetes, CI/CD, zero-downtime deploys, infrastructure as code, cloud & reverse proxies |
| 9 · System Design | URL shortener, rate limiter, chat system, news feed, distributed systems, performance & profiling, testing |
| 10 · **Expert Track** | Database internals (B-trees/LSM/WAL), concurrency & locking, event sourcing & CQRS, Bloom filters & probabilistic structures, domain-driven design |

**Features:** interactive roadmap graph · progress tracking (localStorage) · ⌘K fuzzy search · light/dark mode · per-lesson quizzes · **"Go deeper" curated links** · multi-language code tabs · copy-to-clipboard.

---

## Editing the content

Everything lives in [`public/content/`](public/content/):

```
public/content/
  roadmap.json              ← the manifest: stages, lessons, quizzes
  00-foundations/*.md       ← lesson markdown
  01-http/*.md
  ...
```

**To add a lesson:** drop a new `.md` file in a stage folder, then add an entry to `roadmap.json`:

```jsonc
{
  "id": "my-lesson",                       // unique; used in the URL + progress
  "title": "My Lesson",
  "file": "01-http/my-lesson.md",          // path relative to public/content
  "estMinutes": 8,
  "quiz": [                                 // optional
    {
      "q": "Question?",
      "options": ["A", "B"],
      "answer": 1,                          // index of the correct option
      "explain": "Why B is right."
    }
  ],
  "resources": [                            // optional — the "Go deeper" section
    {
      "title": "MDN: HTTP overview",
      "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview",
      "type": "docs",                       // docs | article | video | book |
                                            // spec | course | tool | interactive
      "note": "Why this link is worth reading."   // optional
    }
  ]
}
```

### Multi-language code tabs

Put fenced code blocks for **different languages next to each other** (only blank lines between) and they automatically render as one tabbed component:

````markdown
```js
console.log("hi");
```

```python
print("hi")
```

```go
fmt.Println("hi")
```

```java
System.out.println("hi");
```
````

Supported tab languages: `js` · `python` · `go` · `java`. The reader's chosen tab is remembered across every lesson.

Any *other* language (`sql`, `bash`, `json`, `yaml`, `nginx`, `dockerfile`, …) renders as a normal highlighted block with a copy button.

---

## Serving content from GitHub

By default the app reads content from its own `public/content/` folder. To read it **live from a GitHub repo** instead, edit [`src/config.ts`](src/config.ts):

```ts
export const contentConfig: ContentConfig = {
  source: "github",              // ← switch from "local"
  github: {
    owner: "your-username",
    repo: "your-repo",
    branch: "main",
    basePath: "public/content",  // folder in the repo holding roadmap.json
  },
};
```

The app then fetches from `raw.githubusercontent.com`, so **updating a lesson is just a git push** — no redeploy needed.

> Keep `source: "local"` for development (instant, works offline). Note that GitHub's raw endpoint is rate-limited for very high traffic; the app detects a 403 and shows a clear message.

---

## Deploying

It's a static site — build and drop `dist/` anywhere:

```bash
npm run build
```

Works out of the box on **Vercel**, **Netlify**, **Cloudflare Pages**, or **GitHub Pages**.

⚠️ It's a single-page app, so configure your host to **rewrite all routes to `index.html`** (otherwise refreshing `/lesson/jwt` 404s). On Netlify, a `_redirects` file with `/* /index.html 200` does it; Vercel handles it automatically.

---

## Architecture

```
src/
  config.ts                 # content source (local | github)
  types.ts                  # Roadmap / Stage / Lesson / Quiz types
  lib/
    contentClient.ts        # builds URLs + fetches manifest & lessons
    markdownSegments.ts     # splits markdown → prose / code / code-tab groups
  providers/
    RoadmapProvider.tsx     # loads the manifest, flattens lessons, lookups
    ProgressProvider.tsx    # completed lessons → localStorage
    PreferencesProvider.tsx # theme + preferred code language
  components/               # Header, Sidebar, CodeTabs, Quiz, CommandPalette, …
  lib/tracks.ts             # groups the 11 stages into 4 tracks (nav + overview)
  pages/
    HomePage.tsx            # "/"        — hero + request-trace + track overview
    RoadmapPage.tsx         # "/roadmap" — full animated timeline, every lesson
    LessonPage.tsx          # "/lesson/:id" — sidebar + reader + TOC + quiz
```

**Content is data; the app is a renderer.** Adding lessons never requires app changes.

Built with Vite · React · TypeScript · Tailwind.
