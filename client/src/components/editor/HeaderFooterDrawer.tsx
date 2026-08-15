import { useState } from "react";
import { SettingRow } from "../SettingRow";
import { HEADER_FOOTER_ELEMENT_IDS, HEADER_FOOTER_ELEMENT_LABELS, defaultHeaderFooter } from "../../lib/headerFooterLayout";
import { getDefaultTheme, saveAsDefaultTheme } from "../../lib/userDefaults";
import type { Calendar, CalendarHeaderFooter, FooterShapeVariant, HeaderFooterElementId, HeaderFooterElementStyle } from "../../types/calendar";
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
  const { headerFooter } = calendar.theme;
  const defaults = getDefaultTheme().headerFooter;
  const [savedFlash, setSavedFlash] = useState(false);
  const [openId, setOpenId] = useState<HeaderFooterElementId | null>(null);

  function updateHeaderFooter(patch: Partial<CalendarHeaderFooter>) {
    onChange({ theme: { ...calendar.theme, headerFooter: { ...headerFooter, ...patch } } });
  }

  function updateElement(id: HeaderFooterElementId, patch: Partial<HeaderFooterElementStyle>) {
    updateHeaderFooter({ [id]: { ...headerFooter[id], ...patch } });
  }

  function resetAll() {
    if (!window.confirm("Reset all header/footer settings on this calendar back to the default values?")) return;
    onChange({ theme: { ...calendar.theme, headerFooter: defaultHeaderFooter() } });
  }

  function saveAsDefault() {
    if (!window.confirm("Save this calendar's current header/footer settings as the default for new calendars? This replaces your existing saved default.")) return;
    saveAsDefaultTheme(calendar.theme);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  }

  return (
    <div className="hf-panel">
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

      <div className="drawer-section">
        <h4>Elements</h4>
        {HEADER_FOOTER_ELEMENT_IDS.map((id) => {
          const style = headerFooter[id];
          const defaultStyle = defaults[id];
          const open = openId === id;
          return (
            <div className="hf-element" key={id}>
              <button type="button" className="hf-element-head" onClick={() => setOpenId(open ? null : id)}>
                <label className="hf-visible" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={style.visible} onChange={(e) => updateElement(id, { visible: e.target.checked })} />
                </label>
                <span className="hf-element-label">{HEADER_FOOTER_ELEMENT_LABELS[id]}</span>
                <span className="hf-caret">{open ? "▾" : "▸"}</span>
              </button>
              {open && (
                <div className="hf-element-body">
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
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="drawer-footer">
        <button type="button" className="drawer-reset-all" onClick={resetAll}>
          Reset all settings to default
        </button>
        <button type="button" className="drawer-save-default" onClick={saveAsDefault}>
          {savedFlash ? "Saved ✓" : "Save as default"}
        </button>
      </div>
    </div>
  );
}
