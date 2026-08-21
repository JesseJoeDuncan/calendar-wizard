import { useState } from "react";
import { SettingRow } from "../SettingRow";
import { Icon } from "../Icon";
import type { Calendar } from "../../types/calendar";
import { DEFAULT_AUTOSAVE_MINUTES, getAutoSaveMinutes, getDefaultTheme, setAutoSaveMinutes } from "../../lib/userDefaults";
import { CollapsibleSection } from "./CollapsibleSection";
import "./SettingsDrawer.css";

interface Props {
  calendar: Calendar;
  onChange: (patch: Partial<Calendar>) => void;
  onClose: () => void;
  onAutoSaveMinutesChange?: (minutes: number) => void;
  onOpenDefaultSettings: () => void;
}

/** Spacing, date text sizing, and corner rounding for this calendar — the layout half of what used to be a single Settings drawer. */
export function LayoutMenu({ calendar, onChange, onClose, onAutoSaveMinutesChange, onOpenDefaultSettings }: Props) {
  const { theme } = calendar;
  const defaults = getDefaultTheme(calendar.season);
  const [autoSaveMinutes, setAutoSaveMinutesState] = useState(getAutoSaveMinutes());

  function updateSpacing(patch: Partial<typeof theme.spacing>) {
    onChange({ theme: { ...theme, spacing: { ...theme.spacing, ...patch } } });
  }

  function resetAll() {
    if (!window.confirm("Reset this calendar's spacing, date text, and corner rounding back to the default values?")) return;
    onChange({ theme: { ...theme, spacing: defaults.spacing } });
  }

  function changeAutoSave(minutes: number) {
    setAutoSaveMinutesState(minutes);
    setAutoSaveMinutes(minutes);
    onAutoSaveMinutesChange?.(minutes);
  }

  return (
    <div className="side-panel">
      <div className="drawer-head">
        <h3>Layout</h3>
        <button className="del-btn" onClick={onClose} title="Close">
          <Icon name="close_window" />
        </button>
      </div>

      <CollapsibleSection title="Spacing" defaultOpen>
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
          label="Rows height"
          value={theme.spacing.rowsHeightScale}
          defaultValue={defaults.spacing.rowsHeightScale}
          min={0.8}
          max={1}
          step={0.01}
          onChange={(v) => updateSpacing({ rowsHeightScale: v })}
        />
        <SettingRow
          label="Tag height"
          value={theme.spacing.bandHeightRatio}
          defaultValue={defaults.spacing.bandHeightRatio}
          min={0.08}
          max={0.28}
          step={0.01}
          onChange={(v) => updateSpacing({ bandHeightRatio: v })}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Date text">
        <SettingRow
          label="Number size"
          value={theme.spacing.dateNumberSizePct}
          defaultValue={defaults.spacing.dateNumberSizePct}
          min={0.15}
          max={0.6}
          step={0.01}
          onChange={(v) => updateSpacing({ dateNumberSizePct: v })}
        />
        <SettingRow
          label="Month size"
          value={theme.spacing.dateMonthSizePct}
          defaultValue={defaults.spacing.dateMonthSizePct}
          min={0.03}
          max={0.2}
          step={0.01}
          onChange={(v) => updateSpacing({ dateMonthSizePct: v })}
        />
        <SettingRow
          label="Month/number gap"
          value={theme.spacing.dateMonthGap}
          defaultValue={defaults.spacing.dateMonthGap}
          min={-20}
          max={20}
          unit="px"
          onChange={(v) => updateSpacing({ dateMonthGap: v })}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Corner rounding">
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
      </CollapsibleSection>

      <div className="drawer-section">
        <h4>Auto-save</h4>
        <SettingRow label="Interval" value={autoSaveMinutes} defaultValue={DEFAULT_AUTOSAVE_MINUTES} min={1} max={30} unit="min" onChange={changeAutoSave} />
      </div>

      <div className="drawer-footer">
        <button type="button" className="drawer-reset-all" onClick={resetAll}>
          <Icon name="reset_all_to_default" size={14} /> Reset all settings to default
        </button>
        <button type="button" className="drawer-save-default" onClick={onOpenDefaultSettings}>
          <Icon name="defaults_menu" size={14} /> Edit default settings
        </button>
      </div>
    </div>
  );
}
