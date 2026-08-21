import { useRef } from "react";
import { HexColorInput } from "./HexColorInput";
import { Icon } from "./Icon";
import { SettingRow } from "./SettingRow";
import { api } from "../lib/api";
import type { CustomElementStyle } from "../types/calendar";
import "./CustomElementEditor.css";

const FONT_OPTIONS = ["Futura Wizard", "Futura Wizard Condensed", "Market Deco"];

interface Props {
  element: CustomElementStyle;
  onChange: (patch: Partial<CustomElementStyle>) => void;
  onRemove: () => void;
  /** Max absolute offsetX/offsetY for the position sliders — header/footer needs a much wider range than a single card. */
  offsetRange: number;
}

/** The editor controls for one freeform custom text/image element — meant to be rendered as a CollapsibleSection's body, shared by DetailsPanel (per-card) and HeaderFooterDrawer (header/footer). */
export function CustomElementEditor({ element, onChange, onRemove, offsetRange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    const localUrl = URL.createObjectURL(file);
    try {
      const { url } = await api.uploadImage(file);
      onChange({ imageUrl: url });
    } catch (err) {
      console.error(err);
      onChange({ imageUrl: localUrl });
    }
  }

  return (
    <div className="ce-editor">
      {element.kind === "text" ? (
        <>
          <input
            className="field-input"
            type="text"
            placeholder="Text"
            value={element.text ?? ""}
            onChange={(e) => onChange({ text: e.target.value })}
          />
          <label className="drawer-field">
            <span title="Font"><Icon name="font" size={13} /></span>
            <select value={element.fontFamily ?? FONT_OPTIONS[0]} onChange={(e) => onChange({ fontFamily: e.target.value })}>
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
          <HexColorInput value={element.color ?? "#000000"} onChange={(hex) => onChange({ color: hex })} />
          <SettingRow label="Text size" icon="text_size" value={element.fontSize ?? 16} defaultValue={16} min={4} max={120} step={0.5} onChange={(v) => onChange({ fontSize: v })} />
          <SettingRow label="Kerning" icon="kerning" value={element.kerning ?? 0} defaultValue={0} min={-4} max={12} step={0.1} onChange={(v) => onChange({ kerning: v })} />
        </>
      ) : (
        <div className="ce-image-row">
          {element.imageUrl && <img className="ce-thumb" src={element.imageUrl} alt="" />}
          <button type="button" className="link-btn" onClick={() => fileInputRef.current?.click()}>
            <Icon name="upload_image" size={14} /> {element.imageUrl ? "Replace image" : "Upload image"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
        </div>
      )}

      <SettingRow label="Position X" icon="horizontal_distance" value={element.offsetX} defaultValue={0} min={-offsetRange} max={offsetRange} step={0.5} unit="px" onChange={(v) => onChange({ offsetX: v })} />
      <SettingRow label="Position Y" icon="vertical_distance" value={element.offsetY} defaultValue={0} min={-offsetRange} max={offsetRange} step={0.5} unit="px" onChange={(v) => onChange({ offsetY: v })} />
      <SettingRow label="Scale" icon="scale" value={element.scale} defaultValue={1} min={0.1} max={4} step={0.01} onChange={(v) => onChange({ scale: v })} />

      <button type="button" className="ce-remove" onClick={onRemove}>
        <Icon name="delete" size={13} /> Remove this element
      </button>
    </div>
  );
}
