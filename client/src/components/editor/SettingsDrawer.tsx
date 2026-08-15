import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SettingRow } from "../SettingRow";
import { PaletteColorInput } from "../PaletteColorInput";
import type { BackgroundTextureStyle, Calendar, ColorPalette, Season } from "../../types/calendar";
import { applyPaletteToTheme } from "../../lib/colorPalette";
import { TEXTURE_STYLE_OPTIONS } from "../../lib/textureTiles";
import { DEFAULT_AUTOSAVE_MINUTES, getAutoSaveMinutes, getDefaultTheme, setAutoSaveMinutes } from "../../lib/userDefaults";
import { CollapsibleSection } from "./CollapsibleSection";
import { PaletteEditor } from "./PaletteEditor";
import "./SettingsDrawer.css";

interface Props {
  calendar: Calendar;
  onChange: (patch: Partial<Calendar>) => void;
  onClose: () => void;
  onAutoSaveMinutesChange?: (minutes: number) => void;
  /**
   * "editor" (default): normal per-calendar settings, with auto-save and a footer linking to the
   * Default Settings page. "defaults": used from the Default Settings page itself, where
   * auto-save (a global preference, not a calendar default) and that footer don't apply — the
   * page's own header provides the equivalent save/reset actions, and the simple background color
   * field is replaced by the full Color Palettes editor (activeSeason/onSeasonChange, required here).
   */
  variant?: "editor" | "defaults";
  activeSeason?: Season;
  onSeasonChange?: (season: Season) => void;
}

export function SettingsDrawer({ calendar, onChange, onClose, onAutoSaveMinutesChange, variant = "editor", activeSeason, onSeasonChange }: Props) {
  const { theme } = calendar;
  const defaults = getDefaultTheme(calendar.season);
  const navigate = useNavigate();
  const [autoSaveMinutes, setAutoSaveMinutesState] = useState(getAutoSaveMinutes());

  function updateTheme(patch: Partial<typeof theme>) {
    onChange({ theme: { ...theme, ...patch } });
  }

  function updateSpacing(patch: Partial<typeof theme.spacing>) {
    onChange({ theme: { ...theme, spacing: { ...theme.spacing, ...patch } } });
  }

  function updatePalette(palette: ColorPalette) {
    onChange({ theme: applyPaletteToTheme(theme, palette) });
  }

  function resetAll() {
    if (!window.confirm("Reset all settings on this calendar back to the default values?")) return;
    onChange({ theme: defaults });
  }

  function changeAutoSave(minutes: number) {
    setAutoSaveMinutesState(minutes);
    setAutoSaveMinutes(minutes);
    onAutoSaveMinutesChange?.(minutes);
  }

  return (
    <div className="side-panel">
      <div className="drawer-head">
        <h3>Settings</h3>
        <button className="del-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      {variant === "defaults" ? (
        <CollapsibleSection title="Color Palettes" defaultOpen>
          <PaletteEditor
            activeSeason={activeSeason ?? "Summer"}
            onSeasonChange={(s) => onSeasonChange?.(s)}
            palette={theme.palette}
            onChange={updatePalette}
          />
        </CollapsibleSection>
      ) : (
        <div className="drawer-section">
          <h4>Colors</h4>
          <PaletteColorInput
            label="Background"
            value={theme.background.value}
            onChange={(hex) => updateTheme({ background: { ...theme.background, type: "color", value: hex } })}
            palette={theme.palette}
          />
        </div>
      )}

      <CollapsibleSection title="Background Texture">
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
          defaultValue={defaults.backgroundTexture.opacity}
          min={0}
          max={1}
          step={0.02}
          disabled={theme.backgroundTexture.style === "none"}
          onChange={(v) => updateTheme({ backgroundTexture: { ...theme.backgroundTexture, opacity: v } })}
        />
      </CollapsibleSection>

        <CollapsibleSection title="Layout & spacing" defaultOpen>
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
            label="Band height"
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

        <CollapsibleSection
          title="Card & band shadow"
          headExtra={<input type="checkbox" checked={theme.cardShadow.enabled} onChange={(e) => updateTheme({ cardShadow: { ...theme.cardShadow, enabled: e.target.checked } })} />}
        >
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
        </CollapsibleSection>

        {variant === "editor" && (
          <>
            <div className="drawer-section">
              <h4>Auto-save</h4>
              <SettingRow label="Interval" value={autoSaveMinutes} defaultValue={DEFAULT_AUTOSAVE_MINUTES} min={1} max={30} unit="min" onChange={changeAutoSave} />
            </div>

            <div className="drawer-footer">
              <button type="button" className="drawer-reset-all" onClick={resetAll}>
                Reset all settings to default
              </button>
              <button type="button" className="drawer-save-default" onClick={() => navigate("/defaults")}>
                Edit default settings →
              </button>
            </div>
          </>
        )}
    </div>
  );
}
