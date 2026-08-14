import { measureTextWidth } from "./textMeasure";

const REF_SIZE = 100;
const MIN_FONT_SIZE = 9;
const MAX_FONT_SIZE = 40;
const WIDTH_FILL_RATIO = 0.88; // leaves a small margin on each side

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export interface AutoFitTitleText {
  fontSize: number;
  manualLineBreaks: number[];
}

/**
 * Computes a one-time default font size (and, for longer titles, a forced two-line break) so the
 * title fills most of its box width. Titles with 2+ words and 12+ characters are split at the
 * word boundary that best balances the two resulting lines, then sized so the longer line fills
 * the target width — this maximizes the font size for a clean two-line layout.
 */
export function computeAutoFitTitleText(name: string, boxWidth: number, fontFamily: string, fontStyle = "bold"): AutoFitTitleText {
  const words = name.split(/\s+/).filter(Boolean);
  const targetWidth = boxWidth * WIDTH_FILL_RATIO;

  if (words.length < 2 || name.length < 12) {
    const measured = measureTextWidth(name.toUpperCase(), REF_SIZE, fontFamily, fontStyle) || 1;
    const fontSize = clamp((targetWidth / measured) * REF_SIZE, MIN_FONT_SIZE, MAX_FONT_SIZE);
    return { fontSize, manualLineBreaks: [] };
  }

  function lineWidth(ws: string[]): number {
    return measureTextWidth(ws.join(" ").toUpperCase(), REF_SIZE, fontFamily, fontStyle);
  }

  let bestSplit = 1;
  let bestMax = Infinity;
  for (let i = 1; i < words.length; i++) {
    const w1 = lineWidth(words.slice(0, i));
    const w2 = lineWidth(words.slice(i));
    const m = Math.max(w1, w2);
    if (m < bestMax) {
      bestMax = m;
      bestSplit = i;
    }
  }

  const fontSize = clamp((targetWidth / (bestMax || 1)) * REF_SIZE, MIN_FONT_SIZE, MAX_FONT_SIZE);
  return { fontSize, manualLineBreaks: [bestSplit - 1] };
}
