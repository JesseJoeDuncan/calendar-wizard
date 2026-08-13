import { useEffect, useRef, useState } from "react";
import { api, type TmdbSearchResult } from "./api";

export function useDebouncedTmdbSearch(query: string, delayMs = 300) {
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const myId = ++requestIdRef.current;
    const timer = setTimeout(async () => {
      try {
        const { results: r } = await api.searchMovies(trimmed);
        if (requestIdRef.current === myId) setResults(r);
      } catch {
        if (requestIdRef.current === myId) setResults([]);
      } finally {
        if (requestIdRef.current === myId) setLoading(false);
      }
    }, delayMs);
    return () => clearTimeout(timer);
  }, [query, delayMs]);

  return { results, loading };
}
