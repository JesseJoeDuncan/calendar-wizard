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

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// A handful of common non-English original-language codes, so a foreign-film slant is possible
// without ever being the only thing that comes back.
const FOREIGN_LANGUAGES = ["fr", "it", "ja", "ko", "de", "es", "hi", "zh", "sv", "pl", "ru", "pt", "da", "fi", "nl", "tr", "th", "cs", "el", "he"];
const SORT_MODES = ["popularity.desc", "vote_average.desc", "primary_release_date.desc", "primary_release_date.asc"];

async function discoverPage(params: URLSearchParams): Promise<any[]> {
  const res = await fetch(`${TMDB_BASE}/discover/movie?${params.toString()}`);
  if (!res.ok) throw new Error(`TMDB discover failed: ${res.status}`);
  const data = (await res.json()) as { results: any[] };
  return data.results;
}

// Builds a randomized query each call — varying sort order, vote-count floor, original language,
// and release-date ceiling — so results range across eras, countries, and popularity tiers rather
// than always landing on the same handful of English-language blockbusters. Used only by the
// "Auto-generate" testing shortcut on the new-calendar page, not the real search flow.
export async function getRandomMovies(count: number): Promise<TmdbSearchResult[]> {
  const params = new URLSearchParams({
    api_key: apiKey(),
    include_adult: "false",
    sort_by: SORT_MODES[Math.floor(Math.random() * SORT_MODES.length)],
    "vote_count.gte": String(15 + Math.floor(Math.random() * 40)), // 15-55: low enough to admit obscure/arthouse titles
  });
  if (Math.random() < 0.35) {
    params.set("with_original_language", FOREIGN_LANGUAGES[Math.floor(Math.random() * FOREIGN_LANGUAGES.length)]);
  }
  if (Math.random() < 0.3) {
    const cutoffYear = 1930 + Math.floor(Math.random() * 70); // films released on/before some year in 1930-1999
    params.set("primary_release_date.lte", `${cutoffYear}-12-31`);
  }
  params.set("page", String(1 + Math.floor(Math.random() * 100)));

  let results = await discoverPage(params);
  // A narrow combination (rare language + old cutoff, say) can run out of pages — retry page 1 of
  // the same filters, then fall back to a wide-open query, so this never comes back empty.
  if (results.length === 0 && params.get("page") !== "1") {
    params.set("page", "1");
    results = await discoverPage(params);
  }
  if (results.length === 0) {
    results = await discoverPage(new URLSearchParams({ api_key: apiKey(), include_adult: "false", sort_by: "popularity.desc", page: "1" }));
  }

  // Prefer movies with a poster (nicer default thumbnails) without hard-excluding the rest.
  const withPoster = results.filter((r) => r.poster_path);
  const withoutPoster = results.filter((r) => !r.poster_path);
  const prioritized = [...shuffle(withPoster), ...shuffle(withoutPoster)];

  return prioritized.slice(0, count).map((r) => ({
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
  aspectRatio: number;
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
      aspectRatio: typeof img.aspect_ratio === "number" ? img.aspect_ratio : kind === "backdrop" ? 16 / 9 : 2 / 3,
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
