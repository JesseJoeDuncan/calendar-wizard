import type Konva from "konva";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarCanvas } from "../components/canvas/CalendarCanvas";
import { ExportStage } from "../components/canvas/ExportStage";
import { DetailsPanel } from "../components/editor/DetailsPanel";
import { HeaderFooterDrawer } from "../components/editor/HeaderFooterDrawer";
import { SettingsDrawer } from "../components/editor/SettingsDrawer";
import { SeriesMiniCard } from "../components/editor/SeriesMiniCard";
import { TitleCard } from "../components/editor/TitleCard";
import { TopBar } from "../components/editor/TopBar";
import { api } from "../lib/api";
import { computeAutoFitTitleText } from "../lib/autoFitText";
import { calendarLabel } from "../lib/calendarLabel";
import { DEFAULT_CARD_SHADOW, DEFAULT_RATING_STYLE, DEFAULT_RUNTIME_STYLE, DEFAULT_SPACING, computeGeometry } from "../lib/calendarGeometry";
import { exportCalendarPdf } from "../lib/exportPdf";
import { HEADER_FOOTER_ELEMENT_IDS } from "../lib/headerFooterLayout";
import { buildLayout, validateTitleCount } from "../lib/layoutEngine";
import { getAutoSaveMinutes, getDefaultTheme } from "../lib/userDefaults";
import type { Calendar, CalendarSummary } from "../types/calendar";
import "./EditorPage.css";

const HISTORY_DEBOUNCE_MS = 800;
const MAX_HISTORY = 50;

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [summaries, setSummaries] = useState<CalendarSummary[]>([]);
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [headerFooterOpen, setHeaderFooterOpen] = useState(false);
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
        // Older saved calendars may predate newly-added theme/title fields — backfill defaults.
        const defaults = getDefaultTheme();
        // Titles saved before runtimeStyle/ratingStyle existed have flat runtimeOpacity/ratingOpacity
        // numbers instead — carry that opacity forward into the new style object.
        const legacyTitles = fetched.titles as unknown as Array<{ runtimeOpacity?: number; ratingOpacity?: number }>;
        const loaded: Calendar = {
          ...fetched,
          titles: fetched.titles.map((t, i) => ({
            ...t,
            runtimeStyle: t.runtimeStyle ?? { ...DEFAULT_RUNTIME_STYLE, opacity: legacyTitles[i]?.runtimeOpacity ?? DEFAULT_RUNTIME_STYLE.opacity },
            ratingStyle: t.ratingStyle ?? { ...DEFAULT_RATING_STYLE, opacity: legacyTitles[i]?.ratingOpacity ?? DEFAULT_RATING_STYLE.opacity },
          })),
          theme: {
            background: fetched.theme.background ?? defaults.background,
            spacing: { ...DEFAULT_SPACING, ...fetched.theme.spacing },
            cardShadow: fetched.theme.cardShadow ?? DEFAULT_CARD_SHADOW,
            headerFooter: fetched.theme.headerFooter
              ? {
                  ...defaults.headerFooter,
                  ...fetched.theme.headerFooter,
                  ...Object.fromEntries(
                    HEADER_FOOTER_ELEMENT_IDS.map((elId) => [elId, { ...defaults.headerFooter[elId], ...fetched.theme.headerFooter[elId] }])
                  ),
                }
              : defaults.headerFooter,
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
          const fit = computeAutoFitTitleText(t.name, w, "Futura Wizard Condensed");
          return { ...t, titleTextStyle: { ...t.titleTextStyle, fontSize: fit.fontSize, manualLineBreaks: fit.manualLineBreaks } };
        }),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendar?.id, geometry]);

  function updateCalendar(patch: Partial<Calendar> | ((prev: Calendar) => Partial<Calendar>)) {
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
      return { ...prev, ...(typeof patch === "function" ? patch(prev) : patch) };
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

  function handleImageScaleChange(titleId: string, scale: number) {
    if (!calendar) return;
    updateCalendar({
      titles: calendar.titles.map((t) => (t.id === titleId && t.image ? { ...t, image: { ...t.image, scale } } : t)),
    });
  }

  // Arrow-key micro-adjustments for the selected title's image position, while details mode is
  // open. Ignored while typing in a form field so normal text/number editing still works.
  useEffect(() => {
    if (!selectedTitleId) return;
    function isFormField(el: EventTarget | null) {
      const tag = (el as HTMLElement | null)?.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    }
    function onKeyDown(e: KeyboardEvent) {
      if (isFormField(e.target)) return;
      const deltas: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      const delta = deltas[e.key];
      if (!delta) return;
      e.preventDefault();
      const step = e.shiftKey ? 8 : 1;
      updateCalendar((prev) => {
        const title = prev.titles.find((t) => t.id === selectedTitleId);
        if (!title?.image) return {};
        const offsetX = title.image.offsetX + delta[0] * step;
        const offsetY = title.image.offsetY + delta[1] * step;
        return { titles: prev.titles.map((t) => (t.id === selectedTitleId && t.image ? { ...t, image: { ...t.image, offsetX, offsetY } } : t)) };
      });
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedTitleId]);

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
      <TopBar
        currentId={calendar.id}
        currentLabel={calendarLabel(calendar)}
        summaries={allSummaries}
        onSwitch={(targetId) => navigate(`/edit/${targetId}`)}
        onNew={() => navigate("/")}
        onDelete={handleDelete}
        editor={{
          countWarning: countError
            ? countError.reason === "too-few"
              ? `Needs at least 9 titles (has ${countError.count})`
              : `Max 15 titles (has ${countError.count})`
            : null,
          onSettings: () => setSettingsOpen(true),
          onHeaderFooter: () => setHeaderFooterOpen(true),
          onSave: () => handleSave(false),
          saving,
          onDownload: handleDownload,
          onUndo: undo,
          onRedo: redo,
          canUndo: past.length > 0,
          canRedo: future.length > 0,
        }}
      />

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
            onImageScaleChange={handleImageScaleChange}
            onOpenHeaderFooter={() => setHeaderFooterOpen(true)}
          />
        </div>

        {headerFooterOpen && <HeaderFooterDrawer calendar={calendar} onChange={updateCalendar} onClose={() => setHeaderFooterOpen(false)} />}
      </div>

      <ExportStage ref={exportStageRef} calendar={calendar} layout={layout} geometry={geometry} />

      {settingsOpen && (
        <SettingsDrawer calendar={calendar} onChange={updateCalendar} onClose={() => setSettingsOpen(false)} onAutoSaveMinutesChange={setAutoSaveMinutesState} />
      )}
    </div>
  );
}
