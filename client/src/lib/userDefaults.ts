import type { CalendarTheme, ColorPalette, Season, SeasonTitleStyle } from "../types/calendar";
import { DEFAULT_CARD_SHADOW, DEFAULT_CARD_TEXT, DEFAULT_SPACING } from "./calendarGeometry";
import { applyPaletteToTheme, defaultPaletteForSeason } from "./colorPalette";
import { deepMergeDefaults } from "./deepMerge";
import { defaultHeaderFooter, defaultSeasonTitleStyle } from "./headerFooterLayout";

const THEME_KEY = "calendarWizard.defaultTheme";
const PALETTES_KEY = "calendarWizard.defaultPalettes";
const SEASON_TITLE_LAYOUT_KEY = "calendarWizard.defaultSeasonTitleLayout";
const AUTOSAVE_KEY = "calendarWizard.autoSaveMinutes";

/** The season title's placement/scale/kerning — unlike the rest of CalendarTheme, this is season-specific (like the palette), not shared across every season. */
type SeasonTitleLayout = Pick<SeasonTitleStyle, "offsetX" | "offsetY" | "scale" | "kerning">;

export const DEFAULT_BACKGROUND_TEXTURE = { style: "none" as const, opacity: 0.15 };

// Non-color settings (spacing, positions, scale, texture...) are shared across every season; only
// the actual color values differ by season, resolved from a separate per-season ColorPalette (see
// colorPalette.ts) and layered on top at read time in getDefaultTheme(). The colors baked into this
// object are just a placeholder — applyPaletteToTheme always overwrites them.
export const HARDCODED_DEFAULT_THEME: CalendarTheme = {
  background: { type: "color", value: "#e8879a" },
  backgroundTexture: DEFAULT_BACKGROUND_TEXTURE,
  spacing: DEFAULT_SPACING,
  headerFooter: defaultHeaderFooter(),
  seasonTitle: defaultSeasonTitleStyle(),
  cardShadow: DEFAULT_CARD_SHADOW,
  cardText: DEFAULT_CARD_TEXT,
  palette: defaultPaletteForSeason("Custom"),
};

/** The saved non-color default settings, falling back to the hardcoded ones — see deepMergeDefaults. */
function getBaseDefaultTheme(): CalendarTheme {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw) return deepMergeDefaults(HARDCODED_DEFAULT_THEME, JSON.parse(raw));
  } catch {
    // ignore malformed storage
  }
  return HARDCODED_DEFAULT_THEME;
}

function getAllDefaultPalettes(): Partial<Record<Season, unknown>> {
  try {
    const raw = localStorage.getItem(PALETTES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore malformed storage
  }
  return {};
}

export function getDefaultPalette(season: Season): ColorPalette {
  const stored = getAllDefaultPalettes();
  return deepMergeDefaults(defaultPaletteForSeason(season), stored[season]);
}

function getAllSeasonTitleLayouts(): Partial<Record<Season, SeasonTitleLayout>> {
  try {
    const raw = localStorage.getItem(SEASON_TITLE_LAYOUT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore malformed storage
  }
  return {};
}

export function getDefaultSeasonTitleLayout(season: Season): SeasonTitleLayout {
  const base = defaultSeasonTitleStyle();
  const stored = getAllSeasonTitleLayouts();
  return deepMergeDefaults({ offsetX: base.offsetX, offsetY: base.offsetY, scale: base.scale, kerning: base.kerning }, stored[season]);
}

/** The default theme for a given season: shared spacing settings, that season's resolved palette colors, and that season's own season-title placement/scale/kerning. */
export function getDefaultTheme(season: Season): CalendarTheme {
  const themed = applyPaletteToTheme(getBaseDefaultTheme(), getDefaultPalette(season));
  return { ...themed, seasonTitle: { ...themed.seasonTitle, ...getDefaultSeasonTitleLayout(season) } };
}

export function saveAsDefaultTheme(theme: CalendarTheme, season: Season) {
  localStorage.setItem(THEME_KEY, JSON.stringify(theme));
  const allPalettes = getAllDefaultPalettes();
  allPalettes[season] = theme.palette;
  localStorage.setItem(PALETTES_KEY, JSON.stringify(allPalettes));

  const allLayouts = getAllSeasonTitleLayouts();
  allLayouts[season] = { offsetX: theme.seasonTitle.offsetX, offsetY: theme.seasonTitle.offsetY, scale: theme.seasonTitle.scale, kerning: theme.seasonTitle.kerning };
  localStorage.setItem(SEASON_TITLE_LAYOUT_KEY, JSON.stringify(allLayouts));
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
