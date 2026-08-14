import type { CalendarSpacing } from "../types/calendar";
import type { CalendarLayout } from "./layoutEngine";

export const CANVAS_W = 850;
export const CANVAS_H = 1100;

export const HEADER_H = 150;
export const FOOTER_H = 92;

export const DEFAULT_SPACING: CalendarSpacing = {
  outerMargin: 34,
  boxGutter: 6,
  rowGap: 10,
  bandInset: 14,
  bandHeightRatio: 0.15,
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
  const { outerMargin, boxGutter, rowGap, bandInset, bandHeightRatio } = { ...DEFAULT_SPACING, ...spacing };

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
    const totalGutter = boxGutter * (n - 1);
    const boxW = (CANVAS_W - 2 * outerMargin - totalGutter) / n;

    const boxes: BoxGeometry[] = row.boxes.map((b, k) => ({
      titleId: b.titleId,
      x: outerMargin + k * (boxW + boxGutter),
      y: rowTop,
      w: boxW,
      h: b.seriesId ? bandedBoxH : fullBoxH,
    }));

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
