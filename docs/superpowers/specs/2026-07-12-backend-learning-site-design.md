# Backend Learning Site — Design Spec

**Date:** 2026-07-12
**Status:** Approved design, pending spec review
**Owner:** sumitsingh

---

## 1. Purpose

A premium-looking web app that teaches **backend development** to beginners and
frontend developers switching to backend. Content is a language-agnostic roadmap
(concepts first) that runs from absolute basics to advanced system design. Code
examples are shown in multiple languages so learners see that backend ideas are
universal, not tied to one language.

**Success criteria**

- A frontend dev with zero backend knowledge can start at Stage 0 and follow a
  clear, motivating path to "understands backend like a pro."
- The site looks and feels premium (not a plain Markdown dump).
- Content lives as `.md` files pulled from a GitHub repo and is easy to update
  without touching app code.
- Progress, quizzes, search, dark mode, and multi-language code tabs all work
  with **no backend server** (fully static / client-side).

---

## 2. Audience

- Primary: frontend developers moving to backend (already know JS, HTML, CSS).
- Secondary: complete beginners to programming who want structured backend
  learning.
- Tone: encouraging, uses analogies a frontend dev already understands.

---

## 3. Tech Stack

- **Vite + React + TypeScript** — component-based SPA, fast dev, easy static
  build.
- **Tailwind CSS** — utility styling for a consistent premium look.
- **Markdown rendering**: `react-markdown` + `remark-gfm` (tables, etc.).
- **Syntax highlighting**: `react-syntax-highlighter` (or Shiki) for code blocks.
- **Search**: client-side fuzzy search (`fuse.js`) over the manifest + headings.
- **Routing**: `react-router-dom` (roadmap view, lesson view).
- No backend, no database. State persists in `localStorage`.

---

## 4. Architecture — Manifest-Driven Content System

**Principle: content is data, the app is a renderer.**

### 4.1 The manifest — `roadmap.json`

A single JSON file is the source of truth for structure, navigation, the roadmap
graph, progress, and quizzes. Shape:

```jsonc
{
  "title": "Backend Roadmap",
  "stages": [
    {
      "id": "foundations",
      "order": 0,
      "title": "Foundations",
      "summary": "How the web actually works.",
      "lessons": [
        {
          "id": "what-is-backend",
          "title": "What is Backend?",
          "file": "00-foundations/what-is-backend.md",
          "estMinutes": 8,
          "quiz": [
            {
              "q": "Where does backend code run?",
              "options": ["In the browser", "On a server", "In the DOM", "In CSS"],
              "answer": 1,
              "explain": "Backend code runs on a server, not in the user's browser."
            }
          ]
        }
      ]
    }
  ]
}
```

- `quiz` is optional per lesson.
- `estMinutes` powers "time to complete" badges.
- Lesson `id`s are globally unique (used as `localStorage` keys and route params).

**Why a committed manifest instead of GitHub's file-listing API?** The GitHub
contents API is rate-limited (60 req/hr unauthenticated) and slow. A committed
`roadmap.json` is instant, reliable, and carries richer metadata (quizzes, time
estimates, ordering).

### 4.2 Lesson files — `.md`

Each lesson is a Markdown file under a `content/` directory, grouped by stage
folder (e.g. `content/00-foundations/what-is-backend.md`). Fetched lazily only
when a lesson is opened.

### 4.3 Multi-language code examples

Concepts are language-agnostic, but hands-on code is shown in tabs. Convention:
in a lesson's Markdown, consecutive fenced code blocks tagged with the target
languages are grouped into one tabbed component. Supported tab languages and
order: **JavaScript (Node.js) · Python · Go · Java**. JavaScript is the default
tab. The chosen tab is remembered globally in `localStorage` as the learner's
"preferred language" and applied across all lessons.

