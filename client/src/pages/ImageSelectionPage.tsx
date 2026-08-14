import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { DEFAULT_SPACING, computeGeometry } from "../lib/calendarGeometry";
import { buildLayout } from "../lib/layoutEngine";
import type { Calendar, ImageCandidate, MpaRating, Title } from "../types/calendar";
import "./ImageSelectionPage.css";

const INITIAL_BACKDROPS = 6;
const INITIAL_POSTERS = 4;
const LOAD_MORE_BACKDROPS = 6;
const LOAD_MORE_POSTERS = 4;

interface TitleImageState {
  loading: boolean;
  error: string | null;
  runtimeMinutes: number | null;
  mpaRating: MpaRating;
  backdrops: ImageCandidate[];
  posters: ImageCandidate[];
  backdropReveal: number;
  posterReveal: number;
  selectedPath: string | null;
  uploadedUrl: string | null;
  uploading: boolean;
}

function emptyState(): TitleImageState {
  return {
    loading: false,
    error: null,
    runtimeMinutes: null,
    mpaRating: "NR",
    backdrops: [],
    posters: [],
    backdropReveal: INITIAL_BACKDROPS,
    posterReveal: INITIAL_POSTERS,
    selectedPath: null,
    uploadedUrl: null,
    uploading: false,
  };
}

