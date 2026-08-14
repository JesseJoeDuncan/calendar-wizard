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
}

export interface TitleTextStyle {
  fontSize: number;
  kerning: number;
  justify: "left" | "center" | "right";
  dropShadow: boolean;
  offsetX: number;
  offsetY: number;
  wordSizes?: number[];
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
  runtimeOpacity: number;
  ratingOpacity: number;
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

export interface VenueSettings {
  kicker: string;
  logoUrl: string;
  footerLogoUrl: string;
  venueName: string;
  address: string;
  doorsTime: string;
  showTime: string;
  ticketPrice: string;
  qrCodeUrl: string;
  qrTargetUrl: string;
  ageNote: string;
}

export interface CalendarSpacing {
  outerMargin: number;
  boxGutter: number;
  rowGap: number;
  bandInset: number;
  bandHeightRatio: number;
}

export interface CalendarTheme {
  headerBackground: { type: "color" | "gradient" | "image"; value: string; value2?: string };
  footerBackground: { type: "color" | "gradient"; value: string; value2?: string };
  seasonTextColor: string;
  accentColor: string;
  spacing: CalendarSpacing;
}

export interface Calendar {
  id: string;
  season: Season;
  customSeasonLabel?: string;
  year: number;
  titles: Title[];
  series: Series[];
  venue: VenueSettings;
  theme: CalendarTheme;
  createdAt: string;
  updatedAt: string;
}
