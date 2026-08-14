import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SeriesEditor } from "../components/SeriesEditor";
import { TitleRow } from "../components/TitleRow";
import { api } from "../lib/api";
import { nextId, type DraftSeries, type DraftTitle } from "../lib/draftTypes";
import { MAX_TITLES, MIN_TITLES, validateTitleCount } from "../lib/layoutEngine";
import type { Calendar, Season } from "../types/calendar";
import "./StartPage.css";

const SEASONS: Season[] = ["Spring", "Summer", "Fall", "Winter", "Custom"];

function makeDefaultTitles(): DraftTitle[] {
  return Array.from({ length: 12 }, () => ({ id: nextId("title"), date: "", name: "" }));
}

export function StartPage() {
  const navigate = useNavigate();
  const [season, setSeason] = useState<Season>("Summer");
  const [customSeasonLabel, setCustomSeasonLabel] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [titles, setTitles] = useState<DraftTitle[]>(makeDefaultTitles());
  const [series, setSeries] = useState<DraftSeries[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filledCount = titles.filter((t) => t.name.trim() && t.date).length;

  function updateTitle(id: string, next: DraftTitle) {
    setTitles((prev) => prev.map((t) => (t.id === id ? next : t)));
  }

  function deleteTitle(id: string) {
    setTitles((prev) => prev.filter((t) => t.id !== id));
    setSeries((prev) => prev.map((s) => ({ ...s, titleIds: s.titleIds.filter((tid) => tid !== id) })));
  }

  function addTitle() {
    if (titles.length >= MAX_TITLES) return;
    setTitles((prev) => [...prev, { id: nextId("title"), date: "", name: "" }]);
  }

  async function handleCreate() {
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
      const created = await api.createCalendar(season, year, season === "Custom" ? customSeasonLabel.trim() : undefined);
      const seriesIds = new Set(series.filter((s) => s.name.trim()).map((s) => s.id));

      const fullTitles = usable.map((t) => ({
        id: t.id,
        tmdbId: t.tmdbId,
        name: t.name.trim(),
        date: t.date,
        mpaRating: "NR" as const,
        ratingVisible: false,
        titleTextStyle: { fontSize: 15, kerning: 0, justify: "left" as const, dropShadow: true, offsetX: 0, offsetY: 0 },
        runtimeOpacity: 0.85,
        ratingOpacity: 0.85,
        dateOffsetX: 0,
        dateOffsetY: 0,
        badges: [],
        seriesId: t.seriesId && seriesIds.has(t.seriesId) ? t.seriesId : undefined,
      }));

      const fullSeries = series
        .filter((s) => s.name.trim())
        .map((s) => ({
          id: s.id,
          name: s.name.trim(),
          titleIds: s.titleIds.filter((id) => usable.some((t) => t.id === id)),
          bandStyle: {
            background: { type: "color" as const, value: "#2f6f7a" },
            fontFamily: "Futura Wizard",
            fontSize: 13,
            textColor: "#fce9c7",
            kerning: 1.5,
            justify: "center" as const,
            offsetX: 0,
            offsetY: 0,
          },
        }));

      const finalCalendar: Calendar = { ...created, titles: fullTitles, series: fullSeries };
      await api.saveCalendar(finalCalendar);
      navigate(`/select-images/${created.id}`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong creating the calendar. Check that the server is running.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="start-page">
      <div className="start-head">
        <div>
          <h2>New Calendar</h2>
          <div className="sub">Onyx Downtown at the Nevada Theatre</div>
        </div>
        <div className="season-row">
          {SEASONS.map((s) => (
            <button key={s} type="button" className={`pill ${season === s ? "on" : ""}`} onClick={() => setSeason(s)}>
              {s}
            </button>
          ))}
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
      <button type="button" className="add-row-btn" onClick={addTitle} disabled={titles.length >= MAX_TITLES}>
        + Add title
      </button>
      <div className="count-note">
        {filledCount} of {MIN_TITLES}–{MAX_TITLES} titles filled in
      </div>

      <SeriesEditor titles={titles} series={series} onChange={setSeries} onTitlesChange={setTitles} />

      {error && <div className="form-error">{error}</div>}

      <div className="create-row">
        <button type="button" className="btn-primary" onClick={handleCreate} disabled={creating}>
          {creating ? "Creating…" : "Create Calendar →"}
        </button>
      </div>
    </div>
  );
}
