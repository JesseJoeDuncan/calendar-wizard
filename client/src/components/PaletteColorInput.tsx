import { HexColorInput } from "./HexColorInput";
import type { ColorPalette } from "../types/calendar";
import "./PaletteColorInput.css";

interface Props {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  defaultValue?: string;
  /** The calendar's own baked-in season palette, offered as one-click swatches alongside the regular picker. */
  palette?: ColorPalette;
}

/** A HexColorInput plus quick-pick swatches for the current calendar's season color palette. */
export function PaletteColorInput({ label, value, onChange, defaultValue, palette }: Props) {
  return (
    <div className="pci">
      <div className="pci-row">
        <span className="pci-label">{label}</span>
        <HexColorInput value={value} onChange={onChange} defaultValue={defaultValue} />
      </div>
      {palette && palette.categories.length > 0 && (
        <div className="pci-swatches">
          {palette.categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`pci-swatch ${c.color.toLowerCase() === value.toLowerCase() ? "sel" : ""}`}
              style={{ background: c.color }}
              title={c.name}
              onClick={() => onChange(c.color)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
