import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DefaultSettingsModal } from "../components/editor/DefaultSettingsModal";
import { TopBar } from "../components/editor/TopBar";
import { SeriesEditor } from "../components/SeriesEditor";
import { TitleRow } from "../components/TitleRow";
import { Icon } from "../components/Icon";
import { api } from "../lib/api";
import { duplicateCalendarById, renameCalendarById } from "../lib/calendarActions";
import { DEFAULT_DATE_STYLE, DEFAULT_RATING_STYLE, DEFAULT_RUNTIME_STYLE } from "../lib/calendarGeometry";
import { nextId, type DraftSeries, type DraftTitle } from "../lib/draftTypes";
import { MAX_TITLES, MIN_TITLES, validateTitleCount } from "../lib/layoutEngine";
import { computeSmartStartDefaults } from "../lib/smartDefaults";
import { getDefaultTheme } from "../lib/userDefaults";
import type { Calendar, CalendarSummary, Season } from "../types/calendar";
import "./StartPage.css";

const SEASONS: Season[] = ["Spring", "Summer", "Fall", "Winter", "Custom"];

// Testing-only flavor text for auto-generated series — there's no real thematic grouping behind
// these, just a plausible-looking label over a random contiguous run of titles.
const RANDOM_SERIES_NAMES = [
  "Midnight Madness",
  "Director's Cut",
  "Cult Classics",
  "Hidden Gems",
  "Genre Bender",
  "Popcorn Classics",
  "Late Night Double Feature",
  "Weekend Marathon",
  "Deep Cuts",
  "Something Wild",
];

function shuffled<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function makeDefaultTitles(dates: string[]): DraftTitle[] {
  const rows = dates.length > 0 ? dates : Array.from({ length: 12 }, () => "");
  return rows.map((date) => ({ id: nextId("title"), date, name: "" }));
}

