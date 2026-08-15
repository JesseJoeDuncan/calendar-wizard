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

export interface DateTextStyle {
  opacity: number;
  dropShadowOpacity: number;
  /** Letter-spacing for the day number only — the month line has its own fixed kerning. */
  numberKerning: number;
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
  dateStyle: DateTextStyle;
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
  /** Pixel gap between the bottom of the month line and the top of the day number (can be negative to overlap them slightly). */
  dateMonthGap: number;
  /** Fraction of the space between header and footer that the three rows collectively occupy — the remainder becomes breathing room, split evenly above and below the rows. */
  rowsHeightScale: number;
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

/** Optional extruded/echoed look for an element (see echoEffect.ts) — the element's own `color` is the front layer. */
export interface EchoLayerStyle {
  echoSpread: number;
  echo1Color: string;
  echo2Color: string;
  echo3Color: string;
}

export interface HeaderFooterElementStyle {
  visible: boolean;
  color: string;
  /** Pixel delta from the element's default guide-matched anchor position. */
  offsetX: number;
  offsetY: number;
  /** Uniform multiplier on the element's default (guide-matched) width; height follows its aspect ratio. */
  scale: number;
  /** Present only for elements that render with the echo effect (currently just the QR code). */
  echo?: EchoLayerStyle;
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

/**
 * The big "SEASON YEAR" title lockup (e.g. "SUMMER 2026"), rendered as extruded 3D block letters:
 * a front face plus 3 "echo" layers receding behind it. Font/size/kerning/echo-step are a fixed
 * recipe, not user settings — position, scale, and each layer's color are.
 */
export interface SeasonTitleStyle {
  visible: boolean;
  offsetX: number;
  offsetY: number;
  scale: number;
  /** Multiplier on the per-copy offset distance within each echo layer — 1 is the tuned default; lower packs the echoes tighter, higher spreads them further back. */
  echoSpread: number;
  frontColor: string;
  echo1Color: string;
  echo2Color: string;
  echo3Color: string;
}

/**
 * Every non-card, non-band color in a calendar's theme — the header/footer decorations, the season
 * title and its echoes, the QR code and its echoes, and the page background — identified so the
 * Default Settings page can group them under a handful of named palette colors instead of setting
 * each one individually. See lib/colorPalette.ts for the registry of these and colors' resolution.
 */
export type ColorableElementId =
  | "seasonTitleFront"
  | "seasonTitleEcho1"
  | "seasonTitleEcho2"
  | "seasonTitleEcho3"
  | "footerShape"
  | "sundayNightText"
  | "onyxLogo"
  | "doorsShowtimeText"
  | "nevadaTheatreLogo"
  | "nevadaTheatreText"
  | "allAgesText"
  | "ticketPriceText"
  | "qrArrow"
  | "domainText"
  | "qrCodeFront"
  | "qrCodeEcho1"
  | "qrCodeEcho2"
  | "qrCodeEcho3"
  | "background";

export interface ColorPaletteCategory {
  /** Stable id — "primary"/"secondary"/"tertiary"/"quaternary" for the 4 built-in ones, a generated id for added ones. */
  id: string;
  name: string;
  color: string;
}

/**
 * A named set of colors (Primary/Secondary/Tertiary/Quaternary, plus any added ones) and which of
 * them each colorable element currently uses. One of these exists per season (see SEASONS in
 * lib/colorPalette.ts) plus one for "Custom" (calendars with no season title), edited from the
 * Default Settings page's Color Palettes section.
 */
export interface ColorPalette {
  categories: ColorPaletteCategory[];
  assignments: Record<ColorableElementId, string>;
}

export type BackgroundTextureStyle = "none" | "paper" | "linen" | "dots" | "grid";

export interface BackgroundTexture {
  style: BackgroundTextureStyle;
  opacity: number;
}

export interface CalendarTheme {
  /** Single fill spanning the whole canvas, showing through wherever header/footer elements don't cover it. */
  background: FillStyle;
  backgroundTexture: BackgroundTexture;
  spacing: CalendarSpacing;
  headerFooter: CalendarHeaderFooter;
  seasonTitle: SeasonTitleStyle;
  /** Shared drop shadow applied to every movie card and every series band — not per-card/per-band. */
  cardShadow: DropShadowSettings;
  /**
   * The color palette baked into this calendar at creation time (a copy of that season's Default
   * Settings palette) — kept around so this calendar's own color pickers can offer it as quick-pick
   * swatches. Editing it here does NOT retroactively change any element's color; only the Default
   * Settings page's Color Palettes editor does that, and only for future calendars.
   */
  palette: ColorPalette;
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
