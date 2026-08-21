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
  rotation: 0 | 90 | 180 | 270;
  flipHorizontal: boolean;
  flipVertical: boolean;
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
  /** Per-title override of TitleTextDefaults.wrapCharThreshold — the character count above which the auto-fit sizing forces a second line. */
  wrapCharThreshold?: number;
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

export type CustomElementKind = "text" | "image";

/** A freeform, user-added text or image layer — used both per-title (Title.customElements) and in the header/footer (CalendarHeaderFooter.customElements). Later entries in an array paint on top of (occlude) earlier ones and the fixed elements around them. */
export interface CustomElementStyle {
  id: string;
  kind: CustomElementKind;
  /** Set once at creation ("New Text Element 1" etc.) — the CollapsibleSection title for this element. */
  label: string;
  visible: boolean;
  offsetX: number;
  offsetY: number;
  scale: number;
  /** kind: "text" */
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  kerning?: number;
  /** kind: "image" */
  imageUrl?: string;
}

export interface Title {
  id: string;
  tmdbId?: number;
  name: string;
  date: string;
  runtimeMinutes?: number;
  mpaRating: MpaRating;
  ratingVisible: boolean;
  imageVisible: boolean;
  titleVisible: boolean;
  dateVisible: boolean;
  runtimeVisible: boolean;
  image?: ImageState;
  imageCandidates?: ImageCandidate[];
  titleTextStyle: TitleTextStyle;
  runtimeStyle: RuntimeRatingStyle;
  ratingStyle: RuntimeRatingStyle;
  dateStyle: DateTextStyle;
  dateOffsetX: number;
  dateOffsetY: number;
  badges: Badge[];
  customElements: CustomElementStyle[];
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
  /** Opacity of the series name text (not the tag background). */
  opacity: number;
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
  customElements: CustomElementStyle[];
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
  /** Letter-spacing applied to both the season word and the year. */
  kerning: number;
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

/** Shared look for a block of card text — the specific fields each text element also needs (margins, kerning...) extend this. */
export interface TextLookDefaults {
  fontFamily: string;
  color: string;
  dropShadowColor: string;
  dropShadowBlur: number;
}

/** Applied to every card's date/month text uniformly (like cardShadow) — not a per-title override. */
export interface DateTextDefaults extends TextLookDefaults {
  /** Pixel inset from the card's left edge. */
  marginX: number;
  /** Pixel inset from the card's top edge. */
  marginY: number;
  /** Letter-spacing for the month line only — the day number's kerning is a per-title setting (DateTextStyle.numberKerning). */
  monthKerning: number;
}

/** Applied to every card's title text uniformly. */
export interface TitleTextDefaults extends TextLookDefaults {
  /** Pixel inset from the card's left AND right edges. */
  marginX: number;
  /** Default gap above the card's bottom edge, as a fraction of row height. */
  bottomGapPct: number;
  /** Character count above which the auto-fit sizing forces a second line — per-title titleTextStyle.wrapCharThreshold overrides this. */
  wrapCharThreshold: number;
}

/** Applied to every card's runtime text uniformly. */
export interface RuntimeTextDefaults extends TextLookDefaults {
  baseSize: number;
  /** Pixel inset from the card's right edge. */
  marginX: number;
  /** Pixel inset from the card's bottom edge. */
  marginY: number;
  kerning: number;
}

/** Applied to every card's rating badge uniformly — ratingVisible itself stays a per-title toggle, seeded from visibleByRating at creation time. */
export interface RatingDefaults {
  baseSize: number;
  /** Tint applied to the (white) badge artwork. */
  color: string;
  dropShadowColor: string;
  dropShadowBlur: number;
  /** Multiplier on baseSize per rating, e.g. so PG-13 can render slightly larger than R. */
  sizeByRating: Record<MpaRating, number>;
  /** Whether a newly-rated title defaults to showing its badge, per rating. */
  visibleByRating: Record<MpaRating, boolean>;
  /** When true, the badge's horizontal center locks to the runtime text's anchor line instead of using its own corner margin. */
  snapToRuntimeX: boolean;
}

/** Seeds a newly-created series' own (independently editable) bandStyle — not re-applied to existing series. */
export interface SeriesTagDefaults {
  fontFamily: string;
  fontSize: number;
  textColor: string;
  tagColor: string;
  opacity: number;
  kerning: number;
}

export interface CardTextDefaults {
  date: DateTextDefaults;
  title: TitleTextDefaults;
  runtime: RuntimeTextDefaults;
  rating: RatingDefaults;
  seriesTag: SeriesTagDefaults;
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
  cardText: CardTextDefaults;
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
  /** User-set rename (via the TopBar calendar switcher) — overrides the computed season/year label when present. */
  customName?: string;
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
  customName?: string;
  year: number;
  updatedAt: string;
  createdAt: string;
}
