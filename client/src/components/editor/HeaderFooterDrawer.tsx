import { useNavigate } from "react-router-dom";
import { SettingRow } from "../SettingRow";
import { HEADER_FOOTER_ELEMENT_IDS, HEADER_FOOTER_ELEMENT_LABELS, defaultHeaderFooter, defaultSeasonTitleStyle } from "../../lib/headerFooterLayout";
import { getDefaultTheme } from "../../lib/userDefaults";
import type { Calendar, CalendarHeaderFooter, FooterShapeVariant, HeaderFooterElementId, HeaderFooterElementStyle, SeasonTitleStyle } from "../../types/calendar";
import { CollapsibleSection } from "./CollapsibleSection";
import "./SettingsDrawer.css";
import "./HeaderFooterDrawer.css";

interface Props {
  calendar: Calendar;
  onChange: (patch: Partial<Calendar>) => void;
  onClose: () => void;
}

const FOOTER_SHAPE_OPTIONS: { value: FooterShapeVariant; label: string }[] = [
  { value: "bumps", label: "Bumps" },
  { value: "zigzags", label: "Zigzags" },
  { value: "straightline", label: "Straight line" },
];

export function HeaderFooterDrawer({ calendar, onChange, onClose }: Props) {
  const { headerFooter, seasonTitle } = calendar.theme;
  const defaults = getDefaultTheme();
  const navigate = useNavigate();

  function updateHeaderFooter(patch: Partial<CalendarHeaderFooter>) {
    onChange({ theme: { ...calendar.theme, headerFooter: { ...headerFooter, ...patch } } });
  }

  function updateElement(id: HeaderFooterElementId, patch: Partial<HeaderFooterElementStyle>) {
    updateHeaderFooter({ [id]: { ...headerFooter[id], ...patch } });
  }

  function updateSeasonTitle(patch: Partial<SeasonTitleStyle>) {
    onChange({ theme: { ...calendar.theme, seasonTitle: { ...seasonTitle, ...patch } } });
  }

  function resetAll() {
    if (!window.confirm("Reset all header/footer settings on this calendar back to the default values?")) return;
    onChange({ theme: { ...calendar.theme, headerFooter: defaultHeaderFooter(), seasonTitle: defaultSeasonTitleStyle() } });
  }

  return (
    <div className="side-panel">
      <div className="drawer-head">
        <h3>Header &amp; Footer</h3>
        <button className="del-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="drawer-section">
        <h4>Footer shape</h4>
        <div className="hf-shape-row">
          {FOOTER_SHAPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`hf-shape-btn ${headerFooter.footerShapeVariant === opt.value ? "sel" : ""}`}
              onClick={() => updateHeaderFooter({ footerShapeVariant: opt.value })}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <CollapsibleSection
        title="Season title"
        defaultOpen
        headExtra={<input type="checkbox" checked={seasonTitle.visible} onChange={(e) => updateSeasonTitle({ visible: e.target.checked })} />}
      >
        <SettingRow label="Position X" value={seasonTitle.offsetX} defaultValue={defaults.seasonTitle.offsetX} min={-400} max={400} step={0.5} unit="px" onChange={(v) => updateSeasonTitle({ offsetX: v })} />
        <SettingRow label="Position Y" value={seasonTitle.offsetY} defaultValue={defaults.seasonTitle.offsetY} min={-400} max={400} step={0.5} unit="px" onChange={(v) => updateSeasonTitle({ offsetY: v })} />
        <SettingRow label="Scale" value={seasonTitle.scale} defaultValue={defaults.seasonTitle.scale} min={0.2} max={3} step={0.01} onChange={(v) => updateSeasonTitle({ scale: v })} />
        <label className="drawer-field">
          <span>Front color</span>
          <input type="color" value={seasonTitle.frontColor} onChange={(e) => updateSeasonTitle({ frontColor: e.target.value })} />
          <button type="button" className="setting-reset" title="Reset to default" onClick={() => updateSeasonTitle({ frontColor: defaults.seasonTitle.frontColor })}>
            ⟲
          </button>
        </label>
        <label className="drawer-field">
          <span>Echo 1 color</span>
          <input type="color" value={seasonTitle.echo1Color} onChange={(e) => updateSeasonTitle({ echo1Color: e.target.value })} />
          <button type="button" className="setting-reset" title="Reset to default" onClick={() => updateSeasonTitle({ echo1Color: defaults.seasonTitle.echo1Color })}>
            ⟲
          </button>
        </label>
        <label className="drawer-field">
          <span>Echo 2 color</span>
          <input type="color" value={seasonTitle.echo2Color} onChange={(e) => updateSeasonTitle({ echo2Color: e.target.value })} />
          <button type="button" className="setting-reset" title="Reset to default" onClick={() => updateSeasonTitle({ echo2Color: defaults.seasonTitle.echo2Color })}>
            ⟲
          </button>
        </label>
        <label className="drawer-field">
          <span>Echo 3 color</span>
          <input type="color" value={seasonTitle.echo3Color} onChange={(e) => updateSeasonTitle({ echo3Color: e.target.value })} />
          <button type="button" className="setting-reset" title="Reset to default" onClick={() => updateSeasonTitle({ echo3Color: defaults.seasonTitle.echo3Color })}>
            ⟲
          </button>
        </label>
      </CollapsibleSection>

      <div className="drawer-section">
        <h4>Elements</h4>
        {HEADER_FOOTER_ELEMENT_IDS.map((id) => {
          const style = headerFooter[id];
          const defaultStyle = defaults.headerFooter[id];
          return (
            <CollapsibleSection
              key={id}
              title={HEADER_FOOTER_ELEMENT_LABELS[id]}
              headExtra={<input type="checkbox" checked={style.visible} onChange={(e) => updateElement(id, { visible: e.target.checked })} />}
            >
              <label className="drawer-field">
                <span>Color</span>
                <input type="color" value={style.color} onChange={(e) => updateElement(id, { color: e.target.value })} />
                <button type="button" className="setting-reset" title="Reset to default" onClick={() => updateElement(id, { color: defaultStyle.color })}>
                  ⟲
                </button>
              </label>
              <SettingRow label="Position X" value={style.offsetX} defaultValue={defaultStyle.offsetX} min={-400} max={400} step={0.5} unit="px" onChange={(v) => updateElement(id, { offsetX: v })} />
              <SettingRow label="Position Y" value={style.offsetY} defaultValue={defaultStyle.offsetY} min={-400} max={400} step={0.5} unit="px" onChange={(v) => updateElement(id, { offsetY: v })} />
              <SettingRow label="Scale" value={style.scale} defaultValue={defaultStyle.scale} min={0.1} max={4} step={0.01} onChange={(v) => updateElement(id, { scale: v })} />
            </CollapsibleSection>
          );
        })}
      </div>

      <div className="drawer-footer">
        <button type="button" className="drawer-reset-all" onClick={resetAll}>
          Reset all settings to default
        </button>
        <button type="button" className="drawer-save-default" onClick={() => navigate("/defaults")}>
          Edit default settings →
        </button>
      </div>
    </div>
  );
}
