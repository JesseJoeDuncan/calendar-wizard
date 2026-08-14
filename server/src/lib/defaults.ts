import type { Calendar, CalendarTheme, SeriesBandStyle, Title, TitleTextStyle } from "../types.js";

// Row height is derived from the fixed canvas layout (CANVAS_H 1100, HEADER_H 150, FOOTER_H 92,
// 3 rows): (1100-150-92)/3 = 286px. These defaults are that value's 7% / 4% / 2%, matching the
// requested row-gap / box-gutter / intra-series-gutter proportions.
export const DEFAULT_THEME: CalendarTheme = {
  background: { type: "color", value: "#e8879a" },
  spacing: {
    outerMargin: 34,
    boxGutter: 11,
    seriesBoxGutter: 6,
    rowGap: 20,
    bandInset: 14,
    bandHeightRatio: 0.15,
    primaryRadius: 25,
    secondaryRadius: 9,
    tertiaryRadius: 2,
  },
};

export const DEFAULT_TITLE_TEXT_STYLE: TitleTextStyle = {
  // 0 is a sentinel meaning "never auto-fit yet" — the editor computes a real value the first
  // time this title's box geometry is known, then it behaves like any other stored setting.
  fontSize: 0,
  kerning: 0,
  lineSpacing: 1.08,
  justify: "left",
  dropShadow: true,
  offsetX: 0,
  offsetY: 0,
};

export const DEFAULT_SERIES_BAND_STYLE: SeriesBandStyle = {
  background: { type: "color", value: "#2f6f7a" },
  fontFamily: "Futura Wizard",
  fontSize: 13,
  textColor: "#fce9c7",
  kerning: 1.5,
  lineSpacing: 1.08,
  justify: "center",
  offsetX: 0,
  offsetY: 0,
};

export function makeEmptyTitle(id: string, date: string): Title {
  return {
    id,
    name: "",
    date,
    mpaRating: "NR",
    ratingVisible: false,
    titleTextStyle: { ...DEFAULT_TITLE_TEXT_STYLE },
    runtimeOpacity: 0.85,
    ratingOpacity: 0.85,
    dateOffsetX: 0,
    dateOffsetY: 0,
    badges: [],
  };
}

export function makeNewCalendar(id: string, season: Calendar["season"], year: number, customSeasonLabel?: string): Calendar {
  const now = new Date().toISOString();
  const titles: Title[] = Array.from({ length: 12 }, (_, i) => makeEmptyTitle(`t${i + 1}`, ""));
  return {
    id,
    season,
    customSeasonLabel,
    year,
    titles,
    series: [],
    theme: { ...DEFAULT_THEME },
    createdAt: now,
    updatedAt: now,
  };
}
