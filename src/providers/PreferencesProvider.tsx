import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";
/** Canonical language keys used by the code-tab component. */
export type LangKey = "js" | "python" | "go" | "java";

export const LANG_LABELS: Record<LangKey, string> = {
  js: "JavaScript",
  python: "Python",
  go: "Go",
  java: "Java",
};

const THEME_KEY = "br:theme";
const LANG_KEY = "br:lang";

interface PreferencesValue {
  theme: Theme;
  toggleTheme: () => void;
  lang: LangKey;
  setLang: (lang: LangKey) => void;
}

const PreferencesContext = createContext<PreferencesValue | null>(null);

function initialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function initialLang(): LangKey {
  const stored = localStorage.getItem(LANG_KEY);
  if (stored === "js" || stored === "python" || stored === "go" || stored === "java")
    return stored;
  return "js";
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [lang, setLangState] = useState<LangKey>(initialLang);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    [],
  );

  const setLang = useCallback((next: LangKey) => {
    setLangState(next);
    localStorage.setItem(LANG_KEY, next);
  }, []);

  const value = useMemo(
    () => ({ theme, toggleTheme, lang, setLang }),
    [theme, toggleTheme, lang, setLang],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePreferences(): PreferencesValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx)
    throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
