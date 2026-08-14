import "./SettingRow.css";

interface Props {
  label: string;
  value: number;
  defaultValue: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  unit?: string;
}

/** A slider paired with a visible numeric value and a reset-to-default button. */
export function SettingRow({ label, value, defaultValue, min, max, step = 1, onChange, disabled, unit }: Props) {
  return (
    <div className="setting-row">
      <div className="setting-row-head">
        <span className="setting-row-label">{label}</span>
        <div className="setting-row-value">
          <input
            type="number"
            className="setting-num"
            value={Number.isFinite(value) ? value : 0}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          {unit && <span className="setting-unit">{unit}</span>}
          <button type="button" className="setting-reset" title="Reset to default" disabled={disabled} onClick={() => onChange(defaultValue)}>
            ⟲
          </button>
        </div>
      </div>
      <input type="range" min={min} max={max} step={step} value={Number.isFinite(value) ? value : 0} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
