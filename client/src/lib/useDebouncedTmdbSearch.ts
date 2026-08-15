import { useEffect, useState } from "react";
import { api, type TmdbSearchResult } from "./api";

export function useDebouncedTmdbSearch(query: string, delayMs = 300) {
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const { results: r } = await api.searchMovies(trimmed, controller.signal);
        setResults(r);
      } catch (err) {
        if ((err as { name?: string }).name !== "AbortError") setResults([]);
      } finally {
        setLoading(false);
      }
    }, delayMs);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, delayMs]);

  return { results, loading };
}
