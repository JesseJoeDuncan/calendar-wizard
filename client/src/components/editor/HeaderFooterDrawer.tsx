import { SettingRow } from "../SettingRow";
import { PaletteColorInput } from "../PaletteColorInput";
import { Icon, type IconName } from "../Icon";
import { VisibilityToggle } from "../VisibilityToggle";
import { CustomElementEditor } from "../CustomElementEditor";
import { HEADER_FOOTER_ELEMENT_IDS, HEADER_FOOTER_ELEMENT_LABELS, getElementAnchor, defaultHeaderFooter, defaultSeasonTitleStyle } from "../../lib/headerFooterLayout";
import { nextId } from "../../lib/draftTypes";
import { getDefaultTheme } from "../../lib/userDefaults";
import type { Calendar, CalendarHeaderFooter, CustomElementKind, EchoLayerStyle, FooterShapeVariant, HeaderFooterElementId, HeaderFooterElementStyle, SeasonTitleStyle } from "../../types/calendar";
import { CollapsibleSection } from "./CollapsibleSection";
import "./SettingsDrawer.css";
import "./HeaderFooterDrawer.css";

/** Elements whose icon is a scaled-down thumbnail of the actual brand asset, since a generic glyph would be indistinguishable from the others. */
const THUMBNAIL_ICON_IDS = new Set<HeaderFooterElementId>(["onyxLogo", "nevadaTheatreLogo", "qrCode", "qrArrow"]);

function iconForElement(id: HeaderFooterElementId): IconName {
  if (id === "footerShape") return "background_or_texture";
  return "text_element";
}

interface Props {
  calendar: Calendar;
  onChange: (patch: Partial<Calendar>) => void;
  onClose?: () => void;
  /**
   * "editor" (default): normal per-calendar settings — every color here is a plain override with
   * this calendar's own palette offered as quick-pick swatches. "defaults": used from the Default
   * Settings modal, where colors are governed entirely by the Color Palettes editor instead, so the
   * color fields here are hidden (position/scale/echo-spread stay editable either way).
   */
  variant?: "editor" | "defaults";
  /** True when embedded inside the Default Settings modal's own panel chrome — skips this component's own title bar/close button/footer. */
  embedded?: boolean;
  onOpenDefaultSettings?: () => void;
}

const FOOTER_SHAPE_OPTIONS: { value: FooterShapeVariant; label: string }[] = [
  { value: "bumps", label: "Bumps" },
  { value: "zigzags", label: "Zigzags" },
  { value: "straightline", label: "Straight line" },
];

