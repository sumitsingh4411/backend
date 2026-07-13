<div align="center">

# ⚡ BackendPath

### Learn backend engineering like you have 200 IQ.

A premium, interactive site that takes a **complete beginner** — or a **frontend dev switching over** — from _"what even is a server?"_ all the way to **system design interviews**.

Every concept is language-agnostic, and every code example is shown in **JavaScript, Python, Go and Java** side by side.

<br />

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white&style=for-the-badge)
![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white&style=for-the-badge)

<br />

**68 lessons** · **36 reference pages** · **120 quizzes** · **~51,000 words** · **270+ curated links**

</div>

---

## Table of contents

- [Why this exists](#why-this-exists)
- [Quick start](#quick-start)
- [Two ways to learn](#two-ways-to-learn)
- [Where should I start?](#where-should-i-start)
- [The Roadmap — 11 stages, 68 lessons](#the-roadmap--11-stages-68-lessons)
- [The Pro Shelf — 8 topics, 36 pages](#the-pro-shelf--8-topics-36-pages)
- [Features](#features)
- [Writing content](#writing-content)
- [Project structure](#project-structure)
- [Serving content from GitHub](#serving-content-from-github)
- [Testing](#testing)
- [Deploying](#deploying)

---

## Why this exists

Most backend tutorials teach you **a framework**. You finish, you can wire up an Express route, and you still can't answer _"why is this slow?"_ or _"what happens when two people click Buy at the same time?"_

BackendPath teaches the **concepts underneath** — the ones that stay true whether you write Node, Django, Spring or Go. Frameworks are a detail. The request lifecycle, indexes, transactions, caching, idempotency and failure modes are the job.

> **The promise:** finish this and you can look at any backend, in any language, and know roughly how it works and where it will break.

---

## Quick start

```bash
npm install
npm run dev          # → http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm test` | 29 unit + smoke tests (Vitest) |
| `npm run build` | Typecheck + production build → `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |

No database, no API keys, no backend to run. It's a static site — the "content" is just Markdown.

---

## Two ways to learn

The site is deliberately split in two, because learning and _looking things up_ are different activities.

<table>
<tr>
<td width="50%" valign="top">

### 🗺️ The Roadmap
**`/roadmap`** — the linear path.

11 stages, 68 lessons, in order, beginner → expert. Each lesson has a quiz to check you actually understood it, and curated links to go deeper.

Your progress is tracked, so you always know where you left off.

**Read this front to back.**

</td>
<td width="50%" valign="top">

### 📚 The Pro Shelf
**`/pro`** — the reference.

8 topics, each split into its own pages: decision tables, rules, red flags, and the traps that take down production.

Written to be **scanned**, not read — the thing you open at work when you need the answer now.

**Come back to this forever.**

</td>
</tr>
</table>

---

## Where should I start?

| If you are… | Start at | Why |
|---|---|---|
| 🌱 **Brand new to backend** | [Stage 0 → Foundations](#the-roadmap--11-stages-68-lessons) | Starts at "what is a server", assumes nothing |
| 🎨 **A frontend dev switching** | Stage 1 (HTTP) → skim → Stage 4 (Databases) | You already know HTTP from `fetch()`. Databases are the real gap. |
| 🔧 **Already building APIs** | Pro Shelf → 🗄️ Databases → ⚡ Performance | Fill the holes: indexes, transactions, N+1, p99 |
| 🎯 **Prepping for interviews** | Pro Shelf → 🧠 System Design | The method, estimation, and the classic designs worked through |
| 🚨 **On call and something broke** | Pro Shelf → 🕸️ Reliability | Timeouts, retries, circuit breakers, the outbox pattern |

**The single most valuable thing here** if you're short on time: 🗄️ **Databases → Indexes & query plans**, then ⚡ **Performance → The usual suspects**. Missing indexes and N+1 queries cause more real-world slowness than everything else combined.

---

## The Roadmap — 11 stages, 68 lessons

`~643 minutes of reading · 120 quiz questions · 177 curated links`

| # | Stage | What you'll learn |
|:--|---|---|
| **0** | 🌱 Foundations | What backend _is_, frontend vs backend, how the internet works, DNS, the client–server model |
| **1** | 🌐 The Web & HTTP | HTTP/HTTPS, request & response anatomy, methods, status codes, headers, cookies, HTTP/1.1 vs 2 vs 3 |
| **2** | 🖥️ Servers & Runtimes | What a server actually is, processes/threads/concurrency, serverless vs traditional |
| **3** | 🔌 APIs | REST in depth, JSON, API design, pagination, versioning, GraphQL & gRPC, WebSockets, webhooks |
| **4** | 🗄️ Databases | SQL vs NoSQL, modelling, joins, **indexes**, EXPLAIN & query optimisation, transactions & ACID, ORMs, migrations, pooling |
| **5** | 🔐 Auth & Security | AuthN vs AuthZ, sessions vs JWT, OAuth/OIDC, password hashing, OWASP Top 10, CORS, rate limiting, secrets, TLS |
| **6** | 🔁 Beyond Basics | Caching & Redis, cache invalidation, queues & pub/sub, background jobs, config, logging, observability |
| **7** | 🏗️ Architecture & Scaling | Scaling, load balancing, consistent hashing, monolith vs microservices, event-driven, API gateways, replication, sharding, CAP |
| **8** | 🚀 DevOps & Deployment | Docker, Kubernetes, CI/CD, zero-downtime deploys, infrastructure as code, cloud, reverse proxies |
| **9** | 🧠 System Design | URL shortener, rate limiter, chat, news feed, distributed systems, performance & profiling, testing |
| **10** | 🎓 **Expert Track** | Database internals (B-trees, LSM, WAL), concurrency & locking, event sourcing & CQRS, Bloom filters, domain-driven design |

The 11 stages are grouped into **4 tracks** — Foundations, APIs & Data, Scale & Ops, Mastery — so you always know which chapter of the story you're in.

---

## The Pro Shelf — 8 topics, 36 pages

`~252 minutes · every page ends with hand-picked primary sources`

Every topic is split into **its own pages**, with a docs layout: topic nav on the left, "On this page" on the right.

| Topic | Pages |
|---|---|
| 🗄️ **Databases** | Choosing a database · Data modelling · **Indexes & query plans** · Transactions & locking · Scaling & operations |
| 🔌 **APIs** | REST design · Pagination, filtering & errors · Versioning & evolution · Idempotency, limits & webhooks · GraphQL, gRPC & real-time |
| 🔐 **Security** | The security mindset · Passwords & MFA · Sessions, JWT & OAuth · Injection, XSS & the OWASP risks · TLS, secrets & headers |
| 🔁 **Caching & Queues** | Caching layers · Patterns & failure modes · Redis in practice · Queues & background jobs |
| ⚡ **Performance** | Measure first · The usual suspects · Profiling & memory · Concurrency & load testing |
| 🕸️ **Reliability** | Failure is the normal case · Resilience patterns · CAP, consistency & consensus · Dual writes, sagas & on-call |
| 🚀 **DevOps & Deploys** | Containers · Kubernetes & orchestration · CI/CD & releases · Zero-downtime migrations · IaC & observability |
| 🧠 **System Design** | The method · Back-of-envelope estimation · Building blocks & trade-offs · Classic designs, worked |

Each page is built from the same reference vocabulary — **decision tables**, **rules**, **ladders**, **numbers to know**, **do/don't comparisons**, **🚨 traps**, and a **red flags** checklist — so it reads as one system rather than eight blog posts.

---

## Features

| | |
|---|---|
| 🗺️ **Animated roadmap** | The whole curriculum as a timeline, with your next lesson marked |
| ✅ **Progress tracking** | Completed lessons persist in `localStorage` |
| 🌍 **Multi-language code tabs** | The same idea in JavaScript, Python, Go and Java — your choice is remembered site-wide |
| 🧪 **Quizzes** | 120 questions with explanations, so you catch what you only _think_ you understood |
| 🔗 **"Go deeper" links** | 270+ hand-picked primary sources — docs, papers, talks, free books |
| ⌘K **Fuzzy search** | Jump to any lesson instantly (Fuse.js) |
| 🌗 **Light & dark** | Both properly designed, not an afterthought |
| 📋 **Copy buttons** | On every code block |
| 📖 **Docs layout** | Sidebar + scrollspy "On this page", like real documentation |

---

## Writing content

**Content is data; the app is a renderer.** You can add a whole lesson without touching a line of React.

Everything lives in [`public/content/`](public/content/):

```
public/content/
  roadmap.json           ← the manifest: stages, lessons, quizzes, links
  00-foundations/*.md    ← lesson markdown
  01-http/*.md
  …
```

<details>
<summary><b>Adding a lesson</b></summary>

<br />

Drop a `.md` file in a stage folder, then add an entry to `roadmap.json`:

```jsonc
{
  "id": "my-lesson",                  // unique — used in the URL and for progress
  "title": "My Lesson",
  "file": "01-http/my-lesson.md",     // path relative to public/content
  "estMinutes": 8,

  "quiz": [                           // optional
    {
      "q": "Which status code means 'I know who you are, and no'?",
      "options": ["401", "403"],
      "answer": 1,                    // index of the correct option
      "explain": "401 is unauthenticated. 403 is authenticated-but-forbidden."
    }
  ],

  "resources": [                      // optional — renders as "Go deeper"
    {
      "title": "MDN: HTTP overview",
      "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview",
      "type": "docs",                 // docs | article | video | book |
                                      // spec | course | tool | interactive
      "note": "Why this link is worth an hour."
    }
  ]
}
```

That's it — the sidebar, roadmap, search, progress and TOC all pick it up automatically.

</details>

<details>
<summary><b>Multi-language code tabs</b></summary>

<br />

Put fenced code blocks for **different languages next to each other** (only blank lines between them) and they render as **one tabbed component**:

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

Tabbed languages: `js` · `python` · `go` · `java`. The reader's chosen tab is remembered across every lesson on the site.

Any **other** language (`sql`, `bash`, `json`, `yaml`, `nginx`, `dockerfile`, …) renders as a normal highlighted block with a copy button.

</details>

<details>
<summary><b>Adding a Pro Shelf page</b></summary>

<br />

Pro pages are React (they're reference layouts, not prose). Open the topic's file in [`src/pages/pro/`](src/pages/pro/) and add a section:

```tsx
function MyNewSection() {
  return (
    <>
      <Block title="The rule">
        <Callout tone="bad" title="The trap that takes down production">
          …
        </Callout>
        <RefTable head={["Option", "Use when"]} rows={[["A", "…"], ["B", "…"]]} />
      </Block>

      <Learn links={[{ label: "…", href: "https://…", note: "…" }]} />
      <RedFlags items={["…"]} />
    </>
  );
}

export const databasesSections: ProSection[] = [
  // …
  {
    id: "my-new-section",          // → /pro/databases/my-new-section
    title: "My new section",
    icon: "🔍",
    kicker: "One line on what this page answers.",
    minutes: 7,
    Content: MyNewSection,
  },
];
```

Every `<Block>` tags itself with `data-pro-section`, and the page **reads its own sections back out of the DOM** — so the left nav and the "On this page" rail update themselves. You never maintain a table of contents by hand.

The building blocks live in [`src/components/ProKit.tsx`](src/components/ProKit.tsx): `Block` · `RefTable` · `Rules` · `Ladder` · `MiniCard` · `Numbers` · `Callout` · `Note` · `Snippet` · `VS` · `RedFlags` · `Learn` · `FeaturedLink`.

</details>

---

## Project structure

```
src/
  config.ts                  # content source: "local" | "github"
  types.ts                   # Roadmap / Stage / Lesson / Quiz / Resource

  lib/
    contentClient.ts         # builds URLs, fetches the manifest + lessons
    markdownSegments.ts      # splits markdown → prose / code / code-tab groups
    toc.ts                   # heading extraction + slugs for anchors
    tracks.ts                # groups the 11 stages into 4 tracks
    proTopics.ts             # the 8 Pro Shelf topics
    useScrollSpy.ts          # highlights the section you're reading

  providers/
    RoadmapProvider.tsx      # loads the manifest, flattens lessons, lookups
    ProgressProvider.tsx     # completed lessons → localStorage
    PreferencesProvider.tsx  # theme + preferred code language

  components/
    Header.tsx               # brand · Roadmap · the 8 topic tabs · ⌘K · theme
    Sidebar.tsx              # lesson nav, grouped into tracks
    ProShell.tsx             # the docs frame: nav left, page, TOC right
    ProKit.tsx               # the reference vocabulary (tables, callouts, …)
    CodeTabs.tsx             # the multi-language tabbed code block
    CommandPalette.tsx       # ⌘K fuzzy search
    …

  pages/
    HomePage.tsx             # "/"
    RoadmapPage.tsx          # "/roadmap"           — the animated timeline
    LessonPage.tsx           # "/lesson/:id"        — reader + quiz + TOC
    ProTopicPage.tsx         # "/pro/:topic"        — a topic's index
    ProSectionPage.tsx       # "/pro/:topic/:section" — one reference page
    pro/                     # the 8 topics' content + registry
```

### Routes

| Route | Page |
|---|---|
| `/` | Landing — hero, request trace, the 4 tracks |
| `/roadmap` | The full animated curriculum timeline |
| `/lesson/:id` | A lesson — sidebar, reader, quiz, "Go deeper", TOC |
| `/pro/:topic` | A Pro topic's index (e.g. `/pro/databases`) |
| `/pro/:topic/:section` | One reference page (e.g. `/pro/databases/indexes`) |

---

## Serving content from GitHub

By default the app reads content from its own `public/content/`. To read it **live from a GitHub repo** instead, edit [`src/config.ts`](src/config.ts):

```ts
export const contentConfig: ContentConfig = {
  source: "github",              // ← switch from "local"
  github: {
    owner: "your-username",
    repo: "your-repo",
    branch: "main",
    basePath: "public/content",  // the folder holding roadmap.json
  },
};
```

The app then fetches from `raw.githubusercontent.com`, so **updating a lesson is just a `git push`** — no redeploy.

> Keep `source: "local"` while developing: it's instant and works offline. GitHub's raw endpoint is rate-limited under heavy traffic; the app detects a 403 and shows a clear message rather than a blank screen.

---

## Testing

```bash
npm test
```

**29 tests**, covering the parts that actually break:

| Suite | Covers |
|---|---|
| `markdownSegments` | Grouping adjacent code blocks into language tabs |
| `toc` | Heading slugs, duplicate handling, `#` inside code blocks |
| `contentClient` | Local vs GitHub URL building, error handling |
| `app.smoke` | Renders real content from disk: home, roadmap, lessons, quizzes, the header tabs, every Pro topic and section page, prev/next across topics, the sidebar scroll container, and TOC anchors resolving to headings that exist |

---

## Deploying

It's a static site — build it and drop `dist/` anywhere:

```bash
npm run build
```

Works out of the box on **Vercel**, **Netlify**, **Cloudflare Pages** and **GitHub Pages**.

> ⚠️ It's a single-page app, so your host must **rewrite all routes to `index.html`** — otherwise refreshing `/pro/databases/indexes` 404s.
> On Netlify: a `_redirects` file containing `/* /index.html 200`. Vercel and Cloudflare Pages handle it automatically.

---

<div align="center">

Built with **Vite** · **React** · **TypeScript** · **Tailwind**

_Concepts, not frameworks._

</div>
