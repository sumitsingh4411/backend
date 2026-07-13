import { useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useRoadmap } from "../providers/RoadmapProvider";
import { useProgress } from "../providers/ProgressProvider";
import { groupIntoTracks } from "../lib/tracks";
import type { CodeSnippet } from "../lib/markdownSegments";
import { HeroTrace } from "../components/HeroTrace";
import { CodeTabs } from "../components/CodeTabs";
import { ProgressRing } from "../components/ProgressRing";
import {
  ArrowRight,
  BookIcon,
  CheckIcon,
  CodeIcon,
  RouteIcon,
  SparkIcon,
} from "../components/Icons";

export function HomePage() {
  const { roadmap, flatLessons, totalLessons } = useRoadmap();
  const { completed, count, lastLessonId } = useProgress();

  const currentId = useMemo(
    () => flatLessons.find((l) => !completed.has(l.lesson.id))?.lesson.id ?? null,
    [flatLessons, completed],
  );

  if (!roadmap) return null;
  const stages = [...roadmap.stages].sort((a, b) => a.order - b.order);
  const tracks = groupIntoTracks(stages);
  const pct = totalLessons ? count / totalLessons : 0;
  const resumeId = lastLessonId ?? currentId ?? flatLessons[0]?.lesson.id;

  const quizCount = stages.reduce(
    (n, s) => n + s.lessons.reduce((m, l) => m + (l.quiz?.length ?? 0), 0),
    0,
  );
  const linkCount = stages.reduce(
    (n, s) => n + s.lessons.reduce((m, l) => m + (l.resources?.length ?? 0), 0),
    0,
  );
  const hours = Math.round(
    stages.reduce(
      (n, s) => n + s.lessons.reduce((m, l) => m + l.estMinutes, 0),
      0,
    ) / 60,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 sm:pt-20">
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="grid animate-floatIn items-center gap-x-12 gap-y-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="mb-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
            <span className="text-accent-400">//</span>
            language-agnostic
            <span className="text-slate-600">·</span>
            <span className="text-brand-300">js·py·go·java</span>
          </div>

          <h1 className="font-display text-[2.6rem] font-bold leading-[1.02] tracking-tight text-ink-900 dark:text-white sm:text-6xl">
            You already{" "}
            <span className="text-slate-400 dark:text-slate-500">call</span> the
            backend.
            <br />
            Now <span className="gradient-text">build</span> it.
          </h1>

          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
            A guided path from your first{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[13px] text-brand-600 dark:bg-white/5 dark:text-accent-400">
              GET
            </code>{" "}
            request to designing systems at scale — concepts first, real code in
            four languages.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {resumeId && (
              <Link to={`/lesson/${resumeId}`} className="btn-primary">
                {count > 0 ? "Continue learning" : "Start the roadmap"}
                <ArrowRight width={16} height={16} />
              </Link>
            )}
            <Link to="/roadmap" className="btn-ghost">
              <BookIcon width={16} height={16} />
              See the roadmap
            </Link>
          </div>

          <dl className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-[11px] uppercase tracking-wider text-slate-400">
            <StatChip n={stages.length} label="stages" />
            <StatChip n={totalLessons} label="lessons" />
            <StatChip n={quizCount} label="checks" />
            {count > 0 && (
              <div className="flex items-center gap-2 rounded-full border border-slate-200/70 py-1 pl-1 pr-3 dark:border-white/10">
                <ProgressRing value={pct} size={26} stroke={3} label=" " />
                <span className="normal-case tracking-normal text-slate-500 dark:text-slate-400">
                  {count}/{totalLessons} done
                </span>
              </div>
            )}
          </dl>
        </div>

        <HeroTrace />
      </section>

      {/* ── FEATURE PILLARS ───────────────────────────────────── */}
      <section className="mt-24 sm:mt-32">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Pillar
            icon={<SparkIcon width={18} height={18} />}
            title="Concepts, not frameworks"
            body="Learn how the web, servers, and databases actually work — ideas that outlast any tool or trend."
          />
          <Pillar
            icon={<CodeIcon width={18} height={18} />}
            title="One idea, four languages"
            body="Every hands-on example in JavaScript, Python, Go & Java. Read it in the one you know, see it's universal."
          />
          <Pillar
            icon={<CheckIcon width={18} height={18} />}
            title="Check as you go"
            body={`${quizCount} quick quizzes and saved progress keep the ideas from sliding straight back out.`}
          />
          <Pillar
            icon={<BookIcon width={18} height={18} />}
            title="Go deeper"
            body={`${linkCount} hand-picked links — MDN, OWASP, papers, and the docs that actually matter.`}
          />
        </div>
      </section>

      {/* ── MULTI-LANGUAGE SHOWCASE ───────────────────────────── */}
      <section className="mt-24 grid items-center gap-x-12 gap-y-8 sm:mt-32 lg:grid-cols-2">
        <div>
          <Eyebrow>the same idea, everywhere</Eyebrow>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl">
            A backend is a backend —
            <br />
            in any language.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
            Here's the same endpoint four ways. Notice how little the{" "}
            <em className="text-ink-900 not-italic dark:text-slate-200">idea</em>{" "}
            changes — read a resource, 404 if it's missing, return JSON. Learn
            the pattern once and you can read it anywhere.
          </p>
          <div className="mt-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-slate-400">
            <RouteIcon width={15} height={15} className="text-brand-400" />
            GET /users/:id
          </div>
        </div>
        <CodeTabs snippets={SHOWCASE} />
      </section>

      {/* ── TRACKS ────────────────────────────────────────────── */}
      <section className="mt-24 sm:mt-32">
        <div className="mb-8 flex items-end justify-between gap-4 border-b border-slate-200/70 pb-4 dark:border-white/10">
          <div>
            <Eyebrow>four tracks</Eyebrow>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
              Beginner to systems thinker
            </h2>
          </div>
          <Link
            to="/roadmap"
            className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-400 sm:inline-flex"
          >
            Full roadmap
            <ArrowRight width={15} height={15} />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tracks.map((track, i) => {
            const lessons = track.stages.reduce((n, s) => n + s.lessons.length, 0);
            const doneCount = track.stages.reduce(
              (n, s) => n + s.lessons.filter((l) => completed.has(l.id)).length,
              0,
            );
            const first = track.stages[0]?.lessons[0]?.id;
            return (
              <Link
                key={track.name}
                to={first ? `/lesson/${first}` : "/roadmap"}
                className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white/60 p-5 transition hover:-translate-y-0.5 hover:border-brand-400/40 hover:bg-brand-500/[0.04] hover:shadow-card dark:border-white/10 dark:bg-white/[0.02]"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex -space-x-1">
                    {track.stages.slice(0, 3).map((s) => (
                      <span key={s.id} className="text-base">
                        {s.icon}
                      </span>
                    ))}
                  </span>
                  <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="font-display text-base font-bold text-ink-900 dark:text-white">
                  {track.name}
                </h3>
                <p className="mt-1 flex-1 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {track.blurb}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-slate-400">
                    {doneCount > 0 ? `${doneCount}/${lessons}` : `${lessons} lessons`}
                  </span>
                  <ArrowRight
                    width={15}
                    height={15}
                    className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-400"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── OUTCOMES ──────────────────────────────────────────── */}
      <section className="mt-24 sm:mt-32">
        <div className="rounded-3xl border border-slate-200/80 bg-slate-50/60 p-8 dark:border-white/10 dark:bg-white/[0.02] sm:p-12">
          <Eyebrow>by the end</Eyebrow>
          <h2 className="mt-2 max-w-2xl font-display text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl">
            Things you'll be able to do — and explain.
          </h2>
          <ul className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {OUTCOMES.map((o) => (
              <li key={o} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-500/15 text-accent-500">
                  <CheckIcon width={12} height={12} />
                </span>
                <span className="text-[14.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                  {o}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section className="mt-24 sm:mt-32">
        <Eyebrow>before you start</Eyebrow>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-3xl">
          Fair questions
        </h2>
        <dl className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2">
          {FAQ.map((f) => (
            <div key={f.q}>
              <dt className="font-display text-[15px] font-semibold text-ink-900 dark:text-white">
                {f.q}
              </dt>
              <dd className="mt-1.5 text-[14px] leading-relaxed text-slate-500 dark:text-slate-400">
                {f.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="mt-24 sm:mt-32">
        <div className="relative overflow-hidden rounded-3xl border border-brand-400/20 bg-gradient-to-br from-brand-500/10 via-transparent to-accent-500/10 p-10 text-center sm:p-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-20 -top-24 h-64 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(88,132,255,0.18),transparent)]"
          />
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-[2.5rem] sm:leading-tight">
            Stop calling the backend a black box.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] text-slate-500 dark:text-slate-400">
            {totalLessons} lessons · {hours}-ish hours · free and open. Your
            progress saves as you go.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {resumeId && (
              <Link to={`/lesson/${resumeId}`} className="btn-primary">
                {count > 0 ? "Continue learning" : "Start lesson 01"}
                <ArrowRight width={16} height={16} />
              </Link>
            )}
            <Link to="/roadmap" className="btn-ghost">
              Explore the roadmap
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ── helpers ─────────────────────────────────────────────────── */

function StatChip({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-display text-lg font-bold tabular-nums text-ink-900 dark:text-white">
        {n}
      </span>
      <span>{label}</span>
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
      {children}
    </p>
  );
}

function Pillar({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/50 p-5 transition hover:border-brand-400/30 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500/10 text-brand-500 dark:text-brand-300">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-[15px] font-bold text-ink-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
        {body}
      </p>
    </div>
  );
}

const OUTCOMES = [
  "Trace a request from the browser through DNS, TLS, and HTTP to a database and back.",
  "Design a clean REST API — right resources, right status codes, sane pagination.",
  "Model data, write real SQL joins, and read an EXPLAIN plan to kill slow queries.",
  "Secure an app: sessions vs JWT, OAuth, password hashing, and the OWASP Top 10.",
  "Scale it — caching, queues, load balancing, replication, sharding, and idempotency.",
  "Whiteboard a URL shortener, rate limiter, chat system, and news feed like a senior.",
];

const FAQ = [
  {
    q: "Do I need to know a backend language first?",
    a: "No. It's concepts first, and every example is shown in JavaScript, Python, Go, and Java — follow along in whichever feels closest to home.",
  },
  {
    q: "Is it tied to one framework?",
    a: "No. It's language- and framework-agnostic. You learn the ideas underneath Express, Django, Spring, and the rest — so any of them makes sense afterward.",
  },
  {
    q: "How is it structured?",
    a: "Four tracks, 11 stages, 68 lessons — foundations up to system design and an expert track. Short lessons, a quick quiz each, and links to go deeper.",
  },
  {
    q: "Is it really free?",
    a: "Yes, and open. Lessons are plain Markdown you can also read on GitHub. Your progress lives in your browser — no account, no sign-up.",
  },
];

/** Live multi-language showcase: the same endpoint, four ways. */
const SHOWCASE: CodeSnippet[] = [
  {
    lang: "js",
    code: `// Node.js — Express
app.get("/users/:id", async (req, res) => {
  const user = await db.users.find(req.params.id);
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(user);
});`,
  },
  {
    lang: "python",
    code: `# Python — FastAPI
@app.get("/users/{id}")
async def get_user(id: int):
    user = await db.users.find(id)
    if not user:
        raise HTTPException(status_code=404, detail="Not found")
    return user`,
  },
  {
    lang: "go",
    code: `// Go — net/http
func getUser(w http.ResponseWriter, r *http.Request) {
    user, err := db.FindUser(r.PathValue("id"))
    if err != nil {
        http.Error(w, "Not found", http.StatusNotFound)
        return
    }
    json.NewEncoder(w).Encode(user)
}`,
  },
  {
    lang: "java",
    code: `// Java — Spring Boot
@GetMapping("/users/{id}")
public User getUser(@PathVariable Long id) {
    return repo.findById(id)
        .orElseThrow(() -> new NotFoundException("Not found"));
}`,
  },
];
