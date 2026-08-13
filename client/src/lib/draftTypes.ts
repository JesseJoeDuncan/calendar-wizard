export interface DraftTitle {
  id: string;
  date: string;
  name: string;
  tmdbId?: number;
  posterUrl?: string | null;
  seriesId?: string;
}

export interface DraftSeries {
  id: string;
  name: string;
  titleIds: string[];
}

let counter = 0;
export function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}
