import { useNavigate } from "react-router-dom";
import { SettingRow } from "../SettingRow";
import { PaletteColorInput } from "../PaletteColorInput";
import { HEADER_FOOTER_ELEMENT_IDS, HEADER_FOOTER_ELEMENT_LABELS, defaultHeaderFooter, defaultSeasonTitleStyle } from "../../lib/headerFooterLayout";
import { getDefaultTheme } from "../../lib/userDefaults";
import type { Calendar, CalendarHeaderFooter, EchoLayerStyle, FooterShapeVariant, HeaderFooterElementId, HeaderFooterElementStyle, SeasonTitleStyle } from "../../types/calendar";
import { CollapsibleSection } from "./CollapsibleSection";
import "./SettingsDrawer.css";
import "./HeaderFooterDrawer.css";

interface Props {
  calendar: Calendar;
  onChange: (patch: Partial<Calendar>) => void;
  onClose: () => void;
  /**
   * "editor" (default): normal per-calendar settings — every color here is a plain override with
   * this calendar's own palette offered as quick-pick swatches. "defaults": used from the Default
   * Settings page, where colors are governed entirely by the Color Palettes editor instead, so the
   * color fields here are hidden (position/scale/echo-spread stay editable either way).
   */
  variant?: "editor" | "defaults";
}

const FOOTER_SHAPE_OPTIONS: { value: FooterShapeVariant; label: string }[] = [
  { value: "bumps", label: "Bumps" },
  { value: "zigzags", label: "Zigzags" },
  { value: "straightline", label: "Straight line" },
];

export function HeaderFooterDrawer({ calendar, onChange, onClose, variant = "editor" }: Props) {
  const { headerFooter, seasonTitle, palette } = calendar.theme;
  const defaults = getDefaultTheme(calendar.season);
  const navigate = useNavigate();
  const showColors = variant === "editor";

  function updateHeaderFooter(patch: Partial<CalendarHeaderFooter>) {
    onChange({ theme: { ...calendar.theme, headerFooter: { ...headerFooter, ...patch } } });
  }

  function updateElement(id: HeaderFooterElementId, patch: Partial<HeaderFooterElementStyle>) {
    updateHeaderFooter({ [id]: { ...headerFooter[id], ...patch } });
  }

  function updateElementEcho(id: HeaderFooterElementId, patch: Partial<EchoLayerStyle>) {
    const current = headerFooter[id].echo;
    if (!current) return;
    updateElement(id, { echo: { ...current, ...patch } });
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
        <SettingRow label="Echo spread" value={seasonTitle.echoSpread} defaultValue={defaults.seasonTitle.echoSpread} min={0} max={3} step={0.05} onChange={(v) => updateSeasonTitle({ echoSpread: v })} />
        {showColors && (
          <>
            <PaletteColorInput label="Front color" value={seasonTitle.frontColor} defaultValue={defaults.seasonTitle.frontColor} palette={palette} onChange={(hex) => updateSeasonTitle({ frontColor: hex })} />
            <PaletteColorInput label="Echo 1 color" value={seasonTitle.echo1Color} defaultValue={defaults.seasonTitle.echo1Color} palette={palette} onChange={(hex) => updateSeasonTitle({ echo1Color: hex })} />
            <PaletteColorInput label="Echo 2 color" value={seasonTitle.echo2Color} defaultValue={defaults.seasonTitle.echo2Color} palette={palette} onChange={(hex) => updateSeasonTitle({ echo2Color: hex })} />
            <PaletteColorInput label="Echo 3 color" value={seasonTitle.echo3Color} defaultValue={defaults.seasonTitle.echo3Color} palette={palette} onChange={(hex) => updateSeasonTitle({ echo3Color: hex })} />
          </>
        )}
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
              {showColors && (
                <PaletteColorInput
                  label={style.echo ? "Front color" : "Color"}
                  value={style.color}
                  defaultValue={defaultStyle.color}
                  palette={palette}
                  onChange={(hex) => updateElement(id, { color: hex })}
                />
              )}
              <SettingRow label="Position X" value={style.offsetX} defaultValue={defaultStyle.offsetX} min={-400} max={400} step={0.5} unit="px" onChange={(v) => updateElement(id, { offsetX: v })} />
              <SettingRow label="Position Y" value={style.offsetY} defaultValue={defaultStyle.offsetY} min={-400} max={400} step={0.5} unit="px" onChange={(v) => updateElement(id, { offsetY: v })} />
              <SettingRow label="Scale" value={style.scale} defaultValue={defaultStyle.scale} min={0.1} max={4} step={0.01} onChange={(v) => updateElement(id, { scale: v })} />
              {style.echo && defaultStyle.echo && (
                <>
                  <SettingRow
                    label="Echo spread"
                    value={style.echo.echoSpread}
                    defaultValue={defaultStyle.echo.echoSpread}
                    min={0}
                    max={3}
                    step={0.05}
                    onChange={(v) => updateElementEcho(id, { echoSpread: v })}
                  />
                  {showColors && (
                    <>
                      <PaletteColorInput
                        label="Echo 1 color"
                        value={style.echo.echo1Color}
                        defaultValue={defaultStyle.echo.echo1Color}
                        palette={palette}
                        onChange={(hex) => updateElementEcho(id, { echo1Color: hex })}
                      />
                      <PaletteColorInput
                        label="Echo 2 color"
                        value={style.echo.echo2Color}
                        defaultValue={defaultStyle.echo.echo2Color}
                        palette={palette}
                        onChange={(hex) => updateElementEcho(id, { echo2Color: hex })}
                      />
                      <PaletteColorInput
                        label="Echo 3 color"
                        value={style.echo.echo3Color}
                        defaultValue={defaultStyle.echo.echo3Color}
                        palette={palette}
                        onChange={(hex) => updateElementEcho(id, { echo3Color: hex })}
                      />
                    </>
                  )}
                </>
              )}
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
