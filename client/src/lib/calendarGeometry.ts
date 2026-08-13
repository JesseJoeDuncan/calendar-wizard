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
    const hasBand = row.seriesBands.length > 0;
    const bandH = hasBand ? rowHeight * bandHeightRatio : 0;
    const boxH = rowHeight - bandH - rowGap;
    const boxTop = rowTop;
    const bandTop = boxTop + boxH + rowGap * 0.3;

    const n = row.boxes.length;
    const totalGutter = boxGutter * (n - 1);
    const boxW = (CANVAS_W - 2 * outerMargin - totalGutter) / n;

    const boxes: BoxGeometry[] = row.boxes.map((b, k) => ({
      titleId: b.titleId,
      x: outerMargin + k * (boxW + boxGutter),
      y: boxTop,
      w: boxW,
      h: boxH,
    }));

    const bands: BandGeometry[] = row.seriesBands.map((band) => {
      const startBox = boxes[band.startBoxIndex];
      const endBox = boxes[band.endBoxIndex];
      return {
        seriesId: band.seriesId,
        x: startBox.x + bandInset,
        y: bandTop,
        w: endBox.x + endBox.w - startBox.x - bandInset * 2,
        h: bandH - rowGap * 0.3,
      };
    });

    return { boxes, bands, top: rowTop, height: rowHeight };
  });

  return { header, footer, body, rows };
}
