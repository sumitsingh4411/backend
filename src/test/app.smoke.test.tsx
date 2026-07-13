import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import App from "../App";
import { PreferencesProvider } from "../providers/PreferencesProvider";
import { ProgressProvider } from "../providers/ProgressProvider";
import { RoadmapProvider } from "../providers/RoadmapProvider";
import { PRO_TOPICS } from "../lib/proTopics";
import { getSections } from "../pages/pro/registry";

/** Serve the REAL content files from public/content, like the dev server does. */
function mockFetchFromDisk() {
  vi.stubGlobal("fetch", async (url: string) => {
    const rel = String(url).replace(/^.*content\//, "");
    try {
      const body = readFileSync(
        resolve(process.cwd(), "public/content", rel),
        "utf8",
      );
      return { ok: true, status: 200, text: async () => body } as Response;
    } catch {
      return { ok: false, status: 404, text: async () => "" } as Response;
    }
  });
}

function renderApp(route = "/") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <PreferencesProvider>
        <ProgressProvider>
          <RoadmapProvider>
            <App />
          </RoadmapProvider>
        </ProgressProvider>
      </PreferencesProvider>
    </MemoryRouter>,
  );
}

describe("app smoke", () => {
  beforeEach(() => {
    localStorage.clear();
    mockFetchFromDisk();
  });

  it("renders the home hero, trace signature, and four tracks", async () => {
    renderApp("/");

    // hero renders once the manifest resolves
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 1, name: /Now .*build.* it/i }),
      ).toBeDefined(),
    );

    // the request-trace signature and its layer hops render
    expect(screen.getByText(/request.*trace/i)).toBeDefined();
    for (const layer of ["client", "http", "server", "database"]) {
      expect(screen.getByText(layer)).toBeDefined();
    }

    // the four tracks overview (home stays light — no full stage list here)
    for (const track of [
      "Foundations",
      "APIs & Data",
      "Scale & Ops",
      "Mastery",
    ]) {
      expect(screen.getAllByText(track).length).toBeGreaterThan(0);
    }

    // the richer landing sections render
    expect(screen.getByText(/Concepts, not frameworks/i)).toBeDefined();
    expect(
      screen.getByRole("heading", { name: /A backend is a backend/i }),
    ).toBeDefined();
    // multi-language showcase (CodeTabs) with all four languages
    for (const lang of ["JavaScript", "Python", "Go", "Java"]) {
      expect(screen.getByRole("button", { name: lang })).toBeDefined();
    }
    // outcomes + FAQ + closing CTA
    expect(screen.getByText(/Things you'll be able to do/i)).toBeDefined();
    expect(
      screen.getByText(/Do I need to know a backend language/i),
    ).toBeDefined();
    expect(screen.getByRole("heading", { name: /black box/i })).toBeDefined();
  });

  it("shows the whole curriculum on the /roadmap page", async () => {
    renderApp("/roadmap");

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 1, name: /The Roadmap/i }),
      ).toBeDefined(),
    );

    // every stage renders as a card on the timeline
    for (const stage of [
      "Foundations",
      "The Web & HTTP",
      "Servers & Runtimes",
      "APIs",
      "Databases",
      "Auth & Security",
      "Beyond Basics",
      "Architecture & Scaling",
      "DevOps & Deployment",
      "System Design",
      "Expert Track",
    ]) {
      expect(screen.getAllByText(stage).length).toBeGreaterThan(0);
    }

    // and the first + last lessons are listed
    expect(screen.getAllByText("What is Backend?").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Domain-Driven Design").length).toBeGreaterThan(
      0,
    );
  });

  it("reaches all eight Pro topics from the header menu", async () => {
    const user = userEvent.setup();
    renderApp("/");

    // the menu lives in the header, so it's reachable from any page
    await user.click(screen.getByRole("button", { name: /Pro Shelf/i }));

    const menu = screen.getByRole("navigation", { name: /Pro Shelf menu/i });
    for (const t of PRO_TOPICS) {
      const link = within(menu).getByRole("link", {
        name: new RegExp(t.title, "i"),
      });
      expect(link.getAttribute("href")).toBe(`/pro/${t.id}`);
    }
    expect(PRO_TOPICS).toHaveLength(8);
  });

  it("each header topic links its own section pages, straight from the strip", async () => {
    for (const t of PRO_TOPICS) {
      const { unmount } = renderApp(`/pro/${t.id}`);

      await waitFor(() =>
        expect(
          screen.getByRole("heading", {
            level: 1,
            name: new RegExp(`^${t.title}$`, "i"),
          }),
        ).toBeDefined(),
      );

      // the tab bar in the header shows every topic and is active for this one
      const strip = screen.getByRole("navigation", { name: /^Pro Shelf$/i });
      const tabHrefs = within(strip)
        .getAllByRole("link")
        .map((l) => l.getAttribute("href"));
      expect(tabHrefs).toEqual(PRO_TOPICS.map((p) => `/pro/${p.id}`));
      // the active tab carries aria-current
      expect(
        within(strip)
          .getByRole("link", { current: "page" })
          .getAttribute("href"),
      ).toBe(`/pro/${t.id}`);

      // the topic's front page links to a page PER SECTION
      const sections = getSections(t.id);
      expect(sections.length).toBeGreaterThanOrEqual(4);
      for (const s of sections) {
        expect(
          screen.getAllByRole("link", { name: new RegExp(s.title, "i") })
            .length,
        ).toBeGreaterThan(0);
      }

      unmount();
    }
  });

  it("a Pro section is its own page: docs frame, real content, cross-topic prev/next", async () => {
    // spot-check three sections across three different topics
    const cases: [string, string, string, RegExp][] = [
      ["databases", "indexes", "Indexes & query plans", /EXPLAIN plan/i],
      ["security", "sessions", "Sessions, JWT & OAuth", /Sign in with Google/i],
      [
        "system-design",
        "worked-designs",
        "Classic designs, worked",
        /celebrity problem/i,
      ],
    ];

    for (const [topic, section, title, contentRe] of cases) {
      const { unmount } = renderApp(`/pro/${topic}/${section}`);

      await waitFor(() =>
        expect(
          screen.getByRole("heading", {
            level: 1,
            name: new RegExp(title, "i"),
          }),
        ).toBeDefined(),
      );

      // the section's real reference content is on the page
      expect(screen.getAllByText(contentRe).length).toBeGreaterThan(0);

      // LEFT: a flush docs pane, scrollable, with a DEFINITE height (not max-h)
      const aside = document.querySelector("aside");
      expect(aside?.className).toContain("border-r");
      const wrapper = document.querySelector("aside > div");
      expect(wrapper?.className).toContain("h-[calc(100vh-4rem)]");
      expect(wrapper?.className).not.toContain("max-h-");
      expect(
        document.querySelector(".overflow-y-auto.overscroll-contain"),
      ).not.toBeNull();

      // the left nav lists every topic, and expands THIS topic into its sections
      const nav = screen.getByRole("navigation", { name: /Pro Shelf topics/i });
      for (const t of PRO_TOPICS) {
        expect(within(nav).getAllByText(t.title).length).toBeGreaterThan(0);
      }
      for (const s of getSections(topic)) {
        expect(
          within(nav)
            .getByRole("link", { name: new RegExp(s.title, "i") })
            .getAttribute("href"),
        ).toBe(`/pro/${topic}/${s.id}`);
      }

      // RIGHT: "On this page", built from the Blocks this section renders
      const toc = screen.getByRole("navigation", { name: /On this page/i });
      const tocLinks = within(toc).getAllByRole("link");
      expect(tocLinks.length).toBeGreaterThan(2);
      for (const link of tocLinks) {
        const anchor = link.getAttribute("href")!.slice(1);
        const el = document.getElementById(anchor);
        expect(el, `no section for #${anchor}`).not.toBeNull();
        expect(el!.dataset.proSection).toBeTruthy();
      }

      unmount();
    }
  });

  it("section prev/next crosses the topic boundary", async () => {
    // the last database section should point forward into the first APIs section
    const dbSections = getSections("databases");
    const last = dbSections[dbSections.length - 1];
    renderApp(`/pro/databases/${last.id}`);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          level: 1,
          name: new RegExp(last.title, "i"),
        }),
      ).toBeDefined(),
    );

    const firstApi = getSections("apis")[0];
    const nextLink = screen.getByRole("link", {
      name: new RegExp(firstApi.title, "i"),
    });
    expect(nextLink.getAttribute("href")).toBe(`/pro/apis/${firstApi.id}`);
  });

  it("features the external DevOps resource on every DevOps section page", async () => {
    for (const s of getSections("devops")) {
      const { unmount } = renderApp(`/pro/devops/${s.id}`);
      await waitFor(() =>
        expect(
          screen.getByRole("heading", {
            level: 1,
            name: new RegExp(s.title, "i"),
          }),
        ).toBeDefined(),
      );
      const link = screen.getByRole("link", {
        name: /devops\.nextjoblist\.com/i,
      });
      expect(link.getAttribute("href")).toBe("https://devops.nextjoblist.com/");
      expect(link.getAttribute("target")).toBe("_blank");
      unmount();
    }
  });

  it("sends /pro and any unknown topic to the first topic page", async () => {
    for (const route of ["/pro", "/pro/not-a-real-topic"]) {
      const { unmount } = renderApp(route);
      await waitFor(() =>
        expect(
          screen.getByRole("heading", { level: 1, name: /^Databases$/i }),
        ).toBeDefined(),
      );
      unmount();
    }
  });

  it("an unknown section under a real topic falls back to the topic page", async () => {
    renderApp("/pro/databases/not-a-real-section");
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 1, name: /^Databases$/i }),
      ).toBeDefined(),
    );
    // the topic front page lists its sections
    expect(
      screen.getAllByText(/Indexes & query plans/i).length,
    ).toBeGreaterThan(0);
  });

  it("marks the next unfinished lesson on the roadmap and advances it", async () => {
    // finish the first lesson up-front
    localStorage.setItem("br:progress", JSON.stringify(["what-is-backend"]));

    renderApp("/roadmap");
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 1, name: /The Roadmap/i }),
      ).toBeDefined(),
    );

    // exactly one "next" marker, on lesson 2 (lesson 1 is done)
    const nextBadges = screen.getAllByText("next");
    expect(nextBadges).toHaveLength(1);
    const row = nextBadges[0].closest("a");
    expect(row?.textContent).toContain("Frontend vs Backend");
  });

  it("opens a lesson, renders its markdown, and marks it complete", async () => {
    const user = userEvent.setup();
    renderApp("/lesson/what-is-backend");

    // markdown from the real .md file renders
    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: /Common misconceptions/i,
        }),
      ).toBeDefined(),
    );

    // quiz from roadmap.json renders
    expect(screen.getByText(/Check your understanding/i)).toBeDefined();

    // curated links ("Go deeper") render from the manifest
    expect(screen.getByRole("heading", { name: /Go deeper/i })).toBeDefined();
    expect(
      screen.getByRole("link", { name: /Backend Developer Roadmap/i }),
    ).toBeDefined();

    // progress starts empty, then marking complete persists
    const btn = screen.getByRole("button", { name: /Mark as complete/i });
    await user.click(btn);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Completed/i })).toBeDefined(),
    );
    expect(JSON.parse(localStorage.getItem("br:progress")!)).toContain(
      "what-is-backend",
    );
  });

  it("groups the sidebar into tracks and keeps the list scrollable", async () => {
    renderApp("/lesson/what-is-backend");

    // the "All stages" back link marks the sidebar as ready
    await waitFor(() =>
      expect(screen.getAllByText(/All stages/i).length).toBeGreaterThan(0),
    );

    // The list must be its own scroll container, and its wrapper must have a
    // DEFINITE height (not max-h) or the list gets clipped instead of scrolling.
    const scroller = document.querySelector(
      ".overflow-y-auto.overscroll-contain",
    );
    expect(scroller).not.toBeNull();

    const wrapper = document.querySelector("aside > div");
    expect(wrapper?.className).toContain("h-[calc(100vh-4rem)]");
    expect(wrapper?.className).not.toContain("max-h-");

    // the sidebar is a flush pane with a divider, not a bordered card
    const aside = document.querySelector("aside");
    expect(aside?.className).toContain("border-r");
    expect(aside?.className).not.toContain("glass");

    // stages are grouped under track headers
    expect(screen.getAllByText(/Track 1/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Track 4/i).length).toBeGreaterThan(0);

    // every stage row is listed (collapsed), so the nav genuinely overflows
    expect(screen.getAllByText(/Expert Track/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/System Design/i).length).toBeGreaterThan(0);

    // the active stage is expanded, so its lessons are visible
    expect(
      screen.getAllByText("The Client–Server Model").length,
    ).toBeGreaterThan(0);
  });

  it("renders the 'On this page' rail and links to real heading anchors", async () => {
    renderApp("/lesson/what-is-backend");

    await waitFor(() =>
      expect(screen.getByText(/On this page/i)).toBeDefined(),
    );

    const toc = screen.getByRole("navigation", { name: /On this page/i });
    const links = within(toc).getAllByRole("link");
    expect(links.length).toBeGreaterThan(2);

    // every TOC link must resolve to a heading that actually exists in the DOM
    for (const link of links) {
      const id = link.getAttribute("href")!.slice(1);
      const heading = document.getElementById(id);
      expect(heading, `no heading for #${id}`).not.toBeNull();
      expect(["H2", "H3"]).toContain(heading!.tagName);
    }

    // and it reflects this lesson's real headings
    expect(within(toc).getByText(/Common misconceptions/i)).toBeDefined();
  });

  it("renders multi-language code tabs and switches language", async () => {
    const user = userEvent.setup();
    // this lesson has adjacent js/python/go/java blocks
    renderApp("/lesson/request-response-anatomy");

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "JavaScript" })).toBeDefined(),
    );

    // all four language tabs exist
    for (const lang of ["JavaScript", "Python", "Go", "Java"]) {
      expect(screen.getByRole("button", { name: lang })).toBeDefined();
    }

    // switching persists the preferred language globally
    await user.click(screen.getByRole("button", { name: "Go" }));
    await waitFor(() => expect(localStorage.getItem("br:lang")).toBe("go"));
  });
});
