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
import { computeAutoFitTitleText } from "../lib/autoFitText";
import { DEFAULT_SPACING, computeGeometry } from "../lib/calendarGeometry";
import { exportCalendarPdf } from "../lib/exportPdf";
import { buildLayout, validateTitleCount } from "../lib/layoutEngine";
import { getAutoSaveMinutes, getDefaultTheme } from "../lib/userDefaults";
import type { Calendar, CalendarSummary } from "../types/calendar";
import "./EditorPage.css";

const HISTORY_DEBOUNCE_MS = 800;
const MAX_HISTORY = 50;

function calendarLabel(s: Pick<CalendarSummary, "season" | "customSeasonLabel" | "year">): string {
  return `${s.season === "Custom" ? s.customSeasonLabel || "Custom" : s.season} ${s.year}`;
}

function dropdownLabel(s: CalendarSummary, all: CalendarSummary[]): string {
  const label = calendarLabel(s);
  const siblings = all.filter((x) => calendarLabel(x) === label).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  if (siblings.length <= 1) return label;
  const idx = siblings.findIndex((x) => x.id === s.id);
  return `${label} (#${idx + 1})`;
}

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [summaries, setSummaries] = useState<CalendarSummary[]>([]);
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [past, setPast] = useState<Calendar[]>([]);
  const [future, setFuture] = useState<Calendar[]>([]);
  const [autoSaveMinutes, setAutoSaveMinutesState] = useState(getAutoSaveMinutes());
  const exportStageRef = useRef<Konva.Stage>(null);
  const historyTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const historyBaseRef = useRef<Calendar | null>(null);
  const isDirtyRef = useRef(false);
  const lastSavedAtRef = useRef(Date.now());

  useEffect(() => {
    api.listCalendars().then((r) => setSummaries(r.calendars)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setCalendar(null);
    setSelectedTitleId(null);
    setPast([]);
    setFuture([]);
    isDirtyRef.current = false;

    (async () => {
      try {
        const fetched = await api.getCalendar(id);
        if (cancelled) return;
        // Older saved calendars may predate newly-added theme fields — backfill defaults.
        const defaults = getDefaultTheme();
        const loaded: Calendar = {
          ...fetched,
          theme: {
            background: fetched.theme.background ?? defaults.background,
            spacing: { ...DEFAULT_SPACING, ...fetched.theme.spacing },
          },
        };
        setCalendar(loaded);
        lastSavedAtRef.current = Date.now();
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

  // Auto-fit title text sizing runs once per title (guarded by the fontSize sentinel of 0), the
  // first time its real box width is known, then behaves like any other stored setting.
  useEffect(() => {
    if (!calendar || !geometry) return;
    const widthByTitleId = new Map<string, number>();
    for (const row of geometry.rows) for (const box of row.boxes) widthByTitleId.set(box.titleId, box.w);
    const needsFit = calendar.titles.filter((t) => t.name && !t.titleTextStyle.fontSize && widthByTitleId.has(t.id));
    if (needsFit.length === 0) return;
    setCalendar((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        titles: prev.titles.map((t) => {
          const w = widthByTitleId.get(t.id);
          if (!t.name || t.titleTextStyle.fontSize || !w) return t;
          const fit = computeAutoFitTitleText(t.name, w, "Futura Wizard");
          return { ...t, titleTextStyle: { ...t.titleTextStyle, fontSize: fit.fontSize, manualLineBreaks: fit.manualLineBreaks } };
        }),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendar?.id, geometry]);

  function updateCalendar(patch: Partial<Calendar>) {
    setCalendar((prev) => {
      if (!prev) return prev;
      if (!historyBaseRef.current) historyBaseRef.current = prev;
      if (historyTimerRef.current) clearTimeout(historyTimerRef.current);
      historyTimerRef.current = setTimeout(() => {
        const base = historyBaseRef.current;
        if (base) setPast((p) => [...p.slice(-(MAX_HISTORY - 1)), base]);
        historyBaseRef.current = null;
      }, HISTORY_DEBOUNCE_MS);
      setFuture([]);
      isDirtyRef.current = true;
      return { ...prev, ...patch };
    });
  }

  function undo() {
    if (past.length === 0 || !calendar) return;
    const prevState = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [calendar, ...f]);
    setCalendar(prevState);
    isDirtyRef.current = true;
  }

  function redo() {
    if (future.length === 0 || !calendar) return;
    const nextState = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, calendar]);
    setCalendar(nextState);
    isDirtyRef.current = true;
  }

  function handleTitleSeriesChange(titleId: string, newSeriesId: string | undefined) {
    updateCalendar({
      titles: calendar!.titles.map((t) => (t.id === titleId ? { ...t, seriesId: newSeriesId } : t)),
      series: calendar!.series.map((s) => ({
        ...s,
        titleIds: newSeriesId === s.id ? [...s.titleIds.filter((tid) => tid !== titleId), titleId] : s.titleIds.filter((tid) => tid !== titleId),
      })),
    });
  }

  function handleImageOffsetChange(titleId: string, offsetX: number, offsetY: number) {
    if (!calendar) return;
    updateCalendar({
      titles: calendar.titles.map((t) => (t.id === titleId && t.image ? { ...t, image: { ...t.image, offsetX, offsetY } } : t)),
    });
  }

  async function handleSave(silent = false) {
    if (!calendar) return;
    if (!silent) setSaving(true);
    try {
      await api.saveCalendar(calendar);
      isDirtyRef.current = false;
      lastSavedAtRef.current = Date.now();
      setSummaries((prev) => {
        const others = prev.filter((s) => s.id !== calendar.id);
        return [{ id: calendar.id, season: calendar.season, customSeasonLabel: calendar.customSeasonLabel, year: calendar.year, updatedAt: new Date().toISOString(), createdAt: calendar.createdAt }, ...others];
      });
    } catch (err) {
      console.error(err);
      if (!silent) setError("Save failed. Check that the server is running.");
    } finally {
      if (!silent) setSaving(false);
    }
  }

  // Auto-save: on each tick, save only if there's something unsaved and the last save (manual or
  // auto) was far enough back that this tick is actually due.
  useEffect(() => {
    const ms = autoSaveMinutes * 60 * 1000;
    const interval = setInterval(() => {
      if (isDirtyRef.current && Date.now() - lastSavedAtRef.current >= ms) {
        handleSave(true);
      }
    }, ms);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSaveMinutes, calendar?.id]);

  async function handleDelete() {
    if (!calendar) return;
    if (!window.confirm(`Delete "${calendarLabel(calendar)}"? This can't be undone.`)) return;
    try {
      await api.deleteCalendar(calendar.id);
      const remaining = summaries.filter((s) => s.id !== calendar.id);
      if (remaining.length > 0) navigate(`/edit/${remaining[0].id}`);
      else navigate("/");
    } catch (err) {
      console.error(err);
      setError("Delete failed. Check that the server is running.");
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

  const selectedTitle = calendar.titles.find((t) => t.id === selectedTitleId) ?? null;
  const selectedBoxWidth = selectedTitleId ? geometry.rows.flatMap((r) => r.boxes).find((b) => b.titleId === selectedTitleId)?.w ?? null : null;
  const allSummaries: CalendarSummary[] = summaries.some((s) => s.id === calendar.id)
    ? summaries
    : [...summaries, { id: calendar.id, season: calendar.season, customSeasonLabel: calendar.customSeasonLabel, year: calendar.year, updatedAt: calendar.updatedAt, createdAt: calendar.createdAt }];

  return (
    <div className="editor-page">
      <div className="editor-top">
        <button className="icon-btn" onClick={() => setSettingsOpen(true)} title="Settings">
          ⚙
        </button>
        <button className="icon-btn" onClick={() => navigate("/")} title="New calendar">
          +
        </button>
        <select className="cal-select" value={calendar.id} onChange={(e) => navigate(`/edit/${e.target.value}`)}>
          <option value={calendar.id}>{dropdownLabel(calendar, allSummaries)}</option>
          {summaries
            .filter((s) => s.id !== calendar.id)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {dropdownLabel(s, allSummaries)}
              </option>
            ))}
        </select>
        <button className="icon-btn" onClick={handleDelete} title="Delete this calendar">
          🗑
        </button>
        <div className="spacer" />
        {countError && (
          <div className="count-warning">
            {countError.reason === "too-few" ? `Needs at least 9 titles (has ${countError.count})` : `Max 15 titles (has ${countError.count})`}
          </div>
        )}
        <button className="icon-btn" onClick={undo} disabled={past.length === 0} title="Undo">
          ↶
        </button>
        <button className="icon-btn" onClick={redo} disabled={future.length === 0} title="Redo">
          ↷
        </button>
        <button className="btn-ghost" onClick={() => handleSave(false)} disabled={saving}>
          💾 {saving ? "Saving…" : "Save"}
        </button>
        <button className="btn-dl" onClick={handleDownload}>
          ⬇ Download PDF
        </button>
      </div>

      <div className="editor-body">
        <div className="editor-left">
          <div className="left-label">Titles</div>
          {calendar.titles.map((title) => (
            <TitleCard
              key={title.id}
              title={title}
              series={calendar.series}
              selected={selectedTitleId === title.id}
              onChange={(next) => updateCalendar({ titles: calendar.titles.map((t) => (t.id === next.id ? next : t)) })}
              onSeriesChange={(seriesId) => handleTitleSeriesChange(title.id, seriesId)}
              onOpenDetails={() => setSelectedTitleId(title.id)}
            />
          ))}
          {calendar.series.length > 0 && (
            <div className="left-label" style={{ marginTop: "1rem" }}>
              Series
            </div>
          )}
          {calendar.series.map((s) => (
            <SeriesMiniCard key={s.id} series={s} calendar={calendar} onChange={(next) => updateCalendar({ series: calendar.series.map((x) => (x.id === next.id ? next : x)) })} />
          ))}
        </div>

        {selectedTitle && (
          <DetailsPanel
            calendar={calendar}
            title={selectedTitle}
            boxWidth={selectedBoxWidth}
            onChange={(next) => updateCalendar({ titles: calendar.titles.map((t) => (t.id === next.id ? next : t)) })}
            onBack={() => setSelectedTitleId(null)}
          />
        )}

        <div className="editor-right">
          <CalendarCanvas
            calendar={calendar}
            layout={layout}
            geometry={geometry}
            selectedTitleId={selectedTitleId}
            onSelectTitle={setSelectedTitleId}
            onImageOffsetChange={handleImageOffsetChange}
          />
        </div>
      </div>

      <ExportStage ref={exportStageRef} calendar={calendar} layout={layout} geometry={geometry} />

      {settingsOpen && (
        <SettingsDrawer calendar={calendar} onChange={updateCalendar} onClose={() => setSettingsOpen(false)} onAutoSaveMinutesChange={setAutoSaveMinutesState} />
      )}
    </div>
  );
}
