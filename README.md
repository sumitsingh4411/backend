<div align="center">

# ⚡ BackendPath

### Learn backend engineering, from zero to system design.

# **The entire course is in this repo.**

No signup. No video. No "part 2 coming soon".
**16 chapters**, each one a single readable page. Start at chapter 0 and go.

<br />

![Level](https://img.shields.io/badge/Level-Beginner%20→%20Pro-6366f1?style=for-the-badge)
![Read time](https://img.shields.io/badge/Read-~72%20min-10b981?style=for-the-badge)
![Prereqs](https://img.shields.io/badge/Prerequisites-none-64748b?style=for-the-badge)
![Cost](https://img.shields.io/badge/Cost-free%20forever-10b981?style=for-the-badge)

</div>

<table>
<tr>
<td width="25%" align="center"><b>16</b><br /><sub>chapters</sub></td>
<td width="25%" align="center"><b>130</b><br /><sub>interview questions</sub></td>
<td width="25%" align="center"><b>120+</b><br /><sub>glossary terms</sub></td>
<td width="25%" align="center"><b>~15,000</b><br /><sub>words, all in this repo</sub></td>
</tr>
</table>

**Databases · APIs · Security · Caching & Queues · Performance · Reliability · DevOps · System Design**

Every concept is **language-agnostic** — the ideas hold whether you write Node, Python, Go or Java.
Every 🚨 is a trap that takes down **real production systems**.

---

## Contents

Each chapter is its own page. Click one and start reading.

### The course

| | Chapter | You'll learn | |
|:--|---|---|:--|
| **0** | [🌱 Foundations](course/00-foundations.md) | What a backend actually is, and what happens when you type a URL | `2 min` |
| **1** | [🌐 HTTP](course/01-http.md) | Requests, responses, methods, status codes, cookies | `3 min` |
| **2** | [🖥️ Servers & concurrency](course/02-servers-and-concurrency.md) | How one machine serves thousands of people at once | `3 min` |
| **3** | [🔌 APIs](course/03-apis.md) | Designing a contract other people build on | `4 min` |
| **4** | [🗄️ **Databases**](course/04-databases.md) | Modelling, **indexes**, EXPLAIN, transactions, race conditions | `8 min` |
| **5** | [🔐 Security](course/05-security.md) | Auth, passwords, JWT, OAuth, and the bugs that cause real breaches | `5 min` |
| **6** | [🔁 Caching & queues](course/06-caching-and-queues.md) | Serve it fast, do the slow work later | `3 min` |
| **7** | [⚡ Performance](course/07-performance.md) | p95/p99, profiling, and where the time actually goes | `3 min` |
| **8** | [🕸️ Reliability](course/08-reliability.md) | The network will fail. Design like it already has. | `3 min` |
| **9** | [🚀 DevOps & deploys](course/09-devops.md) | Containers, CI/CD, zero-downtime deploys | `3 min` |
| **10** | [🧠 System design](course/10-system-design.md) | The method, the maths, and the classic problems worked through | `3 min` |

### The interview

| | Chapter | What's in it | |
|:--|---|---|:--|
| **11** | [🎯 The interview round](course/11-interview-round.md) | The 45 minutes minute-by-minute, what they grade, how people fail | `2 min` |
| **12** | [📖 Backend glossary](course/12-glossary.md) | 120+ terms, each defined in one sentence | `12 min` |
| **13** | [❓ **130 interview questions**](course/13-interview-questions.md) | Design-X prompts, deep dives, concepts, estimation, trade-offs | `14 min` |

### Reference

| | Chapter | What's in it | |
|:--|---|---|:--|
| **14** | [📋 Cheat sheets](course/14-cheat-sheets.md) | Status codes, latency numbers, a red-flag checklist | `2 min` |
| **15** | [📚 Where to go next](course/15-resources.md) | The best free resources, curated | `2 min` |

---

## ⏱️ Only have 20 minutes?

Read these three and nothing else. They cover more real-world breakage than the rest combined:

| | Read this | Because |
|:--|---|---|
| **1** | [**Indexes**](course/04-databases.md#41-indexes--the-single-biggest-win) | Missing indexes cause more slowness than everything else put together |
| **2** | [**The N+1 query**](course/04-databases.md#43-the-n1-query--the-most-common-bug-in-backend-code) | You have written this bug. You just don't know it yet. |
| **3** | [**Timeouts**](course/08-reliability.md#81-timeouts--the-default-is-wait-forever) | One slow dependency takes down your *whole* service without them |

---

## 🧭 Pick your path

| If you are… | Start here | Why |
|---|---|---|
| 🌱 **New to backend** | [Chapter 0 · Foundations](course/00-foundations.md) | Starts at "what is a server". Assumes nothing. |
| 🎨 **A frontend dev switching over** | [Chapter 1 · HTTP](course/01-http.md) → then jump to [Databases](course/04-databases.md) | You already know HTTP from `fetch()`. **Databases are the real gap.** |
| 🔧 **Already shipping APIs** | [Databases](course/04-databases.md) → [Performance](course/07-performance.md) | Fill the holes: indexes, transactions, N+1, p99 |
| 🎯 **Prepping for interviews** | [The interview round](course/11-interview-round.md) → [130 questions](course/13-interview-questions.md) | The method, then the full question bank |
| 🚨 **On call, something's broken** | [Reliability](course/08-reliability.md) | Timeouts, retries, circuit breakers, the outbox |
| 🧠 **Just want the vocabulary** | [Glossary](course/12-glossary.md) | 120+ terms, one sentence each |

---

## Why this exists

Most backend tutorials teach you **a framework**. You finish, you can wire up an Express route, and you still can't answer *"why is this slow?"* or *"what happens when two people click Buy at the same time?"*

BackendPath teaches the **concepts underneath** — the ones that stay true whether you write Node, Django, Spring or Go.

> **The promise:** finish this and you can look at any backend, in any language, and know roughly how it works and where it will break.

---

## 💻 Optional: the interactive version

**The whole course is in these files — you don't need this.** But if you'd rather learn with quizzes, progress tracking and search, the same material also runs as a site:

### 👉 **[backend.nextjoblist.com](https://backend.nextjoblist.com/)** — free, no signup

It adds **68 lessons with quizzes**, **36 reference pages**, progress tracking, ⌘K search, and every code example switchable between **JavaScript, Python, Go and Java**.

Or run it yourself — it's this repo:

```bash
npm install
npm run dev        # → http://localhost:5173
```

| Command | |
|---|---|
| `npm run dev` | dev server |
| `npm test` | 31 tests |
| `npm run build` | production build → `dist/` |

<details>
<summary><b>How the site content is structured</b> (if you want to add lessons)</summary>

<br />

Content is **data**; the app is a renderer. Lessons are plain Markdown in [`public/content/`](public/content/), listed in `roadmap.json`:

```jsonc
{
  "id": "my-lesson",                  // → /lesson/my-lesson
  "title": "My Lesson",
  "file": "01-http/my-lesson.md",
  "estMinutes": 8,
  "quiz": [{ "q": "…", "options": ["A", "B"], "answer": 1, "explain": "…" }],
  "resources": [{ "title": "…", "url": "…", "type": "docs", "note": "…" }]
}
```

Put fenced code blocks for **different languages next to each other** and they render as one **tabbed** component (`js` · `python` · `go` · `java`).

The **Pro Shelf** reference pages live in [`src/pages/pro/`](src/pages/pro/), built from the vocabulary in [`ProKit.tsx`](src/components/ProKit.tsx).

</details>

---

<div align="center">

## Concepts, not frameworks.

Frameworks change every three years.
The request lifecycle, indexes, transactions, caching, idempotency and failure modes **don't**.

Learn those, and you can pick up any backend, in any language, and know roughly how it works — and where it will break.

<br />

### **[→ Start with Chapter 0 · Foundations](course/00-foundations.md)**

<br />

**If this helped you, ⭐ the repo so the next person finds it.**

</div>
