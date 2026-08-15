import type { CalendarSpacing, DateTextStyle, DropShadowSettings, RuntimeRatingStyle } from "../types/calendar";
import type { CalendarLayout } from "./layoutEngine";

export const CANVAS_W = 850;
export const CANVAS_H = 1100;

export const HEADER_H = 150;
// Matches the footer graphics' real height in the header/footer placement guide (measured at
// canvas scale), not an arbitrary choice — growing it from the earlier placeholder value of 92
// shrinks rowHeight by a few px, which is expected.
export const FOOTER_H = 125;

// Row height is (CANVAS_H - HEADER_H - FOOTER_H) / 3 = 275px. rowGap/boxGutter/seriesBoxGutter
// defaults below were set as that value's 7% / 4% / 2% back when rowHeight was 286px and are
// left as literal px values, not recomputed off the new rowHeight.
export const DEFAULT_SPACING: CalendarSpacing = {
  outerMargin: 34,
  boxGutter: 11,
  seriesBoxGutter: 6,
  rowGap: 20,
  bandHeightRatio: 0.15,
  primaryRadius: 25,
  secondaryRadius: 9,
  tertiaryRadius: 2,
  dateNumberSizePct: 0.35,
  dateMonthSizePct: 0.1,
  dateMonthGap: -4,
  // Rows collectively fill 96% of the header-to-footer gap, leaving a little breathing room
  // above and below them.
  rowsHeightScale: 0.96,
};

export const DEFAULT_RUNTIME_STYLE: RuntimeRatingStyle = { offsetX: 0, offsetY: 0, scale: 1, opacity: 0.85, dropShadow: true, dropShadowOpacity: 0.5 };
export const DEFAULT_RATING_STYLE: RuntimeRatingStyle = { offsetX: 0, offsetY: 0, scale: 1, opacity: 0.85, dropShadow: true, dropShadowOpacity: 0.5 };
export const DEFAULT_DATE_STYLE: DateTextStyle = { opacity: 1, dropShadowOpacity: 0.6, numberKerning: 0 };

export const DEFAULT_CARD_SHADOW: DropShadowSettings = {
  enabled: true,
  color: "#000000",
  blur: 10,
  opacity: 0.28,
  offsetX: 0,
  offsetY: 3,
};

export interface BoxGeometry {
  titleId: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BandGeometry {
  seriesId: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RowGeometry {
  boxes: BoxGeometry[];
  bands: BandGeometry[];
  top: number;
  height: number;
}

export interface CalendarGeometry {
  header: { x: number; y: number; w: number; h: number };
  footer: { x: number; y: number; w: number; h: number };
  body: { x: number; y: number; w: number; h: number };
  rows: RowGeometry[];
  /** Height of a standard (non-series) card — constant across every row — used as the reference for date/month text sizing so it never varies card-to-card. */
  standardBoxH: number;
}

export function computeGeometry(layout: CalendarLayout, spacing: Partial<CalendarSpacing> | undefined): CalendarGeometry {
  const { outerMargin, boxGutter, seriesBoxGutter, rowGap, bandHeightRatio, rowsHeightScale } = { ...DEFAULT_SPACING, ...spacing };

  const header = { x: 0, y: 0, w: CANVAS_W, h: HEADER_H };
  const footer = { x: 0, y: CANVAS_H - FOOTER_H, w: CANVAS_W, h: FOOTER_H };
  const bodyTop = HEADER_H;
  const bodyHeight = CANVAS_H - HEADER_H - FOOTER_H;
  const body = { x: 0, y: bodyTop, w: CANVAS_W, h: bodyHeight };

  // The three rows collectively occupy only rowsHeightScale of the header-to-footer gap, leaving
  // the remainder as breathing room split evenly above (below the header) and below (above the
  // footer) them.
  const rowsHeight = bodyHeight * rowsHeightScale;
  const rowsTop = bodyTop + (bodyHeight - rowsHeight) / 2;

  const rowCount = layout.rows.length;
  const rowHeight = rowsHeight / rowCount;
  // Every row reserves the same bottom gap before the next row, whether or not it has a band —
  // so this (and therefore date/month text sizing) is identical across all rows.
  const standardBoxH = rowHeight - rowGap;

  const rows: RowGeometry[] = layout.rows.map((row, i) => {
    const rowTop = rowsTop + i * rowHeight;
    const bandH = rowHeight * bandHeightRatio;
    const fullBoxH = standardBoxH;
    // A box that belongs to a series band is shorter by the band's height plus the gutter between
    // the band and the cards above it, so the band's own bottom edge lines up with the bottom of
    // the row's full-height (non-series) boxes.
    const bandedBoxH = fullBoxH - bandH - seriesBoxGutter;

    const n = row.boxes.length;
    // Gap between box k and k+1 is the tighter intra-series gutter when both share a series,
    // otherwise the regular box gutter.
    const gaps: number[] = [];
    for (let k = 0; k < n - 1; k++) {
      const a = row.boxes[k].seriesId;
      const b = row.boxes[k + 1].seriesId;
      gaps.push(a && a === b ? seriesBoxGutter : boxGutter);
    }
    const totalGutter = gaps.reduce((sum, g) => sum + g, 0);
    const boxW = (CANVAS_W - 2 * outerMargin - totalGutter) / n;

    const boxes: BoxGeometry[] = [];
    let cursorX = outerMargin;
    row.boxes.forEach((b, k) => {
      boxes.push({
        titleId: b.titleId,
        x: cursorX,
        y: rowTop,
        w: boxW,
        h: b.seriesId ? bandedBoxH : fullBoxH,
      });
      cursorX += boxW + (gaps[k] ?? 0);
    });

    // The band spans the full width of its constituent cards (no inset) and sits exactly
    // seriesBoxGutter below them.
    const bands: BandGeometry[] = row.seriesBands.map((band) => {
      const startBox = boxes[band.startBoxIndex];
      const endBox = boxes[band.endBoxIndex];
      return {
        seriesId: band.seriesId,
        x: startBox.x,
        y: rowTop + bandedBoxH + seriesBoxGutter,
        w: endBox.x + endBox.w - startBox.x,
        h: bandH,
      };
    });

    return { boxes, bands, top: rowTop, height: rowHeight };
  });

  return { header, footer, body, rows, standardBoxH };
}
