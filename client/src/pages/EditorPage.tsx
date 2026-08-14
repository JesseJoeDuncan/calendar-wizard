import type Konva from "konva";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarCanvas } from "../components/canvas/CalendarCanvas";
import { ExportStage } from "../components/canvas/ExportStage";
import { DetailsPanel } from "../components/editor/DetailsPanel";
import { SettingsDrawer } from "../components/editor/SettingsDrawer";
import { SeriesMiniCard } from "../components/editor/SeriesMiniCard";
import { TitleCard } from "../components/editor/TitleCard";
import { api } from "../lib/api";
import { DEFAULT_SPACING, computeGeometry } from "../lib/calendarGeometry";
import { exportCalendarPdf } from "../lib/exportPdf";
import { buildLayout, validateTitleCount } from "../lib/layoutEngine";
import type { Calendar, CalendarSummary } from "../types/calendar";
import "./EditorPage.css";

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [summaries, setSummaries] = useState<CalendarSummary[]>([]);
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const exportStageRef = useRef<Konva.Stage>(null);

  useEffect(() => {
    api.listCalendars().then((r) => setSummaries(r.calendars)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setCalendar(null);
    setSelectedTitleId(null);

    (async () => {
      try {
        const fetched = await api.getCalendar(id);
        if (cancelled) return;
        // Older saved calendars may predate newly-added theme/venue fields — backfill defaults.
        const loaded: Calendar = {
          ...fetched,
          theme: { ...fetched.theme, spacing: { ...DEFAULT_SPACING, ...fetched.theme.spacing } },
          venue: { ...fetched.venue, footerLogoUrl: fetched.venue.footerLogoUrl || "/assets/logos/nevada-theatre-logo.png" },
        };
        setCalendar(loaded);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Couldn't load this calendar. Check that the server is running.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const layout = useMemo(() => (calendar ? buildLayout(calendar.titles, calendar.series) : null), [calendar]);
  const geometry = useMemo(() => (layout && calendar ? computeGeometry(layout, calendar.theme.spacing) : null), [layout, calendar]);
  const countError = calendar ? validateTitleCount(calendar.titles.length) : null;

  function updateCalendar(patch: Partial<Calendar>) {
    setCalendar((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function handleTitleSeriesChange(titleId: string, newSeriesId: string | undefined) {
    setCalendar((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        titles: prev.titles.map((t) => (t.id === titleId ? { ...t, seriesId: newSeriesId } : t)),
        series: prev.series.map((s) => ({
          ...s,
          titleIds: newSeriesId === s.id ? [...s.titleIds.filter((id) => id !== titleId), titleId] : s.titleIds.filter((id) => id !== titleId),
        })),
      };
    });
  }

  async function handleSave() {
    if (!calendar) return;
    setSaving(true);
    try {
      await api.saveCalendar(calendar);
      setSummaries((prev) => {
        const others = prev.filter((s) => s.id !== calendar.id);
        return [{ id: calendar.id, season: calendar.season, customSeasonLabel: calendar.customSeasonLabel, year: calendar.year, updatedAt: new Date().toISOString() }, ...others];
      });
    } catch (err) {
      console.error(err);
      setError("Save failed. Check that the server is running.");
    } finally {
      setSaving(false);
    }
  }

  function handleDownload() {
    if (!calendar || !exportStageRef.current) return;
    const label = calendar.season === "Custom" ? calendar.customSeasonLabel || "Custom" : calendar.season;
    exportCalendarPdf(exportStageRef.current, `Onyx-Downtown-${label}-${calendar.year}.pdf`);
  }

  if (error) return <div className="editor-error">{error}</div>;
  if (!calendar || !layout || !geometry) {
    return <div className="editor-loading">Loading calendar…</div>;
  }

  const label = calendar.season === "Custom" ? calendar.customSeasonLabel || "Custom" : calendar.season;
  const selectedTitle = calendar.titles.find((t) => t.id === selectedTitleId) ?? null;

  return (
    <div className="editor-page">
      <div className="editor-top">
        <button className="icon-btn" onClick={() => setSettingsOpen(true)} title="Settings">
          ⚙
        </button>
        <select
          className="cal-select"
          value={calendar.id}
          onChange={(e) => (e.target.value === "__new__" ? navigate("/") : navigate(`/edit/${e.target.value}`))}
        >
          <option value={calendar.id}>
            {label} {calendar.year}
          </option>
          {summaries
            .filter((s) => s.id !== calendar.id)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.season === "Custom" ? s.customSeasonLabel || "Custom" : s.season} {s.year}
              </option>
            ))}
          <option value="__new__">+ New calendar…</option>
        </select>
        <div className="spacer" />
        {countError && (
          <div className="count-warning">
            {countError.reason === "too-few" ? `Needs at least 9 titles (has ${countError.count})` : `Max 15 titles (has ${countError.count})`}
          </div>
        )}
        <button className="btn-ghost" onClick={handleSave} disabled={saving}>
          💾 {saving ? "Saving…" : "Save"}
        </button>
        <button className="btn-dl" onClick={handleDownload}>
          ⬇ Download PDF
        </button>
      </div>

      <div className="editor-body">
        {selectedTitle ? (
          <DetailsPanel
            calendar={calendar}
            title={selectedTitle}
            onChange={(next) => updateCalendar({ titles: calendar.titles.map((t) => (t.id === next.id ? next : t)) })}
            onBack={() => setSelectedTitleId(null)}
          />
        ) : (
          <div className="editor-left">
            <div className="left-label">Titles</div>
            {calendar.titles.map((title) => (
              <TitleCard
                key={title.id}
                title={title}
                series={calendar.series}
                onChange={(next) => updateCalendar({ titles: calendar.titles.map((t) => (t.id === next.id ? next : t)) })}
                onSeriesChange={(seriesId) => handleTitleSeriesChange(title.id, seriesId)}
                onOpenDetails={() => setSelectedTitleId(title.id)}
              />
            ))}
            {calendar.series.length > 0 && <div className="left-label" style={{ marginTop: "1rem" }}>Series</div>}
            {calendar.series.map((s) => (
              <SeriesMiniCard
                key={s.id}
                series={s}
                calendar={calendar}
                onChange={(next) => updateCalendar({ series: calendar.series.map((x) => (x.id === next.id ? next : x)) })}
              />
            ))}
          </div>
        )}

        <div className="editor-right">
          <CalendarCanvas calendar={calendar} layout={layout} geometry={geometry} selectedTitleId={selectedTitleId} onSelectTitle={setSelectedTitleId} />
        </div>
      </div>

      <ExportStage ref={exportStageRef} calendar={calendar} layout={layout} geometry={geometry} />

      {settingsOpen && <SettingsDrawer calendar={calendar} onChange={updateCalendar} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
