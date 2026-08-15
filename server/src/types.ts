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
  wordSizes?: number[];
  manualLineBreaks?: number[];
}

export interface RuntimeRatingStyle {
  offsetX: number;
  offsetY: number;
  scale: number;
  opacity: number;
  dropShadow: boolean;
  dropShadowOpacity: number;
}

export interface Title {
  id: string;
  tmdbId?: number;
  name: string;
  date: string; // ISO yyyy-mm-dd
  runtimeMinutes?: number;
  mpaRating: MpaRating;
  ratingVisible: boolean;
  image?: ImageState;
  imageCandidates?: ImageCandidate[];
  titleTextStyle: TitleTextStyle;
  runtimeStyle: RuntimeRatingStyle;
  ratingStyle: RuntimeRatingStyle;
  dateOffsetX: number;
  dateOffsetY: number;
  badges: Badge[];
  seriesId?: string;
}

export interface SeriesBandStyle {
  background: { type: "color" | "gradient" | "image"; value: string; value2?: string };
  fontFamily: string;
  fontSize: number;
  textColor: string;
  kerning: number;
  lineSpacing: number;
  justify: "left" | "center" | "right";
  offsetX: number;
  offsetY: number;
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
  boxGutter: number;
  seriesBoxGutter: number;
  rowGap: number;
  bandHeightRatio: number;
  primaryRadius: number;
  secondaryRadius: number;
  tertiaryRadius: number;
  dateNumberSizePct: number;
  dateMonthSizePct: number;
}

export interface DropShadowSettings {
  enabled: boolean;
  color: string;
  blur: number;
  opacity: number;
  offsetX: number;
  offsetY: number;
}

export interface CalendarTheme {
  background: { type: "color" | "gradient" | "image"; value: string; value2?: string };
  spacing: CalendarSpacing;
  cardShadow: DropShadowSettings;
  // headerFooter intentionally left loosely typed here — the server treats it as opaque JSON.
  headerFooter?: unknown;
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
