import type { CalendarTheme } from "../types/calendar";
import { DEFAULT_CARD_SHADOW, DEFAULT_SPACING } from "./calendarGeometry";
import { deepMergeDefaults } from "./deepMerge";
import { defaultHeaderFooter } from "./headerFooterLayout";

const THEME_KEY = "calendarWizard.defaultTheme";
const AUTOSAVE_KEY = "calendarWizard.autoSaveMinutes";

export const HARDCODED_DEFAULT_THEME: CalendarTheme = {
  background: { type: "color", value: "#e8879a" },
  spacing: DEFAULT_SPACING,
  headerFooter: defaultHeaderFooter(),
  cardShadow: DEFAULT_CARD_SHADOW,
};

/**
 * The user's saved default theme (set from the dedicated Default Settings page), falling back to
 * the hardcoded one. Uses a generic deep-merge keyed off the hardcoded shape, so a field added to
 * that shape later automatically appears here for old saved defaults instead of silently vanishing.
 */
export function getDefaultTheme(): CalendarTheme {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw) return deepMergeDefaults(HARDCODED_DEFAULT_THEME, JSON.parse(raw));
  } catch {
    // ignore malformed storage
  }
  return HARDCODED_DEFAULT_THEME;
}

export function saveAsDefaultTheme(theme: CalendarTheme) {
  localStorage.setItem(THEME_KEY, JSON.stringify(theme));
}

export function resetDefaultTheme() {
  localStorage.removeItem(THEME_KEY);
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
