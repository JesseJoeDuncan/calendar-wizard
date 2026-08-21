import { useEffect, useState } from "react";

const KEY = "calendarWizard.theme";

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Explicit light/dark override on top of the OS preference, persisted and applied via a
 * data-theme attribute on <html> that index.css's media-query tokens are guarded against. */
export function useThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem(KEY);
    if (stored === "light" || stored === "dark") return stored;
    return systemPrefersDark() ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(KEY, theme);
  }, [theme]);

  function toggle() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  return { theme, toggle };
}
