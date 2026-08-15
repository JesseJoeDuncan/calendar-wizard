import type { CalendarTheme } from "../types/calendar";
import { DEFAULT_SPACING } from "./calendarGeometry";
import { defaultHeaderFooter } from "./headerFooterLayout";

const THEME_KEY = "calendarWizard.defaultTheme";
const AUTOSAVE_KEY = "calendarWizard.autoSaveMinutes";

export const HARDCODED_DEFAULT_THEME: CalendarTheme = {
  background: { type: "color", value: "#e8879a" },
  spacing: DEFAULT_SPACING,
  headerFooter: defaultHeaderFooter(),
};

/** The user's saved default theme (via "Save as default"), falling back to the hardcoded one. */
export function getDefaultTheme(): CalendarTheme {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CalendarTheme;
      return {
        ...HARDCODED_DEFAULT_THEME,
        ...parsed,
        spacing: { ...HARDCODED_DEFAULT_THEME.spacing, ...parsed.spacing },
        headerFooter: {
          ...HARDCODED_DEFAULT_THEME.headerFooter,
          ...parsed.headerFooter,
          ...Object.fromEntries(
            Object.entries(HARDCODED_DEFAULT_THEME.headerFooter).map(([id, style]) =>
              typeof style === "object" ? [id, { ...style, ...(parsed.headerFooter as Record<string, object>)?.[id] }] : [id, style]
            )
          ),
        },
      };
    }
  } catch {
    // ignore malformed storage
  }
  return HARDCODED_DEFAULT_THEME;
}

export function saveAsDefaultTheme(theme: CalendarTheme) {
  localStorage.setItem(THEME_KEY, JSON.stringify(theme));
}

export const DEFAULT_AUTOSAVE_MINUTES = 5;

export function getAutoSaveMinutes(): number {
  const raw = localStorage.getItem(AUTOSAVE_KEY);
  const n = raw ? Number(raw) : DEFAULT_AUTOSAVE_MINUTES;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_AUTOSAVE_MINUTES;
}

export function setAutoSaveMinutes(n: number) {
  localStorage.setItem(AUTOSAVE_KEY, String(n));
}
