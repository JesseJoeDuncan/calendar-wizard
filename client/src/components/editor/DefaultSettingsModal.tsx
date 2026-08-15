import { useMemo, useRef, useState } from "react";
import { CalendarCanvas } from "../canvas/CalendarCanvas";
import { PaletteColorInput } from "../PaletteColorInput";
import { SettingRow } from "../SettingRow";
import { applyPaletteToTheme } from "../../lib/colorPalette";
import { computeGeometry } from "../../lib/calendarGeometry";
import { deepMergeDefaults, diffAgainstBase } from "../../lib/deepMerge";
import { buildLayout } from "../../lib/layoutEngine";
import { buildSampleCalendar } from "../../lib/sampleCalendar";
import { TEXTURE_STYLE_OPTIONS } from "../../lib/textureTiles";
import { HARDCODED_DEFAULT_THEME, getDefaultTheme, saveAsDefaultTheme } from "../../lib/userDefaults";
import type { BackgroundTextureStyle, Calendar, CalendarTheme, CardTextDefaults, ColorPalette, MpaRating, Season } from "../../types/calendar";
import { HeaderFooterDrawer } from "./HeaderFooterDrawer";
import { PaletteEditor } from "./PaletteEditor";
import "./DefaultSettingsModal.css";

const FONT_OPTIONS = ["Futura Wizard", "Futura Wizard Condensed", "Market Deco"];
const RATINGS: MpaRating[] = ["G", "PG", "PG-13", "R", "NC-17", "NR"];

type CategoryId = "layout" | "palettes" | "headerFooter" | "texture" | "cardDate" | "cardTitle" | "cardRuntime" | "cardRating" | "cardCorners" | "cardShadow" | "cardSeriesTag";

const TOP_CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "layout", label: "Layout & Spacing" },
  { id: "palettes", label: "Color Palettes" },
  { id: "headerFooter", label: "Header & Footer" },
  { id: "texture", label: "Background Texture" },
];

const MOVIE_CARD_CHILDREN: { id: CategoryId; label: string }[] = [
  { id: "cardDate", label: "Date Text" },
  { id: "cardTitle", label: "Title Text" },
  { id: "cardRuntime", label: "Runtime" },
  { id: "cardRating", label: "Rating" },
  { id: "cardCorners", label: "Corner Rounding" },
  { id: "cardShadow", label: "Drop Shadows" },
  { id: "cardSeriesTag", label: "Series Tags" },
];

interface Props {
  calendar: Calendar;
  onClose: () => void;
  onApplyToCalendar: (theme: CalendarTheme) => void;
}

/**
 * A large modal (not a page) for editing the calendar defaults every NEW calendar starts from —
 * deliberately styled in its own distinct palette (see DefaultSettingsModal.css) so it's never
 * mistaken for editing the calendar currently open behind it. Left: category nav. Middle: that
 * category's controls. Right: a live preview. Bottom: Save, plus an opt-in checkbox that applies
 * only the fields actually changed in this session onto the calendar the modal was opened from.
 */
