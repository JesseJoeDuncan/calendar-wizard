import { computeAutoFitTitleText } from "./autoFitText";
import { computeGeometry, DEFAULT_DATE_STYLE, DEFAULT_RATING_STYLE, DEFAULT_RUNTIME_STYLE } from "./calendarGeometry";
import { buildLayout } from "./layoutEngine";
import type { Calendar, CalendarTheme, MpaRating, Series, Title } from "../types/calendar";

const SAMPLE_NAMES = [
  "The Wandering Light",
  "Paper Moon Nights",
  "Harbor of Echoes",
  "A Quiet Storm",
  "Neon Garden",
  "The Last Reel",
  "Whispering Pines",
  "Glass City Blues",
  "Midnight Ferris Wheel",
  "Second Sunrise",
  "The Cartographer",
  "Velvet Static",
];

const SAMPLE_RATINGS: MpaRating[] = ["G", "PG", "PG-13", "R", "NR"];

/**
 * Builds a fixed, lightweight sample calendar for previewing default settings — no images, no
 * server round-trip, just enough real structure (a two-title series, varied ratings/runtimes) to
 * show every setting having a visible effect.
 */
export function buildSampleCalendar(theme: CalendarTheme): Calendar {
  const seriesId = "sample-series";
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - baseDate.getDay());

  const titles: Title[] = SAMPLE_NAMES.map((name, i) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i * 7);
    return {
      id: `sample-${i}`,
      name,
      date: d.toISOString().slice(0, 10),
      runtimeMinutes: 88 + ((i * 13) % 60),
      mpaRating: SAMPLE_RATINGS[i % SAMPLE_RATINGS.length],
      ratingVisible: true,
      titleTextStyle: { fontSize: 0, kerning: 0, lineSpacing: 1.08, justify: "left", dropShadow: true, offsetX: 0, offsetY: 0 },
      runtimeStyle: { ...DEFAULT_RUNTIME_STYLE },
      ratingStyle: { ...DEFAULT_RATING_STYLE },
      dateStyle: { ...DEFAULT_DATE_STYLE },
      dateOffsetX: 0,
      dateOffsetY: 0,
      badges: [],
      seriesId: i === 4 || i === 5 ? seriesId : undefined,
    };
  });

  const series: Series[] = [
    {
      id: seriesId,
      name: "Sample Series",
      titleIds: [titles[4].id, titles[5].id],
      bandStyle: {
        background: { type: "color", value: "#2f6f7a" },
        fontFamily: "Futura Wizard",
        fontSize: 13,
        textColor: "#fce9c7",
        kerning: 1.5,
        lineSpacing: 1.08,
        justify: "center",
        offsetX: 0,
        offsetY: 0,
      },
    },
  ];

  // Auto-fit each title's font size once against this theme's geometry, the same way a real
  // calendar's titles get sized the first time their box width is known.
  const layout = buildLayout(titles, series);
  const geometry = computeGeometry(layout, theme.spacing);
  const widthByTitleId = new Map<string, number>();
  for (const row of geometry.rows) for (const box of row.boxes) widthByTitleId.set(box.titleId, box.w);
  const fittedTitles = titles.map((t) => {
    const w = widthByTitleId.get(t.id);
    if (!w) return t;
    const fit = computeAutoFitTitleText(t.name, w, "Futura Wizard Condensed");
    return { ...t, titleTextStyle: { ...t.titleTextStyle, fontSize: fit.fontSize, manualLineBreaks: fit.manualLineBreaks } };
  });

  const now = new Date().toISOString();
  return {
    id: "sample-defaults-preview",
    season: "Summer",
    year: new Date().getFullYear(),
    titles: fittedTitles,
    series,
    theme,
    createdAt: now,
    updatedAt: now,
  };
}