export function HeaderFooterDrawer({ calendar, onChange, onClose, variant = "editor", embedded = false, onOpenDefaultSettings }: Props) {
  const { headerFooter, seasonTitle, palette } = calendar.theme;
  const defaults = getDefaultTheme(calendar.season);
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

  function addCustomElement(kind: CustomElementKind) {
    const count = headerFooter.customElements.filter((e) => e.kind === kind).length + 1;
    const label = kind === "text" ? `New Text Element ${count}` : `New Image ${count}`;
    updateHeaderFooter({
      customElements: [
        ...headerFooter.customElements,
        { id: nextId("custom"), kind, label, visible: true, offsetX: 0, offsetY: 0, scale: 1, ...(kind === "text" ? { text: "", fontFamily: "Futura Wizard", fontSize: 24, color: "#000000", kerning: 0 } : {}) },
      ],
    });
  }

  function updateCustomElement(id: string, patch: Partial<CalendarHeaderFooter["customElements"][number]>) {
    updateHeaderFooter({ customElements: headerFooter.customElements.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  }

  function removeCustomElement(id: string) {
    updateHeaderFooter({ customElements: headerFooter.customElements.filter((e) => e.id !== id) });
  }

  function resetAll() {
    if (!window.confirm("Reset all header/footer settings on this calendar back to the default values?")) return;
    onChange({ theme: { ...calendar.theme, headerFooter: defaultHeaderFooter(), seasonTitle: defaultSeasonTitleStyle() } });
  }

  const body = (
    <>
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
        icon="title_element"
        defaultOpen
        headExtra={<VisibilityToggle visible={seasonTitle.visible} onChange={(visible) => updateSeasonTitle({ visible })} />}
      >
        <SettingRow label="Position X" icon="horizontal_distance" value={seasonTitle.offsetX} defaultValue={defaults.seasonTitle.offsetX} min={-400} max={400} step={0.5} unit="px" onChange={(v) => updateSeasonTitle({ offsetX: v })} />
        <SettingRow label="Position Y" icon="vertical_distance" value={seasonTitle.offsetY} defaultValue={defaults.seasonTitle.offsetY} min={-400} max={400} step={0.5} unit="px" onChange={(v) => updateSeasonTitle({ offsetY: v })} />
        <SettingRow label="Scale" icon="scale" value={seasonTitle.scale} defaultValue={defaults.seasonTitle.scale} min={0.2} max={3} step={0.01} onChange={(v) => updateSeasonTitle({ scale: v })} />
        <SettingRow label="Kerning" icon="kerning" value={seasonTitle.kerning} defaultValue={defaults.seasonTitle.kerning} min={-4} max={20} step={0.5} onChange={(v) => updateSeasonTitle({ kerning: v })} />
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
              icon={THUMBNAIL_ICON_IDS.has(id) ? undefined : iconForElement(id)}
              iconNode={THUMBNAIL_ICON_IDS.has(id) ? <img className="hf-elem-thumb" src={getElementAnchor(id, headerFooter.footerShapeVariant).asset} alt="" /> : undefined}
              headExtra={<VisibilityToggle visible={style.visible} onChange={(visible) => updateElement(id, { visible })} />}
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
              <SettingRow label="Position X" icon="horizontal_distance" value={style.offsetX} defaultValue={defaultStyle.offsetX} min={-400} max={400} step={0.5} unit="px" onChange={(v) => updateElement(id, { offsetX: v })} />
              <SettingRow label="Position Y" icon="vertical_distance" value={style.offsetY} defaultValue={defaultStyle.offsetY} min={-400} max={400} step={0.5} unit="px" onChange={(v) => updateElement(id, { offsetY: v })} />
              <SettingRow label="Scale" icon="scale" value={style.scale} defaultValue={defaultStyle.scale} min={0.1} max={4} step={0.01} onChange={(v) => updateElement(id, { scale: v })} />
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

        {headerFooter.customElements.map((el) => (
          <CollapsibleSection
            key={el.id}
            title={el.label}
            icon={el.kind === "text" ? "text_element" : "image"}
            headExtra={<VisibilityToggle visible={el.visible} onChange={(visible) => updateCustomElement(el.id, { visible })} />}
          >
            <CustomElementEditor element={el} onChange={(patch) => updateCustomElement(el.id, patch)} onRemove={() => removeCustomElement(el.id)} offsetRange={400} />
          </CollapsibleSection>
        ))}

        <div className="hf-add-row">
          <button type="button" className="series-add" onClick={() => addCustomElement("text")}>
            <Icon name="add_text_element" size={14} /> Add Text Element
          </button>
          <button type="button" className="series-add" onClick={() => addCustomElement("image")}>
            <Icon name="add_image" size={14} /> Add Image
          </button>
        </div>
      </div>

      {!embedded && (
        <div className="drawer-footer">
          <button type="button" className="drawer-reset-all" onClick={resetAll}>
            <Icon name="reset_all_to_default" size={14} /> Reset all settings to default
          </button>
          <button type="button" className="drawer-save-default" onClick={onOpenDefaultSettings}>
            <Icon name="defaults_menu" size={14} /> Edit default settings
          </button>
        </div>
      )}
    </>
  );

  if (embedded) return body;

  return (
    <div className="side-panel">
      <div className="drawer-head">
        <h3>Header &amp; Footer</h3>
        <button className="del-btn" onClick={onClose} title="Close">
          <Icon name="close_window" />
        </button>
      </div>
      {body}
    </div>
  );
}
