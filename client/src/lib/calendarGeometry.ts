import type { CalendarSpacing } from "../types/calendar";
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
  bandInset: 14,
  bandHeightRatio: 0.15,
  primaryRadius: 25,
  secondaryRadius: 9,
  tertiaryRadius: 2,
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
}

export function computeGeometry(layout: CalendarLayout, spacing: Partial<CalendarSpacing> | undefined): CalendarGeometry {
  const { outerMargin, boxGutter, seriesBoxGutter, rowGap, bandInset, bandHeightRatio } = { ...DEFAULT_SPACING, ...spacing };

  const header = { x: 0, y: 0, w: CANVAS_W, h: HEADER_H };
  const footer = { x: 0, y: CANVAS_H - FOOTER_H, w: CANVAS_W, h: FOOTER_H };
  const bodyTop = HEADER_H;
  const bodyHeight = CANVAS_H - HEADER_H - FOOTER_H;
  const body = { x: 0, y: bodyTop, w: CANVAS_W, h: bodyHeight };

  const rowCount = layout.rows.length;
  const rowHeight = bodyHeight / rowCount;

  const rows: RowGeometry[] = layout.rows.map((row, i) => {
    const rowTop = bodyTop + i * rowHeight;
    const bandH = rowHeight * bandHeightRatio;
    // Every row reserves the same bottom gap before the next row, whether or not it has a band.
    const fullBoxH = rowHeight - rowGap;
    // A box that belongs to a series band is shorter by exactly the band's height, so the band's
    // own bottom edge lines up with the bottom of the row's full-height (non-series) boxes.
    const bandedBoxH = fullBoxH - bandH;

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

    const bands: BandGeometry[] = row.seriesBands.map((band) => {
      const startBox = boxes[band.startBoxIndex];
      const endBox = boxes[band.endBoxIndex];
      return {
        seriesId: band.seriesId,
        x: startBox.x + bandInset,
        y: rowTop + bandedBoxH,
        w: endBox.x + endBox.w - startBox.x - bandInset * 2,
        h: bandH,
      };
    });

    return { boxes, bands, top: rowTop, height: rowHeight };
  });

  return { header, footer, body, rows };
}
