import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useRoadmap } from "./providers/RoadmapProvider";
import { Header } from "./components/Header";
import { CommandPalette } from "./components/CommandPalette";
import { ErrorScreen, LoadingScreen } from "./components/StateScreens";
import { HomePage } from "./pages/HomePage";
import { RoadmapPage } from "./pages/RoadmapPage";
import { ProTopicPage } from "./pages/ProTopicPage";
import { ProSectionPage } from "./pages/ProSectionPage";
import { PRO_TOPICS } from "./lib/proTopics";
import { LessonPage } from "./pages/LessonPage";

export default function App() {
  const { loading, error, reload } = useRoadmap();
  const [searchOpen, setSearchOpen] = useState(false);

  // Global ⌘K / Ctrl+K to open search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 grid-backdrop" />
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(56,132,255,0.16),transparent)]" />

      <Header onOpenSearch={() => setSearchOpen(true)} />

      {/* full-bleed: each page owns its own width + padding (the lesson page
          runs edge-to-edge as a docs layout; home/roadmap stay centered) */}
      <main className="w-full">
        {loading ? (
          <LoadingScreen />
        ) : error ? (
          <ErrorScreen error={error} onRetry={reload} />
        ) : (
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            {/* no hub page — the header strip goes straight to a topic,
                and every section inside a topic is its own page */}
            <Route
              path="/pro"
              element={<Navigate to={`/pro/${PRO_TOPICS[0].id}`} replace />}
            />
            <Route path="/pro/:topic" element={<ProTopicPage />} />
            <Route path="/pro/:topic/:section" element={<ProSectionPage />} />
            <Route path="/lesson/:id" element={<LessonPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
