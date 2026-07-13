import type { ComponentType } from "react";

/** The eight Pro Shelf topics. Drives routing, the header strip, and the nav. */
export interface ProTopic {
  id: string;
  n: string;
  icon: string;
  title: string;
  /** Compact label for the header tab bar, where space is tight. */
  short: string;
  kicker: string;
  blurb: string;
}

/** A topic is split into sections, and every section is its own page. */
export interface ProSection {
  id: string;
  title: string;
  icon: string;
  kicker: string;
  minutes: number;
  Content: ComponentType;
}

export const PRO_TOPICS: ProTopic[] = [
  {
    id: "databases",
    n: "01",
    icon: "🗄️",
    title: "Databases",
    short: "Databases",
    kicker: "model it, query it fast, keep it consistent",
    blurb:
      "Pick the right store, model it properly, index it, read an EXPLAIN plan, survive concurrent writes, and scale without shooting yourself in the foot.",
  },
  {
    id: "apis",
    n: "02",
    icon: "🔌",
    title: "APIs",
    short: "APIs",
    kicker: "a contract others build on — make it predictable",
    blurb:
      "REST done right, status codes that mean something, cursor pagination, versioning that doesn't break clients, idempotency, webhooks, and when to leave REST behind.",
  },
  {
    id: "security",
    n: "03",
    icon: "🔐",
    title: "Security",
    short: "Security",
    kicker: "never trust input · always check who's allowed",
    blurb:
      "Passwords, sessions vs JWT, OAuth and OIDC, authorization that actually holds, the OWASP risks that really bite, TLS, cookies and secrets.",
  },
  {
    id: "caching",
    n: "04",
    icon: "🔁",
    title: "Caching & Queues",
    short: "Caching",
    kicker: "serve it fast · do the slow work later",
    blurb:
      "Cache layers and patterns, invalidation, the three failure modes, Redis in practice, and background jobs that survive retries and crashes.",
  },
  {
    id: "performance",
    n: "05",
    icon: "⚡",
    title: "Performance",
    short: "Performance",
    kicker: "measure first — the bottleneck is never where you think",
    blurb:
      "Latency numbers, p95/p99, profiling and flame graphs, the usual suspects ranked, concurrency limits, and load testing before your users do it for you.",
  },
  {
    id: "reliability",
    n: "06",
    icon: "🕸️",
    title: "Reliability",
    short: "Reliability",
    kicker: "the network will fail — design like it already has",
    blurb:
      "Timeouts, retries with jitter, circuit breakers, CAP and consensus, the dual-write problem, and running a service you can actually be on call for.",
  },
  {
    id: "devops",
    n: "07",
    icon: "🚀",
    title: "DevOps & Deploys",
    short: "DevOps",
    kicker: "ship small, ship often, roll back instantly",
    blurb:
      "Containers, orchestration, CI/CD, canary releases, zero-downtime schema migrations, feature flags, infrastructure as code, and observability.",
  },
  {
    id: "system-design",
    n: "08",
    icon: "🧠",
    title: "System Design",
    short: "System Design",
    kicker: "the method matters more than the answer",
    blurb:
      "The method, back-of-envelope maths, the building blocks, the trade-offs you must voice, and the classic designs worked through end to end.",
  },
];

export const getTopic = (id?: string) => PRO_TOPICS.find((t) => t.id === id);

export const topicIndex = (id: string) =>
  PRO_TOPICS.findIndex((t) => t.id === id);
