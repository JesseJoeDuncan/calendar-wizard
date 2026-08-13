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

export interface TmdbMovieDetail {
  id: number;
  title: string;
  runtimeMinutes: number | null;
  mpaRating: string;
  posterUrl: string | null;
  images: { url: string; tmdbPath: string }[];
}

const US_RATING_ORDER = ["NR", "G", "PG", "PG-13", "R", "NC-17"];

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

  let images: { url: string; tmdbPath: string }[] = [];
  if (imagesRes.ok) {
    const imgData = (await imagesRes.json()) as { backdrops: any[]; posters: any[] };
    // Rank by TMDB's own community score (vote_average weighted by how many people voted)
    // rather than just taking whatever TMDB returns first.
    const score = (img: any) => (img.vote_average ?? 0) * Math.log2((img.vote_count ?? 0) + 2);
    const rankedBackdrops = [...imgData.backdrops].sort((a, b) => score(b) - score(a));
    const backdrops = rankedBackdrops.slice(0, 8).map((b) => ({
      url: `${IMG_BASE}/w780${b.file_path}`,
      tmdbPath: b.file_path as string,
    }));
    const posters = imgData.posters.slice(0, 2).map((p) => ({
      url: `${IMG_BASE}/w500${p.file_path}`,
      tmdbPath: p.file_path as string,
    }));
    images = [...backdrops, ...posters];
  }

  return {
    id: detail.id,
    title: detail.title,
    runtimeMinutes: detail.runtime || null,
    mpaRating,
    posterUrl: detail.poster_path ? `${IMG_BASE}/w342${detail.poster_path}` : null,
    images,
  };
}
