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
  date: string;
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
  /** Gap between two adjacent boxes that ARE in the same series; also the gutter between a series band and its cards. */
  seriesBoxGutter: number;
  rowGap: number;
  bandHeightRatio: number;
  /** Corner radius, px, for free corners (touch neither a band nor a same-series neighbor). */
  primaryRadius: number;
  /** Corner radius, px, for corners between two boxes in the same series. */
  secondaryRadius: number;
  /** Corner radius, px, for corners where a box meets its series band. */
  tertiaryRadius: number;
  /** Date-number text height, as a fraction of a standard (non-series) card's height — constant across every card. */
  dateNumberSizePct: number;
  /** Date-month text height, as a fraction of a standard (non-series) card's height. */
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

export type FooterShapeVariant = "bumps" | "zigzags" | "straightline";

export interface HeaderFooterElementStyle {
  visible: boolean;
  color: string;
  /** Pixel delta from the element's default guide-matched anchor position. */
  offsetX: number;
  offsetY: number;
  /** Uniform multiplier on the element's default (guide-matched) width; height follows its aspect ratio. */
  scale: number;
}

export type HeaderFooterElementId =
  | "sundayNightText"
  | "onyxLogo"
  | "footerShape"
  | "nevadaTheatreText"
  | "nevadaTheatreLogo"
  | "doorsShowtimeText"
  | "allAgesText"
  | "ticketPriceText"
  | "qrArrow"
  | "qrCode"
  | "domainText";

export type CalendarHeaderFooter = {
  footerShapeVariant: FooterShapeVariant;
} & Record<HeaderFooterElementId, HeaderFooterElementStyle>;

export interface CalendarTheme {
  /** Single fill spanning the whole canvas, showing through wherever header/footer elements don't cover it. */
  background: FillStyle;
  spacing: CalendarSpacing;
  headerFooter: CalendarHeaderFooter;
  /** Shared drop shadow applied to every movie card and every series band — not per-card/per-band. */
  cardShadow: DropShadowSettings;
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
