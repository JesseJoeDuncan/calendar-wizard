import type { CalendarTheme, ColorableElementId, ColorPalette, ColorPaletteCategory, Season } from "../types/calendar";

export const PALETTE_SEASONS: Season[] = ["Spring", "Summer", "Fall", "Winter", "Custom"];

export const COLORABLE_ELEMENTS: { id: ColorableElementId; label: string }[] = [
  { id: "seasonTitleFront", label: "Calendar Title Text" },
  { id: "footerShape", label: "Footer Background" },
  { id: "qrCodeEcho3", label: "QR Echo 3" },
  { id: "sundayNightText", label: "Kicker Text (Sunday Night Movies...)" },
  { id: "onyxLogo", label: "Onyx Downtown Logo" },
  { id: "seasonTitleEcho1", label: "Title Echo 1" },
  { id: "doorsShowtimeText", label: "Doors/Showtime Pill" },
  { id: "qrCodeEcho2", label: "QR Echo 2" },
  { id: "seasonTitleEcho2", label: "Title Echo 2" },
  { id: "nevadaTheatreLogo", label: "Nevada Theatre Logo" },
  { id: "nevadaTheatreText", label: "Nevada Theatre Text" },
  { id: "allAgesText", label: "All Ages Welcome Text" },
  { id: "ticketPriceText", label: "Ticket Price Text" },
  { id: "qrArrow", label: "QR Arrow" },
  { id: "domainText", label: "Website URL Text" },
  { id: "qrCodeFront", label: "QR Code" },
  { id: "seasonTitleEcho3", label: "Title Echo 3" },
  { id: "qrCodeEcho1", label: "QR Echo 1" },
  { id: "background", label: "Calendar Background" },
];

const BUILTIN_CATEGORY_IDS = ["primary", "secondary", "tertiary", "quaternary"];

/** The default grouping of every colorable element under the 4 built-in categories. */
const DEFAULT_ASSIGNMENTS: Record<ColorableElementId, string> = {
  seasonTitleFront: "primary",
  footerShape: "primary",
  qrCodeEcho3: "primary",
  sundayNightText: "secondary",
  onyxLogo: "secondary",
  seasonTitleEcho1: "secondary",
  doorsShowtimeText: "secondary",
  qrCodeEcho2: "secondary",
  seasonTitleEcho2: "tertiary",
  nevadaTheatreLogo: "tertiary",
  nevadaTheatreText: "tertiary",
  allAgesText: "tertiary",
  ticketPriceText: "tertiary",
  qrArrow: "tertiary",
  domainText: "tertiary",
  qrCodeFront: "tertiary",
  seasonTitleEcho3: "quaternary",
  qrCodeEcho1: "quaternary",
  background: "quaternary",
};

/** Primary/Quaternary (the "accent" slots) vary by season; Secondary/Tertiary stay brand ink black. */
const SEASON_ACCENT_COLORS: Record<Season, { primary: string; quaternary: string }> = {
  Spring: { primary: "#5a8f69", quaternary: "#f6c2d9" },
  Summer: { primary: "#1d6579", quaternary: "#e8879a" },
  Fall: { primary: "#b5502e", quaternary: "#d9a441" },
  Winter: { primary: "#2c4a6e", quaternary: "#cfd8e3" },
  Custom: { primary: "#1d6579", quaternary: "#e8879a" },
};

export function defaultPaletteForSeason(season: Season): ColorPalette {
  const accents = SEASON_ACCENT_COLORS[season];
  const categories: ColorPaletteCategory[] = [
    { id: "primary", name: "Primary", color: accents.primary },
    { id: "secondary", name: "Secondary", color: "#000000" },
    { id: "tertiary", name: "Tertiary", color: "#000000" },
    { id: "quaternary", name: "Quaternary", color: accents.quaternary },
  ];
  return { categories, assignments: { ...DEFAULT_ASSIGNMENTS } };
}

export function isBuiltinCategory(id: string): boolean {
  return BUILTIN_CATEGORY_IDS.includes(id);
}

export function nextAddedCategoryName(existing: ColorPaletteCategory[]): string {
  return `Color ${existing.length + 1}`;
}

/** The hex color a given element currently resolves to under this palette. */
export function resolveElementColor(palette: ColorPalette, elementId: ColorableElementId): string {
  const categoryId = palette.assignments[elementId];
  const category = palette.categories.find((c) => c.id === categoryId);
  return category?.color ?? palette.categories[0]?.color ?? "#000000";
}

/** Applies every element's resolved palette color onto a theme, leaving everything else (position, scale, spacing...) untouched. */
export function applyPaletteToTheme(theme: CalendarTheme, palette: ColorPalette): CalendarTheme {
  const color = (id: ColorableElementId) => resolveElementColor(palette, id);
  return {
    ...theme,
    palette,
    background: { ...theme.background, value: color("background") },
    headerFooter: {
      ...theme.headerFooter,
      footerShape: { ...theme.headerFooter.footerShape, color: color("footerShape") },
      sundayNightText: { ...theme.headerFooter.sundayNightText, color: color("sundayNightText") },
      onyxLogo: { ...theme.headerFooter.onyxLogo, color: color("onyxLogo") },
      doorsShowtimeText: { ...theme.headerFooter.doorsShowtimeText, color: color("doorsShowtimeText") },
      nevadaTheatreLogo: { ...theme.headerFooter.nevadaTheatreLogo, color: color("nevadaTheatreLogo") },
      nevadaTheatreText: { ...theme.headerFooter.nevadaTheatreText, color: color("nevadaTheatreText") },
      allAgesText: { ...theme.headerFooter.allAgesText, color: color("allAgesText") },
      ticketPriceText: { ...theme.headerFooter.ticketPriceText, color: color("ticketPriceText") },
      qrArrow: { ...theme.headerFooter.qrArrow, color: color("qrArrow") },
      domainText: { ...theme.headerFooter.domainText, color: color("domainText") },
      qrCode: {
        ...theme.headerFooter.qrCode,
        color: color("qrCodeFront"),
        echo: theme.headerFooter.qrCode.echo && {
          ...theme.headerFooter.qrCode.echo,
          echo1Color: color("qrCodeEcho1"),
          echo2Color: color("qrCodeEcho2"),
          echo3Color: color("qrCodeEcho3"),
        },
      },
    },
    seasonTitle: {
      ...theme.seasonTitle,
      frontColor: color("seasonTitleFront"),
      echo1Color: color("seasonTitleEcho1"),
      echo2Color: color("seasonTitleEcho2"),
      echo3Color: color("seasonTitleEcho3"),
    },
  };
}