export function StartPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [draft, setDraft] = useState<Calendar | null>(null);
  const [summaries, setSummaries] = useState<CalendarSummary[]>([]);
  const [season, setSeason] = useState<Season>("Summer");
  const [customSeasonLabel, setCustomSeasonLabel] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [titles, setTitles] = useState<DraftTitle[]>([]);
  const [series, setSeries] = useState<DraftSeries[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [defaultSettingsOpen, setDefaultSettingsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    api.listCalendars().then((r) => setSummaries(r.calendars)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setDraft(null);
    (async () => {
      try {
        const fetched = await api.getCalendar(id);
        if (cancelled) return;
        setDraft(fetched);
        const smart = computeSmartStartDefaults(new Date());
        setSeason(fetched.season);
        setCustomSeasonLabel(fetched.customSeasonLabel ?? "");
        setYear(fetched.year);
        setTitles(makeDefaultTitles(smart.dates));
        setSeries([]);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Couldn't load this new calendar. Check that the server is running.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const filledCount = titles.filter((t) => t.name.trim() && t.date).length;
  const hasAnyTitleText = titles.some((t) => t.name.trim().length > 0);

  function updateTitle(titleId: string, next: DraftTitle) {
    setTitles((prev) => prev.map((t) => (t.id === titleId ? next : t)));
  }

  function deleteTitle(titleId: string) {
    setTitles((prev) => prev.filter((t) => t.id !== titleId));
    setSeries((prev) => prev.map((s) => ({ ...s, titleIds: s.titleIds.filter((tid) => tid !== titleId) })));
  }

  function addTitle() {
    if (titles.length >= MAX_TITLES) return;
    setTitles((prev) => [...prev, { id: nextId("title"), date: "", name: "" }]);
  }

  // Testing shortcut: fills every title slot with a random well-known movie from TMDB (keeping
  // each slot's existing date) and groups 1-2 random contiguous runs into series with placeholder
  // names, so a whole calendar can be built without typing anything.
  async function handleAutoGenerate() {
    setMenuOpen(false);
    setGenerating(true);
    setGenError(null);
    try {
      const { results } = await api.randomMovies(titles.length);
      const movies = shuffled(results);
      const nextTitles = titles.map((t, i) => {
        const m = movies[i];
        if (!m) return t;
        return { ...t, name: m.title, tmdbId: m.id, posterUrl: m.posterUrl, seriesId: undefined };
      });

      const filledIdx = nextTitles.map((t, i) => (t.name.trim() ? i : -1)).filter((i) => i >= 0);
      const seriesNames = shuffled(RANDOM_SERIES_NAMES);
      const seriesCount = filledIdx.length >= 8 && Math.random() < 0.5 ? 2 : 1;
      const usedIdx = new Set<number>();
      const nextSeries: DraftSeries[] = [];
      for (let s = 0; s < seriesCount; s++) {
        const span = 2 + Math.floor(Math.random() * 2); // 2-3 consecutive titles
        const available = filledIdx.filter((i) => !usedIdx.has(i));
        if (available.length < span) break;
        const startPos = Math.floor(Math.random() * (available.length - span + 1));
        const chosen = available.slice(startPos, startPos + span);
        chosen.forEach((i) => usedIdx.add(i));
        const seriesId = nextId("series");
        nextSeries.push({ id: seriesId, name: seriesNames[s] ?? "Series", titleIds: chosen.map((i) => nextTitles[i].id) });
        chosen.forEach((i) => {
          nextTitles[i] = { ...nextTitles[i], seriesId };
        });
      }

      setTitles(nextTitles);
      setSeries(nextSeries);
    } catch (err) {
      console.error(err);
      setGenError("Auto-generate failed. Check that the server is running.");
    } finally {
      setGenerating(false);
    }
  }

  // Discards this blank/in-progress draft: quietly if nothing's been typed in yet, with a
  // confirmation if the user has already started entering titles.
  async function abandonDraft(promptIfDirty: boolean): Promise<boolean> {
    if (!id) return true;
    if (promptIfDirty && hasAnyTitleText) {
      if (!window.confirm("You haven't finished this new calendar yet. Discard it and continue?")) return false;
    }
    try {
      await api.deleteCalendar(id);
    } catch (err) {
      console.error("Failed to delete draft calendar", err);
    }
    return true;
  }

  async function handleSwitch(targetId: string) {
    if (targetId === id) return;
    if (!(await abandonDraft(true))) return;
    navigate(`/edit/${targetId}`);
  }

  async function handleNew() {
    if (!(await abandonDraft(true))) return;
    navigate("/");
  }

  async function handleDelete(targetId: string) {
    if (!window.confirm("Delete this calendar? This can't be undone.")) return;
    try {
      await api.deleteCalendar(targetId);
      setSummaries((prev) => prev.filter((s) => s.id !== targetId));
    } catch (err) {
      console.error(err);
      setError("Delete failed. Check that the server is running.");
      return;
    }
    if (targetId === id) navigate("/");
  }

  async function handleDuplicateById(targetId: string) {
    try {
      const newId = await duplicateCalendarById(targetId);
      const r = await api.listCalendars();
      setSummaries(r.calendars);
      navigate(`/edit/${newId}`);
    } catch (err) {
      console.error(err);
      setError("Duplicate failed. Check that the server is running.");
    }
  }

  async function handleRename(targetId: string, name: string) {
    try {
      await renameCalendarById(targetId, name);
      const r = await api.listCalendars();
      setSummaries(r.calendars);
    } catch (err) {
      console.error(err);
      setError("Rename failed. Check that the server is running.");
    }
  }

  async function handleCreate() {
    if (!draft || !id) return;
    setError(null);
    const usable = titles.filter((t) => t.name.trim() && t.date);
    const check = validateTitleCount(usable.length);
    if (check) {
      setError(
        check.reason === "too-few"
          ? `Add at least ${MIN_TITLES} titles with both a date and a name (currently ${check.count}).`
          : `A calendar can have at most ${MAX_TITLES} titles (currently ${check.count}). Remove ${check.count - MAX_TITLES}.`
      );
      return;
    }
    if (season === "Custom" && !customSeasonLabel.trim()) {
      setError("Enter a label for the custom season.");
      return;
    }

    setCreating(true);
    try {
      const defaultTheme = getDefaultTheme(season);
      const seriesIds = new Set(series.filter((s) => s.name.trim()).map((s) => s.id));

      const fullTitles = usable.map((t) => ({
        id: t.id,
        tmdbId: t.tmdbId,
        name: t.name.trim(),
        date: t.date,
        mpaRating: "NR" as const,
        ratingVisible: false,
        imageVisible: true,
        titleVisible: true,
        dateVisible: true,
        runtimeVisible: true,
        // fontSize 0 is the "not yet auto-fit" sentinel — the editor computes a real size once it
        // knows this title's actual box width.
        titleTextStyle: { fontSize: 0, kerning: 0, lineSpacing: 1.08, justify: "left" as const, dropShadow: true, offsetX: 0, offsetY: 0 },
        runtimeStyle: { ...DEFAULT_RUNTIME_STYLE },
        ratingStyle: { ...DEFAULT_RATING_STYLE },
        dateStyle: { ...DEFAULT_DATE_STYLE },
        dateOffsetX: 0,
        dateOffsetY: 0,
        badges: [],
        customElements: [],
        seriesId: t.seriesId && seriesIds.has(t.seriesId) ? t.seriesId : undefined,
      }));

      const fullSeries = series
        .filter((s) => s.name.trim())
        .map((s) => ({
          id: s.id,
          name: s.name.trim(),
          titleIds: s.titleIds.filter((tid) => usable.some((t) => t.id === tid)),
          bandStyle: {
            background: { type: "color" as const, value: defaultTheme.cardText.seriesTag.tagColor },
            fontFamily: defaultTheme.cardText.seriesTag.fontFamily,
            fontSize: defaultTheme.cardText.seriesTag.fontSize,
            textColor: defaultTheme.cardText.seriesTag.textColor,
            opacity: defaultTheme.cardText.seriesTag.opacity,
            kerning: defaultTheme.cardText.seriesTag.kerning,
            lineSpacing: 1.08,
            justify: "center" as const,
            offsetX: 0,
            offsetY: 0,
          },
        }));

      const finalCalendar: Calendar = {
        ...draft,
        season,
        customSeasonLabel: season === "Custom" ? customSeasonLabel.trim() : undefined,
        year,
        titles: fullTitles,
        series: fullSeries,
        theme: defaultTheme,
      };
      await api.saveCalendar(finalCalendar);
      navigate(`/select-images/${id}`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong creating the calendar. Check that the server is running.");
    } finally {
      setCreating(false);
    }
  }

  if (error) return <div className="start-page-error">{error}</div>;
  if (!draft || !id) return <div className="start-page-loading">Loading…</div>;

  return (
    <div className="start-page-shell">
      <TopBar
        currentId={id}
        currentLabel="New calendar"
        summaries={summaries}
        onSwitch={handleSwitch}
        onNew={handleNew}
        onDelete={handleDelete}
        onDuplicate={handleDuplicateById}
        onRename={handleRename}
        onOpenDefaultSettings={() => setDefaultSettingsOpen(true)}
      />
      {defaultSettingsOpen && (
        <DefaultSettingsModal calendar={draft} onClose={() => setDefaultSettingsOpen(false)} onApplyToCalendar={(theme) => setDraft({ ...draft, theme })} />
      )}
      <div className="start-page">
        <div className="start-head">
          <div>
            <h2>New Calendar</h2>
            <div className="sub">Onyx Downtown at the Nevada Theatre</div>
          </div>
          <div className="season-row">
            <select className="season-select" value={season} onChange={(e) => setSeason(e.target.value as Season)}>
              {SEASONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {season === "Custom" && (
              <input
                className="custom-season-input"
                type="text"
                placeholder="Season label"
                value={customSeasonLabel}
                onChange={(e) => setCustomSeasonLabel(e.target.value)}
              />
            )}
            <input className="year-field" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          </div>
        </div>

        <div className="title-list">
          {titles.map((title, i) => (
            <TitleRow key={title.id} title={title} index={i} onChange={(next) => updateTitle(title.id, next)} onDelete={() => deleteTitle(title.id)} />
          ))}
        </div>
        <div className="title-list-actions">
          <button type="button" className="add-row-btn" onClick={addTitle} disabled={titles.length >= MAX_TITLES}>
            <Icon name="add_movie_card" size={14} /> Add title
          </button>
          <div className="more-menu-wrap">
            <button type="button" className="more-menu-btn" onClick={() => setMenuOpen((o) => !o)} aria-label="More options" title="More options">
              <Icon name="more_options" />
            </button>
            {menuOpen && (
              <>
                <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />
                <div className="more-menu">
                  <button type="button" className="more-menu-item" onClick={handleAutoGenerate} disabled={generating}>
                    {generating ? "Generating…" : "Auto-generate"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        {genError && (
          <div className="form-error">
            <Icon name="warning" size={13} /> {genError}
          </div>
        )}
        <div className="count-note">
          {filledCount} of {MIN_TITLES}–{MAX_TITLES} titles filled in
        </div>

        <SeriesEditor titles={titles} series={series} onChange={setSeries} onTitlesChange={setTitles} />

        {error && (
          <div className="form-error">
            <Icon name="warning" size={13} /> {error}
          </div>
        )}

        <div className="create-row">
          <button type="button" className="btn-primary" onClick={handleCreate} disabled={creating}>
            {creating ? "Creating…" : "Create Calendar →"}
          </button>
        </div>
      </div>
    </div>
  );
}
