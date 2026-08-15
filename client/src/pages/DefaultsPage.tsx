import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCanvas } from "../components/canvas/CalendarCanvas";
import { HeaderFooterDrawer } from "../components/editor/HeaderFooterDrawer";
import { SettingsDrawer } from "../components/editor/SettingsDrawer";
import { computeGeometry } from "../lib/calendarGeometry";
import { buildLayout } from "../lib/layoutEngine";
import { buildSampleCalendar } from "../lib/sampleCalendar";
import { getDefaultTheme, resetDefaultTheme, saveAsDefaultTheme } from "../lib/userDefaults";
import type { Calendar, CalendarTheme, Season } from "../types/calendar";
import "../components/editor/TopBar.css";
import "./DefaultsPage.css";

export function DefaultsPage() {
  const navigate = useNavigate();
  const [activeSeason, setActiveSeason] = useState<Season>("Summer");
  const [theme, setTheme] = useState<CalendarTheme>(() => getDefaultTheme("Summer"));
  const [dirty, setDirty] = useState(false);
  const [headerFooterOpen, setHeaderFooterOpen] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const calendar: Calendar = useMemo(() => buildSampleCalendar(theme, activeSeason), [theme, activeSeason]);
  const layout = useMemo(() => buildLayout(calendar.titles, calendar.series), [calendar]);
  const geometry = useMemo(() => computeGeometry(layout, calendar.theme.spacing), [layout, calendar]);

  function updateCalendar(patch: Partial<Calendar>) {
    if (patch.theme) {
      setTheme(patch.theme);
      setDirty(true);
    }
  }

  function handleSeasonChange(season: Season) {
    if (season === activeSeason) return;
    if (dirty && !window.confirm(`Switch to ${season}? Unsaved changes to ${activeSeason}'s defaults will be lost unless you Save first.`)) return;
    setActiveSeason(season);
    setTheme(getDefaultTheme(season));
    setDirty(false);
  }

  function handleSave() {
    saveAsDefaultTheme(theme, activeSeason);
    setDirty(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  }

  function handleReset() {
    if (!window.confirm("Reset default settings back to the built-in Onyx Downtown defaults? This replaces your saved defaults for every season.")) return;
    resetDefaultTheme();
    setTheme(getDefaultTheme(activeSeason));
    setDirty(false);
  }

  return (
    <div className="defaults-page">
      <div className="defaults-top">
        <button type="button" className="icon-btn" title="Back" onClick={() => navigate(-1)}>
          ←
        </button>
        <div className="defaults-heading">
          <div className="defaults-title">Default Settings</div>
          <div className="defaults-sub">Applies to every new calendar. This preview uses sample content — nothing here is saved until you press Save.</div>
        </div>
        <div className="spacer" />
        <button type="button" className="btn-ghost" onClick={handleReset}>
          Reset to built-in
        </button>
        <button type="button" className="btn-dl" onClick={handleSave}>
          {savedFlash ? "Saved ✓" : "💾 Save as default"}
        </button>
      </div>

      <div className="defaults-body">
        <div className="defaults-canvas">
          <CalendarCanvas calendar={calendar} layout={layout} geometry={geometry} selectedTitleId={null} onSelectTitle={() => {}} onOpenHeaderFooter={() => setHeaderFooterOpen(true)} />
        </div>
        <SettingsDrawer
          calendar={calendar}
          onChange={updateCalendar}
          onClose={() => navigate(-1)}
          variant="defaults"
          activeSeason={activeSeason}
          onSeasonChange={handleSeasonChange}
        />
        {headerFooterOpen && <HeaderFooterDrawer calendar={calendar} onChange={updateCalendar} onClose={() => setHeaderFooterOpen(false)} variant="defaults" />}
      </div>
    </div>
  );
}
