import { useState } from "react";
import { SettingRow } from "../SettingRow";
import type { Calendar } from "../../types/calendar";
import { DEFAULT_AUTOSAVE_MINUTES, getAutoSaveMinutes, getDefaultTheme, saveAsDefaultTheme, setAutoSaveMinutes } from "../../lib/userDefaults";
import "./SettingsDrawer.css";

interface Props {
  calendar: Calendar;
  onChange: (patch: Partial<Calendar>) => void;
  onClose: () => void;
  onAutoSaveMinutesChange: (minutes: number) => void;
}

export function SettingsDrawer({ calendar, onChange, onClose, onAutoSaveMinutesChange }: Props) {
  const { theme } = calendar;
  const defaults = getDefaultTheme();
  const [autoSaveMinutes, setAutoSaveMinutesState] = useState(getAutoSaveMinutes());
  const [savedFlash, setSavedFlash] = useState(false);

  function updateTheme(patch: Partial<typeof theme>) {
    onChange({ theme: { ...theme, ...patch } });
  }

  function updateSpacing(patch: Partial<typeof theme.spacing>) {
    onChange({ theme: { ...theme, spacing: { ...theme.spacing, ...patch } } });
  }

  function resetAll() {
    if (!window.confirm("Reset all settings on this calendar back to the default values?")) return;
    onChange({ theme: defaults });
  }

  function saveAsDefault() {
    if (!window.confirm("Save this calendar's current settings as the default for new calendars? This replaces your existing saved default.")) return;
    saveAsDefaultTheme(theme);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  }

  function changeAutoSave(minutes: number) {
    setAutoSaveMinutesState(minutes);
    setAutoSaveMinutes(minutes);
    onAutoSaveMinutesChange(minutes);
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <h3>Settings</h3>
          <button className="del-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="drawer-section">
          <h4>Colors</h4>
          <label className="drawer-field">
            <span>Background</span>
            <input type="color" value={theme.background.value} onChange={(e) => updateTheme({ background: { type: "color", value: e.target.value } })} />
          </label>
        </div>

        <div className="drawer-section">
          <h4>Layout &amp; spacing</h4>
          <SettingRow label="Outer margin" value={theme.spacing.outerMargin} defaultValue={defaults.spacing.outerMargin} min={0} max={80} unit="px" onChange={(v) => updateSpacing({ outerMargin: v })} />
          <SettingRow label="Box gutter" value={theme.spacing.boxGutter} defaultValue={defaults.spacing.boxGutter} min={0} max={40} unit="px" onChange={(v) => updateSpacing({ boxGutter: v })} />
          <SettingRow
            label="Intra-series box gutter"
            value={theme.spacing.seriesBoxGutter}
            defaultValue={defaults.spacing.seriesBoxGutter}
            min={0}
            max={40}
            unit="px"
            onChange={(v) => updateSpacing({ seriesBoxGutter: v })}
          />
          <SettingRow label="Row gap" value={theme.spacing.rowGap} defaultValue={defaults.spacing.rowGap} min={0} max={60} unit="px" onChange={(v) => updateSpacing({ rowGap: v })} />
          <SettingRow
            label="Band height"
            value={theme.spacing.bandHeightRatio}
            defaultValue={defaults.spacing.bandHeightRatio}
            min={0.08}
            max={0.28}
            step={0.01}
            onChange={(v) => updateSpacing({ bandHeightRatio: v })}
          />
        </div>

        <div className="drawer-section">
          <h4>Date text</h4>
          <SettingRow
            label="Date number size"
            value={theme.spacing.dateNumberSizePct}
            defaultValue={defaults.spacing.dateNumberSizePct}
            min={0.15}
            max={0.6}
            step={0.01}
            onChange={(v) => updateSpacing({ dateNumberSizePct: v })}
          />
          <SettingRow
            label="Date month size"
            value={theme.spacing.dateMonthSizePct}
            defaultValue={defaults.spacing.dateMonthSizePct}
            min={0.03}
            max={0.2}
            step={0.01}
            onChange={(v) => updateSpacing({ dateMonthSizePct: v })}
          />
        </div>

        <div className="drawer-section">
          <h4>Corner rounding</h4>
          <SettingRow
            label="Primary (free corners)"
            value={theme.spacing.primaryRadius}
            defaultValue={defaults.spacing.primaryRadius}
            min={0}
            max={60}
            unit="px"
            onChange={(v) => updateSpacing({ primaryRadius: v })}
          />
          <SettingRow
            label="Secondary (intra-series)"
            value={theme.spacing.secondaryRadius}
            defaultValue={defaults.spacing.secondaryRadius}
            min={0}
            max={60}
            unit="px"
            onChange={(v) => updateSpacing({ secondaryRadius: v })}
          />
          <SettingRow
            label="Tertiary (meets band)"
            value={theme.spacing.tertiaryRadius}
            defaultValue={defaults.spacing.tertiaryRadius}
            min={0}
            max={60}
            unit="px"
            onChange={(v) => updateSpacing({ tertiaryRadius: v })}
          />
        </div>

        <div className="drawer-section">
          <h4>Card &amp; band shadow</h4>
          <label className="drawer-field">
            <span>Enabled</span>
            <input type="checkbox" checked={theme.cardShadow.enabled} onChange={(e) => updateTheme({ cardShadow: { ...theme.cardShadow, enabled: e.target.checked } })} />
          </label>
          <label className="drawer-field">
            <span>Color</span>
            <input type="color" value={theme.cardShadow.color} onChange={(e) => updateTheme({ cardShadow: { ...theme.cardShadow, color: e.target.value } })} />
          </label>
          <SettingRow
            label="Blur"
            value={theme.cardShadow.blur}
            defaultValue={defaults.cardShadow.blur}
            min={0}
            max={40}
            unit="px"
            disabled={!theme.cardShadow.enabled}
            onChange={(v) => updateTheme({ cardShadow: { ...theme.cardShadow, blur: v } })}
          />
          <SettingRow
            label="Opacity"
            value={theme.cardShadow.opacity}
            defaultValue={defaults.cardShadow.opacity}
            min={0}
            max={1}
            step={0.02}
            disabled={!theme.cardShadow.enabled}
            onChange={(v) => updateTheme({ cardShadow: { ...theme.cardShadow, opacity: v } })}
          />
          <SettingRow
            label="Offset X"
            value={theme.cardShadow.offsetX}
            defaultValue={defaults.cardShadow.offsetX}
            min={-20}
            max={20}
            unit="px"
            disabled={!theme.cardShadow.enabled}
            onChange={(v) => updateTheme({ cardShadow: { ...theme.cardShadow, offsetX: v } })}
          />
          <SettingRow
            label="Offset Y"
            value={theme.cardShadow.offsetY}
            defaultValue={defaults.cardShadow.offsetY}
            min={-20}
            max={20}
            unit="px"
            disabled={!theme.cardShadow.enabled}
            onChange={(v) => updateTheme({ cardShadow: { ...theme.cardShadow, offsetY: v } })}
          />
        </div>

        <div className="drawer-section">
          <h4>Auto-save</h4>
          <SettingRow label="Interval" value={autoSaveMinutes} defaultValue={DEFAULT_AUTOSAVE_MINUTES} min={1} max={30} unit="min" onChange={changeAutoSave} />
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
    </div>
  );
}
