export type Season = "Spring" | "Summer" | "Fall" | "Winter" | "Custom";

export type MpaRating = "G" | "PG" | "PG-13" | "R" | "NC-17" | "NR";

export type BadgeStyle = "tag" | "seal" | "ribbon" | "banner";

export interface Badge {
  id: string;
  text: string;
  style?: BadgeStyle;
}

export interface ImageState {
  source: "tmdb" | "upload";
  tmdbPath?: string;
  url: string;
  /** Dormant while cutout functionality is on hold; kept so re-enabling it later needs no migration. */
  cutoutUrl?: string;
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface ImageCandidate {
  tmdbPath: string;
  thumbUrl: string;
  fullUrl: string;
  kind: "backdrop" | "poster";
  voteScore: number;
  aspectRatio: number;
}

export interface TitleTextStyle {
  fontSize: number;
  kerning: number;
  lineSpacing: number;
  justify: "left" | "center" | "right";
  dropShadow: boolean;
  offsetX: number;
  offsetY: number;
  /** Per-word font-size overrides, parallel to the title split on whitespace. Missing/undefined entries use fontSize. */
  wordSizes?: number[];
  /** Word indices (0-based) after which to force a line break, set once by the auto-fit default. */
  manualLineBreaks?: number[];
}

export interface Title {
  id: string;
  tmdbId?: number;
  name: string;
  date: string;
  runtimeMinutes?: number;
  mpaRating: MpaRating;
  ratingVisible: boolean;
  image?: ImageState;
  imageCandidates?: ImageCandidate[];
  titleTextStyle: TitleTextStyle;
  runtimeOpacity: number;
  ratingOpacity: number;
  dateOffsetX: number;
  dateOffsetY: number;
  badges: Badge[];
  seriesId?: string;
}

export interface FillStyle {
  type: "color" | "gradient" | "image";
  value: string;
  value2?: string;
}

export interface SeriesBandStyle {
  background: FillStyle;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  kerning: number;
  lineSpacing: number;
  justify: "left" | "center" | "right";
  offsetX: number;
  offsetY: number;
  /** Per-word font-size overrides, parallel to the series name split on whitespace. */
  wordSizes?: number[];
}

export interface Series {
  id: string;
  name: string;
  titleIds: string[];
  bandStyle: SeriesBandStyle;
}

export interface CalendarSpacing {
  outerMargin: number;
  /** Gap between two adjacent boxes that are NOT in the same series. */
  boxGutter: number;
  /** Gap between two adjacent boxes that ARE in the same series. */
  seriesBoxGutter: number;
  rowGap: number;
  bandInset: number;
  bandHeightRatio: number;
  /** Corner radius, px, for free corners (touch neither a band nor a same-series neighbor). */
  primaryRadius: number;
  /** Corner radius, px, for corners between two boxes in the same series. */
  secondaryRadius: number;
  /** Corner radius, px, for corners where a box meets its series band. */
  tertiaryRadius: number;
}

export interface CalendarTheme {
  /** Single fill spanning the whole canvas — header/footer are blank space on this background for now. */
  background: FillStyle;
  spacing: CalendarSpacing;
}

export interface Calendar {
  id: string;
  season: Season;
  customSeasonLabel?: string;
  year: number;
  titles: Title[];
  series: Series[];
  theme: CalendarTheme;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarSummary {
  id: string;
  season: Season;
  customSeasonLabel?: string;
  year: number;
  updatedAt: string;
  createdAt: string;
}