export function DefaultSettingsModal({ calendar, onClose, onApplyToCalendar }: Props) {
  const [activeSeason, setActiveSeason] = useState<Season>(calendar.season);
  const [theme, setTheme] = useState<CalendarTheme>(() => getDefaultTheme(calendar.season));
  const initialThemeRef = useRef<CalendarTheme>(theme);
  const [dirty, setDirty] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryId>("layout");
  const [movieCardsOpen, setMovieCardsOpen] = useState(true);
  const [applyToCalendar, setApplyToCalendar] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const sampleCalendar = useMemo(() => buildSampleCalendar(theme, activeSeason), [theme, activeSeason]);
  const layout = useMemo(() => buildLayout(sampleCalendar.titles, sampleCalendar.series), [sampleCalendar]);
  const geometry = useMemo(() => computeGeometry(layout, sampleCalendar.theme.spacing), [layout, sampleCalendar]);

  const factory = HARDCODED_DEFAULT_THEME;

  function updateTheme(patch: Partial<CalendarTheme>) {
    setTheme((t) => ({ ...t, ...patch }));
    setDirty(true);
  }

  function updateCalendarPatch(patch: Partial<Calendar>) {
    if (patch.theme) updateTheme(patch.theme);
  }

  function updateSpacing(patch: Partial<CalendarTheme["spacing"]>) {
    updateTheme({ spacing: { ...theme.spacing, ...patch } });
  }

  function updatePalette(palette: ColorPalette) {
    setTheme((t) => applyPaletteToTheme(t, palette));
    setDirty(true);
  }

  function updateCardText<K extends keyof CardTextDefaults>(section: K, patch: Partial<CardTextDefaults[K]>) {
    updateTheme({ cardText: { ...theme.cardText, [section]: { ...theme.cardText[section], ...patch } } });
  }

  function handleSeasonChange(season: Season) {
    if (season === activeSeason) return;
    if (dirty && !window.confirm(`Switch to ${season}? Unsaved changes to ${activeSeason}'s defaults will be lost unless you Save first.`)) return;
    const next = getDefaultTheme(season);
    setActiveSeason(season);
    setTheme(next);
    initialThemeRef.current = next;
    setDirty(false);
  }

  function handleSave() {
    saveAsDefaultTheme(theme, activeSeason);
    if (applyToCalendar) {
      const diff = diffAgainstBase(initialThemeRef.current, theme);
      if (diff) onApplyToCalendar(deepMergeDefaults(calendar.theme, diff) as CalendarTheme);
    }
    initialThemeRef.current = theme;
    setDirty(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  }

  function handleRequestClose() {
    if (dirty && !window.confirm("Close without saving? Your unsaved changes to these defaults will be lost.")) return;
    onClose();
  }

  function selectCategory(id: CategoryId) {
    setActiveCategory(id);
  }

  return (
    <div className="dsm-overlay" onMouseDown={(e) => e.target === e.currentTarget && handleRequestClose()}>
      <div className="dsm-panel">
        <div className="dsm-top">
          <div className="dsm-title">
            <span className="dsm-title-badge">DEFAULT SETTINGS</span>
            <span className="dsm-title-sub">Applies to every new calendar — this preview uses sample content.</span>
          </div>
          <button type="button" className="dsm-close" onClick={handleRequestClose} title="Close">
            ✕
          </button>
        </div>

        <div className="dsm-body">
          <nav className="dsm-nav">
            {TOP_CATEGORIES.slice(0, 3).map((c) => (
              <button key={c.id} type="button" className={`dsm-nav-item ${activeCategory === c.id ? "sel" : ""}`} onClick={() => selectCategory(c.id)}>
                {c.label}
              </button>
            ))}

            <button
              type="button"
              className={`dsm-nav-item dsm-nav-parent ${MOVIE_CARD_CHILDREN.some((c) => c.id === activeCategory) ? "sel" : ""}`}
              onClick={() => setMovieCardsOpen((o) => !o)}
            >
              Movie Cards
              <span className="dsm-nav-caret">{movieCardsOpen ? "▾" : "▸"}</span>
            </button>
            {movieCardsOpen &&
              MOVIE_CARD_CHILDREN.map((c) => (
                <button key={c.id} type="button" className={`dsm-nav-item dsm-nav-child ${activeCategory === c.id ? "sel" : ""}`} onClick={() => selectCategory(c.id)}>
                  {c.label}
                </button>
              ))}

            <button
              type="button"
              className={`dsm-nav-item ${activeCategory === "texture" ? "sel" : ""}`}
              onClick={() => selectCategory("texture")}
            >
              Background Texture
            </button>
          </nav>

          <div className="dsm-content">
            {activeCategory === "layout" && (
              <div className="dsm-pane">
                <h3>Layout &amp; Spacing</h3>
                <SettingRow label="Outer margin" value={theme.spacing.outerMargin} defaultValue={factory.spacing.outerMargin} min={0} max={80} unit="px" onChange={(v) => updateSpacing({ outerMargin: v })} />
                <SettingRow label="Box gutter" value={theme.spacing.boxGutter} defaultValue={factory.spacing.boxGutter} min={0} max={40} unit="px" onChange={(v) => updateSpacing({ boxGutter: v })} />
                <SettingRow
                  label="Intra-series box gutter"
                  value={theme.spacing.seriesBoxGutter}
                  defaultValue={factory.spacing.seriesBoxGutter}
                  min={0}
                  max={40}
                  unit="px"
                  onChange={(v) => updateSpacing({ seriesBoxGutter: v })}
                />
                <SettingRow label="Row gap" value={theme.spacing.rowGap} defaultValue={factory.spacing.rowGap} min={0} max={60} unit="px" onChange={(v) => updateSpacing({ rowGap: v })} />
                <SettingRow
                  label="Rows height"
                  value={theme.spacing.rowsHeightScale}
                  defaultValue={factory.spacing.rowsHeightScale}
                  min={0.8}
                  max={1}
                  step={0.01}
                  onChange={(v) => updateSpacing({ rowsHeightScale: v })}
                />
                <SettingRow
                  label="Band height"
                  value={theme.spacing.bandHeightRatio}
                  defaultValue={factory.spacing.bandHeightRatio}
                  min={0.08}
                  max={0.28}
                  step={0.01}
                  onChange={(v) => updateSpacing({ bandHeightRatio: v })}
                />
              </div>
            )}

            {activeCategory === "palettes" && (
              <div className="dsm-pane">
                <h3>Color Palettes</h3>
                <PaletteEditor activeSeason={activeSeason} onSeasonChange={handleSeasonChange} palette={theme.palette} onChange={updatePalette} />
              </div>
            )}

            {activeCategory === "headerFooter" && (
              <div className="dsm-pane dsm-pane-hf">
                <h3>Header &amp; Footer</h3>
                <HeaderFooterDrawer calendar={sampleCalendar} onChange={updateCalendarPatch} variant="defaults" embedded />
              </div>
            )}

            {activeCategory === "texture" && (
              <div className="dsm-pane">
                <h3>Background Texture</h3>
                <label className="drawer-field">
                  <span>Texture Style</span>
                  <select
                    value={theme.backgroundTexture.style}
                    onChange={(e) => updateTheme({ backgroundTexture: { ...theme.backgroundTexture, style: e.target.value as BackgroundTextureStyle } })}
                  >
                    {TEXTURE_STYLE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <SettingRow
                  label="Texture Opacity"
                  value={theme.backgroundTexture.opacity}
                  defaultValue={factory.backgroundTexture.opacity}
                  min={0}
                  max={1}
                  step={0.02}
                  disabled={theme.backgroundTexture.style === "none"}
                  onChange={(v) => updateTheme({ backgroundTexture: { ...theme.backgroundTexture, opacity: v } })}
                />
              </div>
            )}

            {activeCategory === "cardDate" && (
              <div className="dsm-pane">
                <h3>Date Text</h3>
                <SettingRow
                  label="Number size"
                  value={theme.spacing.dateNumberSizePct}
                  defaultValue={factory.spacing.dateNumberSizePct}
                  min={0.15}
                  max={0.6}
                  step={0.01}
                  onChange={(v) => updateSpacing({ dateNumberSizePct: v })}
                />
                <SettingRow
                  label="Month size"
                  value={theme.spacing.dateMonthSizePct}
                  defaultValue={factory.spacing.dateMonthSizePct}
                  min={0.03}
                  max={0.2}
                  step={0.01}
                  onChange={(v) => updateSpacing({ dateMonthSizePct: v })}
                />
                <SettingRow
                  label="Month/number gap"
                  value={theme.spacing.dateMonthGap}
                  defaultValue={factory.spacing.dateMonthGap}
                  min={-20}
                  max={20}
                  unit="px"
                  onChange={(v) => updateSpacing({ dateMonthGap: v })}
                />
                <label className="drawer-field">
                  <span>Font</span>
                  <select value={theme.cardText.date.fontFamily} onChange={(e) => updateCardText("date", { fontFamily: e.target.value })}>
                    {FONT_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </label>
                <PaletteColorInput label="Color" value={theme.cardText.date.color} defaultValue={factory.cardText.date.color} palette={theme.palette} onChange={(hex) => updateCardText("date", { color: hex })} />
                <SettingRow label="Margin from left" value={theme.cardText.date.marginX} defaultValue={factory.cardText.date.marginX} min={0} max={40} unit="px" onChange={(v) => updateCardText("date", { marginX: v })} />
                <SettingRow label="Margin from top" value={theme.cardText.date.marginY} defaultValue={factory.cardText.date.marginY} min={0} max={40} unit="px" onChange={(v) => updateCardText("date", { marginY: v })} />
                <SettingRow
                  label="Month kerning"
                  value={theme.cardText.date.monthKerning}
                  defaultValue={factory.cardText.date.monthKerning}
                  min={-2}
                  max={6}
                  step={0.1}
                  onChange={(v) => updateCardText("date", { monthKerning: v })}
                />
                <PaletteColorInput
                  label="Drop shadow color"
                  value={theme.cardText.date.dropShadowColor}
                  defaultValue={factory.cardText.date.dropShadowColor}
                  palette={theme.palette}
                  onChange={(hex) => updateCardText("date", { dropShadowColor: hex })}
                />
                <SettingRow
                  label="Drop shadow blur"
                  value={theme.cardText.date.dropShadowBlur}
                  defaultValue={factory.cardText.date.dropShadowBlur}
                  min={0}
                  max={20}
                  step={0.5}
                  onChange={(v) => updateCardText("date", { dropShadowBlur: v })}
                />
              </div>
            )}

            {activeCategory === "cardTitle" && (
              <div className="dsm-pane">
                <h3>Title Text</h3>
                <label className="drawer-field">
                  <span>Font</span>
                  <select value={theme.cardText.title.fontFamily} onChange={(e) => updateCardText("title", { fontFamily: e.target.value })}>
                    {FONT_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </label>
                <PaletteColorInput label="Color" value={theme.cardText.title.color} defaultValue={factory.cardText.title.color} palette={theme.palette} onChange={(hex) => updateCardText("title", { color: hex })} />
                <SettingRow
                  label="Margin from left/right"
                  value={theme.cardText.title.marginX}
                  defaultValue={factory.cardText.title.marginX}
                  min={0}
                  max={40}
                  unit="px"
                  onChange={(v) => updateCardText("title", { marginX: v })}
                />
                <SettingRow
                  label="Gap above bottom edge"
                  value={theme.cardText.title.bottomGapPct}
                  defaultValue={factory.cardText.title.bottomGapPct}
                  min={0}
                  max={0.2}
                  step={0.005}
                  onChange={(v) => updateCardText("title", { bottomGapPct: v })}
                />
                <PaletteColorInput
                  label="Drop shadow color"
                  value={theme.cardText.title.dropShadowColor}
                  defaultValue={factory.cardText.title.dropShadowColor}
                  palette={theme.palette}
                  onChange={(hex) => updateCardText("title", { dropShadowColor: hex })}
                />
                <SettingRow
                  label="Drop shadow blur"
                  value={theme.cardText.title.dropShadowBlur}
                  defaultValue={factory.cardText.title.dropShadowBlur}
                  min={0}
                  max={20}
                  step={0.5}
                  onChange={(v) => updateCardText("title", { dropShadowBlur: v })}
                />
                <p className="dsm-hint">Font size, kerning, line spacing, justify, and offset are per-title settings — editable from each title's Details panel.</p>
              </div>
            )}

            {activeCategory === "cardRuntime" && (
              <div className="dsm-pane">
                <h3>Runtime</h3>
                <label className="drawer-field">
                  <span>Font</span>
                  <select value={theme.cardText.runtime.fontFamily} onChange={(e) => updateCardText("runtime", { fontFamily: e.target.value })}>
                    {FONT_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </label>
                <PaletteColorInput label="Color" value={theme.cardText.runtime.color} defaultValue={factory.cardText.runtime.color} palette={theme.palette} onChange={(hex) => updateCardText("runtime", { color: hex })} />
                <SettingRow label="Size" value={theme.cardText.runtime.baseSize} defaultValue={factory.cardText.runtime.baseSize} min={4} max={24} step={0.1} onChange={(v) => updateCardText("runtime", { baseSize: v })} />
                <SettingRow label="Kerning" value={theme.cardText.runtime.kerning} defaultValue={factory.cardText.runtime.kerning} min={-2} max={6} step={0.1} onChange={(v) => updateCardText("runtime", { kerning: v })} />
                <SettingRow
                  label="Margin from right edge"
                  value={theme.cardText.runtime.marginX}
                  defaultValue={factory.cardText.runtime.marginX}
                  min={0}
                  max={40}
                  unit="px"
                  onChange={(v) => updateCardText("runtime", { marginX: v })}
                />
                <SettingRow
                  label="Margin from bottom edge"
                  value={theme.cardText.runtime.marginY}
                  defaultValue={factory.cardText.runtime.marginY}
                  min={0}
                  max={40}
                  unit="px"
                  onChange={(v) => updateCardText("runtime", { marginY: v })}
                />
                <PaletteColorInput
                  label="Drop shadow color"
                  value={theme.cardText.runtime.dropShadowColor}
                  defaultValue={factory.cardText.runtime.dropShadowColor}
                  palette={theme.palette}
                  onChange={(hex) => updateCardText("runtime", { dropShadowColor: hex })}
                />
                <SettingRow
                  label="Drop shadow blur"
                  value={theme.cardText.runtime.dropShadowBlur}
                  defaultValue={factory.cardText.runtime.dropShadowBlur}
                  min={0}
                  max={20}
                  step={0.5}
                  onChange={(v) => updateCardText("runtime", { dropShadowBlur: v })}
                />
                <p className="dsm-hint">Opacity and whether the drop shadow shows at all are per-title settings.</p>
              </div>
            )}

            {activeCategory === "cardRating" && (
              <div className="dsm-pane">
                <h3>Rating</h3>
                <SettingRow label="Base size" value={theme.cardText.rating.baseSize} defaultValue={factory.cardText.rating.baseSize} min={8} max={36} step={0.1} onChange={(v) => updateCardText("rating", { baseSize: v })} />
                <PaletteColorInput label="Color" value={theme.cardText.rating.color} defaultValue={factory.cardText.rating.color} palette={theme.palette} onChange={(hex) => updateCardText("rating", { color: hex })} />
                <PaletteColorInput
                  label="Drop shadow color"
                  value={theme.cardText.rating.dropShadowColor}
                  defaultValue={factory.cardText.rating.dropShadowColor}
                  palette={theme.palette}
                  onChange={(hex) => updateCardText("rating", { dropShadowColor: hex })}
                />
                <SettingRow
                  label="Drop shadow blur"
                  value={theme.cardText.rating.dropShadowBlur}
                  defaultValue={factory.cardText.rating.dropShadowBlur}
                  min={0}
                  max={20}
                  step={0.5}
                  onChange={(v) => updateCardText("rating", { dropShadowBlur: v })}
                />
                <label className="drawer-field dsm-checkbox-field">
                  <span>Snap horizontal center to Runtime</span>
                  <input
                    type="checkbox"
                    checked={theme.cardText.rating.snapToRuntimeX}
                    onChange={(e) => updateCardText("rating", { snapToRuntimeX: e.target.checked })}
                  />
                </label>

                <h4 className="dsm-subhead">Per-rating size &amp; default visibility</h4>
                <div className="dsm-rating-table">
                  <div className="dsm-rating-row dsm-rating-head">
                    <span>Rating</span>
                    <span>Size ×</span>
                    <span>Visible by default</span>
                  </div>
                  {RATINGS.map((r) => (
                    <div className="dsm-rating-row" key={r}>
                      <span className="dsm-rating-label">{r}</span>
                      <input
                        type="number"
                        className="dsm-rating-num"
                        min={0.4}
                        max={2}
                        step={0.05}
                        value={theme.cardText.rating.sizeByRating[r]}
                        onChange={(e) => updateCardText("rating", { sizeByRating: { ...theme.cardText.rating.sizeByRating, [r]: Number(e.target.value) } })}
                      />
                      <input
                        type="checkbox"
                        checked={theme.cardText.rating.visibleByRating[r]}
                        onChange={(e) => updateCardText("rating", { visibleByRating: { ...theme.cardText.rating.visibleByRating, [r]: e.target.checked } })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeCategory === "cardCorners" && (
              <div className="dsm-pane">
                <h3>Corner Rounding</h3>
                <SettingRow
                  label="Primary (free corners)"
                  value={theme.spacing.primaryRadius}
                  defaultValue={factory.spacing.primaryRadius}
                  min={0}
                  max={60}
                  unit="px"
                  onChange={(v) => updateSpacing({ primaryRadius: v })}
                />
                <SettingRow
                  label="Secondary (intra-series)"
                  value={theme.spacing.secondaryRadius}
                  defaultValue={factory.spacing.secondaryRadius}
                  min={0}
                  max={60}
                  unit="px"
                  onChange={(v) => updateSpacing({ secondaryRadius: v })}
                />
                <SettingRow
                  label="Tertiary (meets band)"
                  value={theme.spacing.tertiaryRadius}
                  defaultValue={factory.spacing.tertiaryRadius}
                  min={0}
                  max={60}
                  unit="px"
                  onChange={(v) => updateSpacing({ tertiaryRadius: v })}
                />
              </div>
            )}

            {activeCategory === "cardShadow" && (
              <div className="dsm-pane">
                <h3>Drop Shadows</h3>
                <label className="drawer-field dsm-checkbox-field">
                  <span>Enabled</span>
                  <input type="checkbox" checked={theme.cardShadow.enabled} onChange={(e) => updateTheme({ cardShadow: { ...theme.cardShadow, enabled: e.target.checked } })} />
                </label>
                <PaletteColorInput label="Color" value={theme.cardShadow.color} defaultValue={factory.cardShadow.color} palette={theme.palette} onChange={(hex) => updateTheme({ cardShadow: { ...theme.cardShadow, color: hex } })} />
                <SettingRow
                  label="Blur"
                  value={theme.cardShadow.blur}
                  defaultValue={factory.cardShadow.blur}
                  min={0}
                  max={40}
                  unit="px"
                  disabled={!theme.cardShadow.enabled}
                  onChange={(v) => updateTheme({ cardShadow: { ...theme.cardShadow, blur: v } })}
                />
                <SettingRow
                  label="Opacity"
                  value={theme.cardShadow.opacity}
                  defaultValue={factory.cardShadow.opacity}
                  min={0}
                  max={1}
                  step={0.02}
                  disabled={!theme.cardShadow.enabled}
                  onChange={(v) => updateTheme({ cardShadow: { ...theme.cardShadow, opacity: v } })}
                />
                <SettingRow
                  label="Offset X"
                  value={theme.cardShadow.offsetX}
                  defaultValue={factory.cardShadow.offsetX}
                  min={-20}
                  max={20}
                  unit="px"
                  disabled={!theme.cardShadow.enabled}
                  onChange={(v) => updateTheme({ cardShadow: { ...theme.cardShadow, offsetX: v } })}
                />
                <SettingRow
                  label="Offset Y"
                  value={theme.cardShadow.offsetY}
                  defaultValue={factory.cardShadow.offsetY}
                  min={-20}
                  max={20}
                  unit="px"
                  disabled={!theme.cardShadow.enabled}
                  onChange={(v) => updateTheme({ cardShadow: { ...theme.cardShadow, offsetY: v } })}
                />
                <p className="dsm-hint">Applies to every movie card and every series band.</p>
              </div>
            )}

            {activeCategory === "cardSeriesTag" && (
              <div className="dsm-pane">
                <h3>Series Tags</h3>
                <label className="drawer-field">
                  <span>Font</span>
                  <select value={theme.cardText.seriesTag.fontFamily} onChange={(e) => updateCardText("seriesTag", { fontFamily: e.target.value })}>
                    {FONT_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </label>
                <SettingRow
                  label="Text size"
                  value={theme.cardText.seriesTag.fontSize}
                  defaultValue={factory.cardText.seriesTag.fontSize}
                  min={6}
                  max={30}
                  step={0.5}
                  onChange={(v) => updateCardText("seriesTag", { fontSize: v })}
                />
                <PaletteColorInput
                  label="Text color"
                  value={theme.cardText.seriesTag.textColor}
                  defaultValue={factory.cardText.seriesTag.textColor}
                  palette={theme.palette}
                  onChange={(hex) => updateCardText("seriesTag", { textColor: hex })}
                />
                <PaletteColorInput
                  label="Tag color"
                  value={theme.cardText.seriesTag.tagColor}
                  defaultValue={factory.cardText.seriesTag.tagColor}
                  palette={theme.palette}
                  onChange={(hex) => updateCardText("seriesTag", { tagColor: hex })}
                />
                <SettingRow
                  label="Text opacity"
                  value={theme.cardText.seriesTag.opacity}
                  defaultValue={factory.cardText.seriesTag.opacity}
                  min={0}
                  max={1}
                  step={0.02}
                  onChange={(v) => updateCardText("seriesTag", { opacity: v })}
                />
                <SettingRow
                  label="Kerning"
                  value={theme.cardText.seriesTag.kerning}
                  defaultValue={factory.cardText.seriesTag.kerning}
                  min={-2}
                  max={8}
                  step={0.1}
                  onChange={(v) => updateCardText("seriesTag", { kerning: v })}
                />
                <p className="dsm-hint">Seeds newly-created series only — each series' tag stays independently editable afterward.</p>
              </div>
            )}
          </div>

          <div className="dsm-preview">
            <CalendarCanvas calendar={sampleCalendar} layout={layout} geometry={geometry} selectedTitleId={null} onSelectTitle={() => {}} />
          </div>
        </div>

        <div className="dsm-bottom">
          <label className="dsm-apply-checkbox">
            <input type="checkbox" checked={applyToCalendar} onChange={(e) => setApplyToCalendar(e.target.checked)} />
            Apply changes to current calendar
          </label>
          <div className="dsm-spacer" />
          <button type="button" className="dsm-save" onClick={handleSave}>
            {savedFlash ? "Saved ✓" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

