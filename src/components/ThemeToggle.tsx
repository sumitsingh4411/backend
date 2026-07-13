import { usePreferences } from "../providers/PreferencesProvider";
import { MoonIcon, SunIcon } from "./Icons";

export function ThemeToggle() {
  const { theme, toggleTheme } = usePreferences();
  return (
    <button
      onClick={toggleTheme}
      className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200/80 text-ink-700 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
      aria-label="Toggle theme"
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
    >
      {theme === "dark" ? (
        <SunIcon width={17} height={17} />
      ) : (
        <MoonIcon width={17} height={17} />
      )}
    </button>
  );
}
