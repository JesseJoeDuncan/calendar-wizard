import type { Series, Title } from "../types/calendar";

export const MIN_TITLES = 9;
export const MAX_TITLES = 15;
export const MIN_ROW_SIZE = 3;
export const MAX_ROW_SIZE = 5;
export const ROW_COUNT = 3;

export type CornerWeight = "least" | "some" | "most";

export interface BoxLayout {
  titleId: string;
  rounding: { tl: CornerWeight; tr: CornerWeight; bl: CornerWeight; br: CornerWeight };
  seriesId?: string;
}

export interface SeriesBandLayout {
  seriesId: string;
  /** index of first and last box (inclusive) within the row this band sits under */
  startBoxIndex: number;
  endBoxIndex: number;
}

export interface RowLayout {
  boxes: BoxLayout[];
  seriesBands: SeriesBandLayout[];
}

export interface CalendarLayout {
  rows: RowLayout[];
}

export interface LayoutValidationError {
  reason: "too-few" | "too-many";
  count: number;
}

export function validateTitleCount(count: number): LayoutValidationError | null {
  if (count < MIN_TITLES) return { reason: "too-few", count };
  if (count > MAX_TITLES) return { reason: "too-many", count };
  return null;
}

/** All (r1,r2,r3) permutations, each in [MIN_ROW_SIZE,MAX_ROW_SIZE], summing to `total`. */
function rowSizeCandidates(total: number): number[][] {
  const sizes = [3, 4, 5];
  const out: number[][] = [];
  for (const r1 of sizes) {
    for (const r2 of sizes) {
      const r3 = total - r1 - r2;
      if (r3 >= MIN_ROW_SIZE && r3 <= MAX_ROW_SIZE) out.push([r1, r2, r3]);
    }
  }
  return out;
}

/** Counts how many series get split across a row-boundary cut for a given row-size distribution. */
function splitPenalty(sortedTitles: Title[], rowSizes: number[]): number {
  const cutPoints = new Set<number>();
  let acc = 0;
  for (let i = 0; i < rowSizes.length - 1; i++) {
    acc += rowSizes[i];
    cutPoints.add(acc);
  }
  let penalty = 0;
  const seriesSpans = new Map<string, { min: number; max: number }>();
  sortedTitles.forEach((t, idx) => {
    if (!t.seriesId) return;
    const span = seriesSpans.get(t.seriesId);
    if (!span) seriesSpans.set(t.seriesId, { min: idx, max: idx });
    else {
      span.min = Math.min(span.min, idx);
      span.max = Math.max(span.max, idx);
    }
  });
  for (const { min, max } of seriesSpans.values()) {
    for (const cut of cutPoints) {
      if (cut > min && cut <= max) penalty++;
    }
  }
  return penalty;
}

function chooseRowSizes(sortedTitles: Title[]): number[] {
  const total = sortedTitles.length;
  const candidates = rowSizeCandidates(total);
  if (candidates.length === 0) {
    // Fallback: shouldn't happen within MIN_TITLES..MAX_TITLES, but degrade gracefully.
    const base = Math.floor(total / ROW_COUNT);
    const rem = total - base * ROW_COUNT;
    return [base + (rem > 0 ? 1 : 0), base + (rem > 1 ? 1 : 0), base];
  }
  let best = candidates[0];
  let bestScore = Infinity;
  for (const candidate of candidates) {
    const penalty = splitPenalty(sortedTitles, candidate);
    const variance = Math.max(...candidate) - Math.min(...candidate);
    const score = penalty * 100 + variance;
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}

function cornerRoundingForRow(rowTitles: Title[]): BoxLayout[] {
  return rowTitles.map((title, i) => {
    const isSeries = Boolean(title.seriesId);
    const leftSame = i > 0 && isSeries && rowTitles[i - 1].seriesId === title.seriesId;
    const rightSame = i < rowTitles.length - 1 && isSeries && rowTitles[i + 1].seriesId === title.seriesId;
    return {
      titleId: title.id,
      seriesId: title.seriesId,
      rounding: {
        tl: leftSame ? "some" : "most",
        tr: rightSame ? "some" : "most",
        bl: isSeries ? "least" : "most",
        br: isSeries ? "least" : "most",
      },
    };
  });
}

function seriesBandsForRow(rowTitles: Title[]): SeriesBandLayout[] {
  const bands: SeriesBandLayout[] = [];
  let i = 0;
  while (i < rowTitles.length) {
    const seriesId = rowTitles[i].seriesId;
    if (!seriesId) {
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < rowTitles.length && rowTitles[j + 1].seriesId === seriesId) j++;
    bands.push({ seriesId, startBoxIndex: i, endBoxIndex: j });
    i = j + 1;
  }
  return bands;
}

/**
 * Builds the 3-row calendar grid from a title list and series definitions.
 * Titles are sorted chronologically; row boundaries are chosen to minimize
 * series splits while keeping each row within [3,5] boxes.
 */
export function buildLayout(titles: Title[], _series: Series[]): CalendarLayout {
  const sorted = [...titles].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const rowSizes = chooseRowSizes(sorted);

  const rows: RowLayout[] = [];
  let cursor = 0;
  for (const size of rowSizes) {
    const rowTitles = sorted.slice(cursor, cursor + size);
    cursor += size;
    rows.push({
      boxes: cornerRoundingForRow(rowTitles),
      seriesBands: seriesBandsForRow(rowTitles),
    });
  }
  return { rows };
}
