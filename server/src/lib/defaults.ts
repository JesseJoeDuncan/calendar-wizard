import type { Calendar, CalendarTheme, SeriesBandStyle, Title, TitleTextStyle, VenueSettings } from "../types.js";

export const DEFAULT_VENUE: VenueSettings = {
  kicker: "SUNDAY NIGHT MOVIES AT THE NEVADA THEATRE",
  logoUrl: "/assets/logos/OnyxDowntown_Logo_POS.png",
  footerLogoUrl: "/assets/logos/nevada-theatre-logo.png",
  venueName: "THE NEVADA THEATRE",
  address: "401 BROAD ST, NEVADA CITY, CA",
  doorsTime: "6:30",
  showTime: "7:00",
  ticketPrice: "$10",
  qrCodeUrl: "/assets/OnyxDowntown-QRcode.png",
  qrTargetUrl: "TheOnyxTheatre.com",
  ageNote: "ALL AGES WELCOME!",
};

export const DEFAULT_THEME: CalendarTheme = {
  headerBackground: { type: "color", value: "#e8879a" },
  footerBackground: { type: "color", value: "#3f7688" },
  seasonTextColor: "#1c4f61",
  accentColor: "#e8879a",
  spacing: {
    outerMargin: 34,
    boxGutter: 6,
    rowGap: 10,
    bandInset: 14,
    bandHeightRatio: 0.15,
  },
};

export const DEFAULT_TITLE_TEXT_STYLE: TitleTextStyle = {
  fontSize: 15,
  kerning: 0,
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
    venue: { ...DEFAULT_VENUE },
    theme: { ...DEFAULT_THEME },
    createdAt: now,
    updatedAt: now,
  };
}
