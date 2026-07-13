import { useEffect, useRef, useState, type ReactNode } from "react";
import type { TocItem } from "../lib/toc";
import { ProSidebar } from "./ProSidebar";
import { TableOfContents } from "./TableOfContents";
import { CloseIcon, MenuIcon } from "./Icons";

/**
 * The docs frame every Pro page sits in: topic/section nav on the left, the
 * page in the middle, "On this page" on the right.
 *
 * The right rail isn't hand-written — it's read back out of the rendered page
 * (every <Block> tags itself with `data-pro-section`), so a page declares its
 * sections once and both rails follow.
 */
export function ProShell({
  activeTopicId,
  activeSectionId,
  scanKey,
  children,
}: {
  activeTopicId: string;
  activeSectionId?: string;
  scanKey: string;
  children: ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    setToc(
      Array.from(root.querySelectorAll<HTMLElement>("[data-pro-section]"))
        .filter((el) => el.id)
        .map((el) => ({
          id: el.id,
          text: el.dataset.proSection ?? el.id,
          level: 2 as const,
        })),
    );
    window.scrollTo({ top: 0 });
    setDrawerOpen(false);
  }, [scanKey]);

  return (
    <div className="lg:grid lg:grid-cols-[288px_minmax(0,1fr)] xl:grid-cols-[288px_minmax(0,1fr)_248px]">
      {/* LEFT: the eight topics; the one you're in opens into its pages */}
      <aside className="hidden border-r border-slate-200/70 lg:block dark:border-white/10">
        <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
          <ProSidebar
            activeTopicId={activeTopicId}
            activeSectionId={activeSectionId}
          />
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" />
          <div
            className="absolute left-0 top-0 flex h-full w-[85%] max-w-xs flex-col border-r border-slate-200/70 bg-white dark:border-white/10 dark:bg-ink-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 justify-end p-2">
              <button
                onClick={() => setDrawerOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
                aria-label="Close menu"
              >
                <CloseIcon width={18} height={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <ProSidebar
                activeTopicId={activeTopicId}
                activeSectionId={activeSectionId}
                onNavigate={() => setDrawerOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      <article className="mx-auto w-full min-w-0 max-w-3xl px-5 py-8 sm:px-8 lg:px-10 xl:px-12">
        <div className="mb-6 flex justify-end lg:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="btn-ghost !px-2.5 !py-1.5"
            aria-label="Open Pro Shelf navigation"
          >
            <MenuIcon width={16} height={16} />
            Contents
          </button>
        </div>

        <div ref={contentRef}>{children}</div>
      </article>

      {/* RIGHT: rendered after the article, so the sections it observes exist */}
      <aside className="hidden pr-6 xl:block">
        <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain py-8">
          <TableOfContents items={toc} />
        </div>
      </aside>
    </div>
  );
}
