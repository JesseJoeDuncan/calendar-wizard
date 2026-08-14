const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p";

function apiKey(): string {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY is not set");
  return key;
}

export interface TmdbSearchResult {
  id: number;
  title: string;
  releaseYear: string | null;
  posterUrl: string | null;
}

export async function searchMovies(query: string): Promise<TmdbSearchResult[]> {
  const url = `${TMDB_BASE}/search/movie?api_key=${apiKey()}&query=${encodeURIComponent(query)}&include_adult=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB search failed: ${res.status}`);
  const data = (await res.json()) as { results: any[] };
  return data.results.slice(0, 8).map((r) => ({
    id: r.id,
    title: r.title,
    releaseYear: r.release_date ? r.release_date.slice(0, 4) : null,
    posterUrl: r.poster_path ? `${IMG_BASE}/w92${r.poster_path}` : null,
  }));
}

export interface TmdbImageCandidate {
  tmdbPath: string;
  thumbUrl: string;
  fullUrl: string;
  kind: "backdrop" | "poster";
  voteScore: number;
}

export interface TmdbMovieDetail {
  id: number;
  title: string;
  runtimeMinutes: number | null;
  mpaRating: string;
  backdrops: TmdbImageCandidate[];
  posters: TmdbImageCandidate[];
}

const US_RATING_ORDER = ["NR", "G", "PG", "PG-13", "R", "NC-17"];

// Ranked by TMDB's own community score (vote_average weighted by how many people voted)
// rather than whatever order TMDB happens to return.
function score(img: any): number {
  return (img.vote_average ?? 0) * Math.log2((img.vote_count ?? 0) + 2);
}

function rankedCandidates(images: any[], kind: "backdrop" | "poster", thumbSize: string, fullSize: string, cap: number): TmdbImageCandidate[] {
  return [...images]
    .sort((a, b) => score(b) - score(a))
    .slice(0, cap)
    .map((img) => ({
      tmdbPath: img.file_path as string,
      thumbUrl: `${IMG_BASE}/${thumbSize}${img.file_path}`,
      fullUrl: `${IMG_BASE}/${fullSize}${img.file_path}`,
      kind,
      voteScore: score(img),
    }));
}

export async function getMovieDetail(id: number): Promise<TmdbMovieDetail> {
  const [detailRes, releaseRes, imagesRes] = await Promise.all([
    fetch(`${TMDB_BASE}/movie/${id}?api_key=${apiKey()}`),
    fetch(`${TMDB_BASE}/movie/${id}/release_dates?api_key=${apiKey()}`),
    fetch(`${TMDB_BASE}/movie/${id}/images?api_key=${apiKey()}`),
  ]);
  if (!detailRes.ok) throw new Error(`TMDB movie detail failed: ${detailRes.status}`);
  const detail = (await detailRes.json()) as any;

  let mpaRating = "NR";
  if (releaseRes.ok) {
    const release = (await releaseRes.json()) as { results: any[] };
    const us = release.results.find((r) => r.iso_3166_1 === "US");
    const cert = us?.release_dates?.find((d: any) => d.certification)?.certification;
    if (cert && US_RATING_ORDER.includes(cert)) mpaRating = cert;
  }

  let backdrops: TmdbImageCandidate[] = [];
  let posters: TmdbImageCandidate[] = [];
  if (imagesRes.ok) {
    const imgData = (await imagesRes.json()) as { backdrops: any[]; posters: any[] };
    // Metadata only (URLs + scores) — cheap to fetch broadly; the browser only downloads a
    // thumbnail's actual bytes once its tile scrolls into view / "load more" reveals it.
    backdrops = rankedCandidates(imgData.backdrops, "backdrop", "w300", "w1280", 24);
    posters = rankedCandidates(imgData.posters, "poster", "w185", "w780", 12);
  }

  return {
    id: detail.id,
    title: detail.title,
    runtimeMinutes: detail.runtime || null,
    mpaRating,
    backdrops,
    posters,
  };
}