Grouping rule: a run of fenced code blocks whose language IDs are in the known
set (`js`/`javascript`, `python`/`py`, `go`, `java`) and that are adjacent (only
whitespace between them) render as a single `<CodeTabs>` block. A lone code block
in some other language (`sql`, `bash`, `json`, etc.) renders as a normal
highlighted block with a copy button.

### 4.4 Content source config — `src/config.ts`

```ts
export const contentConfig = {
  source: "local" | "github",     // 'local' during dev, 'github' in prod
  github: {
    owner: "your-username",
    repo: "backend-roadmap-content",
    branch: "main",
    basePath: "content",          // folder in the repo holding manifest + lessons
  },
};
```

- `source: "local"` → fetches from `/<basePath>/...` served by Vite from
  `public/` (works instantly in dev, no network).
- `source: "github"` → fetches from
  `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{basePath}/...`.
- **Content lives once**, in `public/content/`, and is committed to the repo.
  The same files serve local dev and, when pushed to GitHub, the production
  `github` source. No duplication.

A small `contentClient` module builds URLs from this config and does the fetch
(manifest + individual lessons), so the rest of the app is source-agnostic.

---

## 5. Content — The Roadmap (10 stages, ~60 lessons)

Language-agnostic concepts, beginner → advanced. Each lesson: a clear
explanation aimed at a frontend dev (analogies to things they know), a "why it
matters," multi-language code where relevant, and an optional quiz.

```
Stage 0 · Foundations
  What is backend? · Frontend vs Backend · How the internet works ·
  DNS & domains · IP, ports & how requests find servers · The client–server model

Stage 1 · The Web & HTTP
  HTTP & HTTPS · Anatomy of a request/response · HTTP methods ·
  Status codes · Headers & cookies · HTTP 1.1 / 2 / 3

Stage 2 · Servers & Runtimes
  What is a server · Processes & threads · Event loop & concurrency models ·
  Serverless vs traditional servers

Stage 3 · APIs
  What is an API · REST in depth · JSON & serialization · API versioning ·
  GraphQL · gRPC · WebSockets & real-time · Webhooks

Stage 4 · Databases
  SQL vs NoSQL · Data modeling & normalization · Queries & joins · Indexes ·
  Transactions & ACID · NoSQL types · ORMs vs query builders · Migrations ·
  Connection pooling

Stage 5 · Auth & Security
  AuthN vs AuthZ · Sessions & cookies · JWT · OAuth 2.0 / OIDC ·
  Password hashing · TLS/HTTPS · OWASP Top 10 · CORS · Rate limiting · Secrets

Stage 6 · Beyond Basics
  Caching & Redis · Cache invalidation · Queues & pub/sub · Background jobs ·
  12-factor config · Logging · Observability (metrics & tracing)

Stage 7 · Architecture & Scaling (Pro)
  Vertical vs horizontal scaling · Load balancing · Monolith vs microservices ·
  Database replication · Sharding & partitioning · CAP theorem · Idempotency ·
  API gateways

Stage 8 · DevOps & Deployment
  Containers & Docker · Kubernetes basics · CI/CD · Infrastructure as code ·
  Cloud basics · Reverse proxies (Nginx)

Stage 9 · System Design 🧠
  Design a URL shortener · Design a rate limiter · Design a chat system ·
  Design a news feed · Distributed systems concepts · Testing backends ·
  Performance & profiling
```

Content will be **real and substantial**, not placeholders. Foundational lessons
lean on prose + diagrams-in-text; hands-on lessons include multi-language code
tabs.

---

## 6. UI / Pages

### 6.1 Roadmap view (home)

- Interactive **vertical roadmap graph** as the hero: stages as sections, lessons
  as clickable nodes.
- Node states: locked/upcoming (dim), completed (glow/checked), current
  (pulse/highlight).
- Overall progress ring + "Continue where you left off" CTA.
- Premium dark-first visual: subtle grid backdrop, gradient accents, glass cards,
  smooth motion, monospace labels for a developer feel.