export function ImageSelectionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [states, setStates] = useState<Record<string, TitleImageState>>({});
  const [advancing, setAdvancing] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const fetched = await api.getCalendar(id);
        if (cancelled) return;
        const loaded: Calendar = { ...fetched, theme: { ...fetched.theme, spacing: { ...DEFAULT_SPACING, ...fetched.theme.spacing } } };
        setCalendar(loaded);

        const initial: Record<string, TitleImageState> = {};
        for (const t of loaded.titles) initial[t.id] = { ...emptyState(), selectedPath: t.image?.tmdbPath ?? null, uploadedUrl: t.image?.source === "upload" ? t.image.url : null };
        setStates(initial);

        // Fetch runtime/rating/candidates for every TMDB-matched title, a few at a time.
        const queue = loaded.titles.filter((t) => t.tmdbId);
        const concurrency = 3;
        async function worker() {
          while (queue.length > 0) {
            const t = queue.shift();
            if (!t || !t.tmdbId) continue;
            setStates((prev) => ({ ...prev, [t.id]: { ...prev[t.id], loading: true } }));
            try {
              const detail = await api.getMovieDetail(t.tmdbId);
              if (cancelled) return;
              setStates((prev) => ({
                ...prev,
                [t.id]: {
                  ...prev[t.id],
                  loading: false,
                  runtimeMinutes: detail.runtimeMinutes,
                  mpaRating: detail.mpaRating,
                  backdrops: detail.backdrops,
                  posters: detail.posters,
                },
              }));
            } catch (err) {
              console.error(`Failed to fetch images for "${t.name}"`, err);
              if (!cancelled) setStates((prev) => ({ ...prev, [t.id]: { ...prev[t.id], loading: false, error: "Couldn't load images for this title." } }));
            }
          }
        }
        await Promise.all(Array.from({ length: concurrency }, worker));
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Couldn't load this calendar.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const layout = useMemo(() => (calendar ? buildLayout(calendar.titles, calendar.series) : null), [calendar]);
  const geometry = useMemo(() => (layout && calendar ? computeGeometry(layout, calendar.theme.spacing) : null), [layout, calendar]);

  const aspectByTitleId = useMemo(() => {
    const map: Record<string, number> = {};
    if (!geometry) return map;
    for (const row of geometry.rows) for (const box of row.boxes) map[box.titleId] = box.w / box.h;
    return map;
  }, [geometry]);

  const sortedTitles = useMemo(() => (calendar ? [...calendar.titles].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)) : []), [calendar]);

  function selectCandidate(titleId: string, candidate: ImageCandidate) {
    setStates((prev) => ({ ...prev, [titleId]: { ...prev[titleId], selectedPath: candidate.tmdbPath, uploadedUrl: null } }));
  }

  async function handleUpload(titleId: string, file: File) {
    setStates((prev) => ({ ...prev, [titleId]: { ...prev[titleId], uploading: true } }));
    try {
      const { url } = await api.uploadImage(file);
      setStates((prev) => ({ ...prev, [titleId]: { ...prev[titleId], uploading: false, uploadedUrl: url, selectedPath: null } }));
    } catch (err) {
      console.error(err);
      setStates((prev) => ({ ...prev, [titleId]: { ...prev[titleId], uploading: false, error: "Upload failed." } }));
    }
  }

  function loadMore(titleId: string) {
    setStates((prev) => {
      const s = prev[titleId];
      return {
        ...prev,
        [titleId]: {
          ...s,
          backdropReveal: Math.min(s.backdrops.length, s.backdropReveal + LOAD_MORE_BACKDROPS),
          posterReveal: Math.min(s.posters.length, s.posterReveal + LOAD_MORE_POSTERS),
        },
      };
    });
  }

  const allSelected = sortedTitles.length > 0 && sortedTitles.every((t) => states[t.id]?.selectedPath || states[t.id]?.uploadedUrl);
  const selectedCount = sortedTitles.filter((t) => states[t.id]?.selectedPath || states[t.id]?.uploadedUrl).length;

  async function handleContinue() {
    if (!calendar || !allSelected) return;
    setAdvancing(true);
    try {
      const titles: Title[] = calendar.titles.map((t) => {
        const s = states[t.id];
        if (!s) return t;
        const candidates = [...s.backdrops, ...s.posters];
        let image: Title["image"] | undefined = t.image;
        if (s.uploadedUrl) {
          image = { source: "upload", url: s.uploadedUrl, scale: 1, offsetX: 0, offsetY: 0 };
        } else if (s.selectedPath) {
          const match = candidates.find((c) => c.tmdbPath === s.selectedPath);
          if (match) image = { source: "tmdb", tmdbPath: match.tmdbPath, url: match.fullUrl, scale: 1, offsetX: 0, offsetY: 0 };
        }
        return {
          ...t,
          runtimeMinutes: s.runtimeMinutes ?? t.runtimeMinutes,
          mpaRating: t.tmdbId ? s.mpaRating : t.mpaRating,
          ratingVisible: t.tmdbId ? s.mpaRating !== "NR" : t.ratingVisible,
          imageCandidates: candidates.length > 0 ? candidates : t.imageCandidates,
          image,
        };
      });
      const updated: Calendar = { ...calendar, titles };
      await api.saveCalendar(updated);
      navigate(`/edit/${calendar.id}`);
    } catch (err) {
      console.error(err);
      setError("Couldn't save your selections. Check that the server is running.");
    } finally {
      setAdvancing(false);
    }
  }

  if (error) return <div className="isel-error">{error}</div>;
  if (!calendar) return <div className="isel-loading">Loading…</div>;

  const label = calendar.season === "Custom" ? calendar.customSeasonLabel || "Custom" : calendar.season;

  return (
    <div className="isel-page">
      <div className="isel-top">
        <div>
          <h1>Choose an image for each title</h1>
          <p className="isel-sub">
            {label} {calendar.year} · {selectedCount} of {sortedTitles.length} selected
          </p>
        </div>
        <button className="isel-continue" onClick={handleContinue} disabled={!allSelected || advancing}>
          {advancing ? "Building calendar…" : "Continue →"}
        </button>
      </div>

      <div className="isel-list">
        {sortedTitles.map((t) => {
          const s = states[t.id] ?? emptyState();
          const aspect = aspectByTitleId[t.id] ?? 0.75;
          const visibleBackdrops = s.backdrops.slice(0, s.backdropReveal);
          const visiblePosters = s.posters.slice(0, s.posterReveal);
          const visible = [...visibleBackdrops, ...visiblePosters];
          const hasMore = s.backdropReveal < s.backdrops.length || s.posterReveal < s.posters.length;
          const isSelected = (c: ImageCandidate) => s.selectedPath === c.tmdbPath;

          return (
            <div className="isel-row" key={t.id}>
              <div className="isel-row-head">
                <span className="isel-title-name">{t.name || "Untitled"}</span>
                <span className="isel-title-date">{t.date}</span>
                {s.loading && <span className="isel-loading-note">fetching images…</span>}
                {s.error && <span className="isel-error-note">{s.error}</span>}
              </div>
              <div className="isel-strip">
                {visible.map((c) => (
                  <button
                    key={c.tmdbPath}
                    type="button"
                    className={`isel-tile ${isSelected(c) ? "sel" : ""}`}
                    style={{ aspectRatio: `${aspect}` }}
                    onClick={() => selectCandidate(t.id, c)}
                  >
                    <img src={c.thumbUrl} alt="" loading="lazy" />
                  </button>
                ))}

                <button
                  type="button"
                  className={`isel-tile isel-upload ${s.uploadedUrl ? "sel" : ""}`}
                  style={{ aspectRatio: `${aspect}` }}
                  onClick={() => fileInputRefs.current[t.id]?.click()}
                  disabled={s.uploading}
                >
                  {s.uploadedUrl ? <img src={s.uploadedUrl} alt="" /> : <span>{s.uploading ? "Uploading…" : "Upload your own"}</span>}
                </button>
                <input
                  ref={(el) => {
                    fileInputRefs.current[t.id] = el;
                  }}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(t.id, file);
                    e.target.value = "";
                  }}
                />

                {hasMore && (
                  <button type="button" className="isel-tile isel-more" style={{ aspectRatio: `${aspect}` }} onClick={() => loadMore(t.id)}>
                    + Load more
                  </button>
                )}

                {!s.loading && visible.length === 0 && !s.uploadedUrl && (
                  <div className="isel-empty-note">{t.tmdbId ? "No candidate images found — upload your own." : "Custom title — upload an image to use."}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
