import { CANVAS_H, CANVAS_W, FOOTER_H } from "./calendarGeometry";
import type { CalendarHeaderFooter, FooterShapeVariant, HeaderFooterElementId, HeaderFooterElementStyle, SeasonTitleStyle } from "../types/calendar";

const ASSET_BASE = "/assets/header-footer";

export interface ElementAnchor {
  x: number;
  y: number;
  w: number;
  h: number;
  asset: string;
}

// Default x/y/w/h are measured directly off the header/footer placement guide (at the guide's
// 6px-per-canvas-px scale); h is derived from each asset's own natural aspect ratio so scaling
// never distorts it. These are anchors, not settings — user adjustments are offsetX/offsetY/scale
// deltas applied on top, stored in CalendarHeaderFooter.
export const HEADER_FOOTER_ANCHORS: Record<Exclude<HeaderFooterElementId, "footerShape">, ElementAnchor> = {
  sundayNightText: { x: 102, y: 38, w: 634, h: 15.11, asset: `${ASSET_BASE}/sunday-night-movies.png` },
  onyxLogo: { x: 90, y: 72.5, w: 142.8, h: 72.8, asset: `${ASSET_BASE}/onyx-downtown-logo.png` },
  nevadaTheatreText: { x: 44, y: 1000, w: 275, h: 77.85, asset: `${ASSET_BASE}/nevada-theatre-text.png` },
  nevadaTheatreLogo: { x: 48, y: 1017, w: 68.5, h: 53.31, asset: `${ASSET_BASE}/nevada-theatre-logo.png` },
  doorsShowtimeText: { x: 345, y: 992, w: 221, h: 59.75, asset: `${ASSET_BASE}/doors-showtime.png` },
  allAgesText: { x: 350, y: 1047, w: 212, h: 14.97, asset: `${ASSET_BASE}/all-ages-welcome.png` },
  ticketPriceText: { x: 590, y: 992, w: 114, h: 59.94, asset: `${ASSET_BASE}/ticket-price.png` },
  qrArrow: { x: 617, y: 1033, w: 85, h: 39.68, asset: `${ASSET_BASE}/qr-arrow.png` },
  qrCode: { x: 697, y: 992, w: 93, h: 93, asset: `${ASSET_BASE}/qr-code.png` },
  domainText: { x: 667, y: 1063, w: 149, h: 13.7, asset: `${ASSET_BASE}/the-onyx-theatre-com.png` },
};

// The footer shape's own natural pixel size (from the source artwork) — used only to derive its
// aspect ratio. Its default height (354) is deliberately taller than FOOTER_H (125): its top edge
// (with the scalloped/zigzag pattern) lines up with the top of the footer band, and the rest
// overflows below the visible canvas/page and is simply cropped off, the same way a Photoshop
// layer can hang off the bottom of the canvas without being resized.
const FOOTER_SHAPE_NATURAL: Record<FooterShapeVariant, { w: number; h: number; asset: string }> = {
  bumps: { w: 3400, h: 1416, asset: `${ASSET_BASE}/footer-shape-bumps.png` },
  zigzags: { w: 3400, h: 1392, asset: `${ASSET_BASE}/footer-shape-zigzags.png` },
  straightline: { w: 3400, h: 1349, asset: `${ASSET_BASE}/footer-shape-straightline.png` },
};

export function getFooterShapeAnchor(variant: FooterShapeVariant): ElementAnchor {
  const natural = FOOTER_SHAPE_NATURAL[variant];
  const w = CANVAS_W;
  const h = (w * natural.h) / natural.w;
  return { x: 0, y: CANVAS_H - FOOTER_H, w, h, asset: natural.asset };
}

export function getElementAnchor(id: HeaderFooterElementId, footerShapeVariant: FooterShapeVariant): ElementAnchor {
  return id === "footerShape" ? getFooterShapeAnchor(footerShapeVariant) : HEADER_FOOTER_ANCHORS[id];
}

// Top-left of the season title's bounding box (before the user's own offsetX/offsetY/scale) —
// to the right of the Onyx Downtown logo, vertically centered against it.
export const SEASON_TITLE_ANCHOR = { x: 258, y: 78 };

export function defaultSeasonTitleStyle(): SeasonTitleStyle {
  return {
    visible: true,
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    frontColor: "#1d6579",
    echo1Color: "#dce2ea",
    echo2Color: "#e8c14c",
    echo3Color: "#dd7b6c",
  };
}

export const HEADER_FOOTER_ELEMENT_IDS: HeaderFooterElementId[] = [
  "sundayNightText",
  "onyxLogo",
  "footerShape",
  "nevadaTheatreText",
  "nevadaTheatreLogo",
  "doorsShowtimeText",
  "allAgesText",
  "ticketPriceText",
  "qrArrow",
  "qrCode",
  "domainText",
];

export const HEADER_FOOTER_ELEMENT_LABELS: Record<HeaderFooterElementId, string> = {
  sundayNightText: "“Sunday Night Movies” header text",
  onyxLogo: "Onyx Downtown logo",
  footerShape: "Footer background shape",
  nevadaTheatreText: "Nevada Theatre address text",
  nevadaTheatreLogo: "Nevada Theatre building icon",
  doorsShowtimeText: "Doors / showtime pill",
  allAgesText: "“All ages welcome” text",
  ticketPriceText: "Ticket price text",
  qrArrow: "QR arrow",
  qrCode: "QR code",
  domainText: "TheOnyxTheatre.com text",
};

function defaultElementStyle(color: string): HeaderFooterElementStyle {
  return { visible: true, color, offsetX: 0, offsetY: 0, scale: 1 };
}

// Every element but the footer shape is ink sitting on top of it (or on the page background), so
// it defaults to black; the shape itself defaults to the guide's mid-gray so ink on top of it —
// including the doors/showtime and ticket-price pills, whose "reversed" text is really a cutout
// revealing whatever's directly behind — stays visible instead of black-on-black.
export function defaultHeaderFooter(): CalendarHeaderFooter {
  const elements = Object.fromEntries(
    HEADER_FOOTER_ELEMENT_IDS.map((id) => [id, defaultElementStyle(id === "footerShape" ? "#8a8a8a" : "#000000")])
  ) as Record<HeaderFooterElementId, HeaderFooterElementStyle>;
  return { footerShapeVariant: "bumps", ...elements };
}
