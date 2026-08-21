import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import "./HexColorInput.css";

interface Props {
  value: string;
  onChange: (hex: string) => void;
  /** When given, shows a reset-to-default button. */
  defaultValue?: string;
}

function normalizeHex(raw: string): string | null {
  const cleaned = raw.trim();
  const withHash = cleaned.startsWith("#") ? cleaned : `#${cleaned}`;
  if (/^#[0-9a-fA-F]{6}$/.test(withHash)) return withHash.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    const [, r, g, b] = withHash;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

/** Native color swatch plus an editable hex text field — the standard color-picking control used everywhere in the app. */
export function HexColorInput({ value, onChange, defaultValue }: Props) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);

  function commit(raw: string) {
    const normalized = normalizeHex(raw);
    if (normalized) {
      onChange(normalized);
      setText(normalized);
    } else {
      setText(value);
    }
  }

  return (
    <div className="hex-color-input">
      <input type="color" className="hex-color-swatch" value={value} onChange={(e) => onChange(e.target.value)} />
      <input
        type="text"
        className="hex-color-text"
        value={text}
        spellCheck={false}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commit(text);
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
      {defaultValue !== undefined && (
        <button type="button" className="setting-reset" title="Reset to default" onClick={() => onChange(defaultValue)}>
          <Icon name="reset_to_default" size={13} />
        </button>
      )}
    </div>
  );
}