### 6.2 Lesson view

- Distraction-free reader with rendered Markdown.
- Left sidebar: collapsible stages/lessons + progress ring; highlights current
  lesson.
- Code blocks: syntax-highlighted, copy button; grouped multi-language ones render
  as `<CodeTabs>`.
- Footer: "Mark complete" toggle, prev/next lesson, estimated time badge.
- Quiz section (if the lesson has one): instant feedback + explanations.

### 6.3 Global

- ⌘K / Ctrl-K **command-palette search** — fuzzy search across lesson titles and
  headings, jump to any lesson.
- Light/dark theme toggle (persisted).
- Top progress bar reflecting overall completion.

---

## 7. Feature Mechanics

- **Progress**: `localStorage` holds a set of completed lesson `id`s. Drives the
  progress ring/bar, node glow, and "continue" CTA. A "reset progress" action is
  available in settings.
- **Quizzes**: defined inline in `roadmap.json`. Client-side check against
  `answer` index; shows `explain` after answering. No score persistence beyond
  marking the lesson complete.
- **Search**: `fuse.js` index built at load from the manifest (titles) and, when
  available, lesson headings. Keyboard-driven palette.
- **Preferred language**: selected code tab persisted globally and applied to all
  `<CodeTabs>`.
- **Theme**: persisted; respects `prefers-color-scheme` on first visit.

---

## 8. Component Breakdown

- `contentClient` — builds URLs from `config`, fetches manifest + lessons.
- `RoadmapProvider` — loads manifest, exposes stages/lessons + lookups.
- `ProgressProvider` — completed-set state + `localStorage` sync.
- `PreferencesProvider` — theme + preferred language.
- `RoadmapGraph` — the hero graph of stages/nodes.
- `LessonPage` — layout: sidebar + reader + quiz.
- `Markdown` — `react-markdown` wrapper with custom renderers.
- `CodeBlock` / `CodeTabs` — single highlighted block vs grouped language tabs;
  both with copy.
- `Quiz` — renders + checks a lesson's questions.
- `CommandPalette` — ⌘K fuzzy search.
- `Sidebar`, `ProgressRing`, `ThemeToggle`, `TopProgressBar`.

Each unit has one purpose and a clear interface; content changes never require
app code changes.

---

## 9. Error Handling

- Manifest fetch fails → full-page friendly error with retry (distinguish
  network vs 404, hint to check `config`).
- Lesson `.md` fetch fails → inline error in the reader with retry; navigation
  still works.
- Unknown lesson `id` in the URL → "lesson not found" state with a link back to
  the roadmap.
- Malformed manifest → guarded parsing; surface which stage/lesson is malformed
  in dev.
- GitHub rate limit (403) → detect and show a clear message suggesting local
  mode or trying later.

---

## 10. Testing

- **Unit** (Vitest): `contentClient` URL building for both sources; multi-language
  code-block grouping logic; progress/preferences reducers; quiz checking.
- **Component** (React Testing Library): `CodeTabs` switching + persistence;
  `Quiz` feedback; `Markdown` renders a fenced block as highlighted code.
- **Smoke**: app boots with the bundled local content, roadmap renders, a lesson
  opens, "mark complete" updates progress.

---

## 11. Deployment

- `vite build` → static assets.
- Deploy free to Vercel / Netlify / GitHub Pages.
- To go live from GitHub content: push the repo (including `public/content/`),
  set `config.source = "github"` with the repo details, rebuild/redeploy.

---

## 12. Out of Scope (YAGNI)

- No user accounts, no server, no database.
- No content authoring UI (content is edited as `.md` in the repo).
- No arbitrary-repo browsing (content is this project's curriculum).
- No i18n of the UI (code examples are multi-language; UI copy is English).

---

## 13. Open Questions

- None blocking. Exact lesson count may shift slightly as content is written; the
  stage structure above is fixed.
