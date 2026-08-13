import { api } from "./api";
import type { Calendar, Title } from "../types/calendar";

function needsEnrichment(title: Title): boolean {
  return Boolean(title.tmdbId) && (!title.runtimeMinutes || !title.image);
}

async function enrichOne(title: Title): Promise<Title> {
  if (!title.tmdbId) return title;
  const detail = await api.getMovieDetail(title.tmdbId);
  let candidates = [...detail.images, ...(detail.posterUrl ? [{ url: detail.posterUrl, tmdbPath: "" }] : [])];

  // Ask a vision model to pick the still with the clearest, most cutout-friendly subject
  // before trying any of them against remove.bg. Falls back silently (no API key, network
  // error) to the plain TMDB-popularity order already in `candidates`.
  try {
    const visionCandidates = candidates.slice(0, 6);
    if (visionCandidates.length === 0) throw new Error("no candidates to rank");
    const { bestIndex } = await api.rankImagesForCutout(visionCandidates, title.name);
    if (bestIndex !== null && bestIndex > 0) {
      const [winner] = visionCandidates.splice(bestIndex, 1);
      candidates = [winner, ...candidates.filter((c) => c.url !== winner.url)];
    }
  } catch (err) {
    console.error(`Vision ranking failed for "${title.name}", using default order`, err);
  }

  let image: Title["image"] | undefined = title.image;
  // Try candidates in order (best stills first, poster last) until one has a clear-enough
  // subject for remove.bg to cut out; if all fail, fall back to the first candidate uncut.
  for (let i = 0; i < Math.min(candidates.length, 4); i++) {
    const candidate = candidates[i];
    try {
      const { cutoutUrl } = await api.cutoutFromUrl(candidate.url);
      image = { source: "tmdb", tmdbPath: candidate.tmdbPath, url: candidate.url, cutoutUrl, scale: 1, offsetX: 0, offsetY: 0 };
      break;
    } catch (err) {
      console.error(`Cutout failed for candidate ${i} of "${title.name}"`, err);
      if (i === Math.min(candidates.length, 4) - 1 && candidates[0]) {
        image = { source: "tmdb", tmdbPath: candidates[0].tmdbPath, url: candidates[0].url, scale: 1, offsetX: 0, offsetY: 0 };
      }
    }
  }

  return {
    ...title,
    runtimeMinutes: detail.runtimeMinutes ?? title.runtimeMinutes,
    mpaRating: detail.mpaRating as Title["mpaRating"],
    ratingVisible: detail.mpaRating !== "NR",
    imageCandidates: detail.images,
    image,
  };
}

export interface EnrichProgress {
  done: number;
  total: number;
}

/** Fetches runtime/rating/images and runs subject cutout for any title matched to TMDB that's missing them. */
export async function enrichCalendar(calendar: Calendar, onProgress?: (p: EnrichProgress) => void): Promise<Calendar> {
  const toEnrich = calendar.titles.filter(needsEnrichment);
  if (toEnrich.length === 0) return calendar;

  const results = new Map<string, Title>();
  let done = 0;
  const concurrency = 2;
  const queue = [...toEnrich];

  async function worker() {
    while (queue.length > 0) {
      const title = queue.shift();
      if (!title) break;
      try {
        results.set(title.id, await enrichOne(title));
      } catch (err) {
        console.error(`Failed to enrich "${title.name}"`, err);
        results.set(title.id, title);
      }
      done++;
      onProgress?.({ done, total: toEnrich.length });
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));

  return {
    ...calendar,
    titles: calendar.titles.map((t) => results.get(t.id) ?? t),
  };
}
