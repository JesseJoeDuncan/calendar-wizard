import type { Calendar, CalendarSummary, MpaRating, Season } from "../types/calendar";

async function json<T>(resPromise: Promise<Response>): Promise<T> {
  const res = await resPromise;
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export interface TmdbSearchResult {
  id: number;
  title: string;
  releaseYear: string | null;
  posterUrl: string | null;
}

export interface TmdbMovieDetail {
  id: number;
  title: string;
  runtimeMinutes: number | null;
  mpaRating: MpaRating;
  posterUrl: string | null;
  images: { url: string; tmdbPath: string }[];
}

export const api = {
  searchMovies: (query: string) => json<{ results: TmdbSearchResult[] }>(fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}`)),

  getMovieDetail: (id: number) => json<TmdbMovieDetail>(fetch(`/api/tmdb/movie/${id}`)),

  listCalendars: () => json<{ calendars: CalendarSummary[] }>(fetch("/api/calendars")),

  getCalendar: (id: string) => json<Calendar>(fetch(`/api/calendars/${id}`)),

  createCalendar: (season: Season, year: number, customSeasonLabel?: string) =>
    json<Calendar>(
      fetch("/api/calendars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ season, year, customSeasonLabel }),
      })
    ),

  saveCalendar: (calendar: Calendar) =>
    json<Calendar>(
      fetch(`/api/calendars/${calendar.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(calendar),
      })
    ),

  cutoutFromUrl: (url: string) =>
    json<{ cutoutUrl: string }>(
      fetch("/api/cutout/from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
    ),

  cutoutFromUpload: (file: File) => {
    const form = new FormData();
    form.append("image", file);
    return json<{ cutoutUrl: string }>(fetch("/api/cutout/from-upload", { method: "POST", body: form }));
  },

  rankImagesForCutout: (candidates: { url: string }[], titleName: string) =>
    json<{ bestIndex: number | null; reason: string | null }>(
      fetch("/api/vision/rank-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidates, titleName }),
      })
    ),
};
