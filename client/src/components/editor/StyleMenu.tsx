import { SettingRow } from "../SettingRow";
import { PaletteColorInput } from "../PaletteColorInput";
import { Icon } from "../Icon";
import { applyPaletteToTheme } from "../../lib/colorPalette";
import { TEXTURE_STYLE_OPTIONS } from "../../lib/textureTiles";
import { getDefaultTheme } from "../../lib/userDefaults";
import type { BackgroundTextureStyle, Calendar, ColorPalette } from "../../types/calendar";
import { CollapsibleSection } from "./CollapsibleSection";
import { PaletteEditor } from "./PaletteEditor";
import "./SettingsDrawer.css";

interface Props {
  calendar: Calendar;
  onChange: (patch: Partial<Calendar>) => void;
  onClose: () => void;
  onOpenDefaultSettings: () => void;
}

/** Background color/texture, card & tag shadow, and this calendar's own color palette — the style half of what used to be a single Settings drawer. */
export function StyleMenu({ calendar, onChange, onClose, onOpenDefaultSettings }: Props) {
  const { theme } = calendar;
  const defaults = getDefaultTheme(calendar.season);

  function updateTheme(patch: Partial<typeof theme>) {
    onChange({ theme: { ...theme, ...patch } });
  }

  function updatePalette(palette: ColorPalette) {
    onChange({ theme: applyPaletteToTheme(theme, palette) });
  }

  function resetAll() {
    if (!window.confirm("Reset this calendar's background, texture, shadows, and colors back to the default values?")) return;
    onChange({ theme: { ...theme, background: defaults.background, backgroundTexture: defaults.backgroundTexture, cardShadow: defaults.cardShadow, palette: defaults.palette } });
  }

  return (
    <div className="side-panel">
      <div className="drawer-head">
        <h3>Style</h3>
        <button className="del-btn" onClick={onClose} title="Close">
          <Icon name="close_window" />
        </button>
      </div>

      <div className="drawer-section">
        <h4>Colors</h4>
        <PaletteColorInput
          label="Background"
          value={theme.background.value}
          onChange={(hex) => updateTheme({ background: { ...theme.background, type: "color", value: hex } })}
          palette={theme.palette}
        />
      </div>

      <CollapsibleSection title="Background Texture" icon="background_or_texture">
        <label className="drawer-field">
          <span><Icon name="special_effect" size={13} title="Texture Style" /> Texture Style</span>
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
          icon="opacity"
          value={theme.backgroundTexture.opacity}
          defaultValue={defaults.backgroundTexture.opacity}
          min={0}
          max={1}
          step={0.02}
          disabled={theme.backgroundTexture.style === "none"}
          onChange={(v) => updateTheme({ backgroundTexture: { ...theme.backgroundTexture, opacity: v } })}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Cards & Tags Shadow"
        icon="dropshadow"
        headExtra={<input type="checkbox" checked={theme.cardShadow.enabled} onChange={(e) => updateTheme({ cardShadow: { ...theme.cardShadow, enabled: e.target.checked } })} />}
      >
        <label className="drawer-field">
          <span>Color</span>
          <input type="color" value={theme.cardShadow.color} onChange={(e) => updateTheme({ cardShadow: { ...theme.cardShadow, color: e.target.value } })} />
        </label>
        <SettingRow
          label="Blur"
          icon="dropshadow"
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
          icon="opacity"
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
          icon="horizontal_distance"
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
          icon="vertical_distance"
          value={theme.cardShadow.offsetY}
          defaultValue={defaults.cardShadow.offsetY}
          min={-20}
          max={20}
          unit="px"
          disabled={!theme.cardShadow.enabled}
          onChange={(v) => updateTheme({ cardShadow: { ...theme.cardShadow, offsetY: v } })}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Color Palette" icon="color_palette" defaultOpen>
        <PaletteEditor activeSeason={calendar.season} onSeasonChange={() => {}} palette={theme.palette} onChange={updatePalette} lockedSeason />
      </CollapsibleSection>

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
