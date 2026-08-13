import { useState } from "react";
import type { Calendar, Series } from "../../types/calendar";
import "./SeriesMiniCard.css";

const FONT_OPTIONS = ["Futura Wizard", "Futura Wizard Condensed", "Market Deco"];

interface Props {
  series: Series;
  calendar: Calendar;
  onChange: (next: Series) => void;
}

export function SeriesMiniCard({ series, calendar, onChange }: Props) {
  const [styleOpen, setStyleOpen] = useState(false);
  const memberNames = calendar.titles.filter((t) => t.seriesId === series.id).map((t) => t.name);

  return (
    <div className="series-mini">
      <div className="sm-row">
        <input className="sm-title" value={series.name} onChange={(e) => onChange({ ...series, name: e.target.value })} />
        <button className="sm-style-btn" onClick={() => setStyleOpen((v) => !v)} title="Band style">
          🎨
        </button>
      </div>
      <div className="sm-sub">{memberNames.length ? memberNames.join(" · ") : "No titles assigned yet"}</div>

      {styleOpen && (
        <div className="sm-style-panel">
          <label className="sm-field">
            <span>Background color</span>
            <input
              type="color"
              value={series.bandStyle.background.type === "color" ? series.bandStyle.background.value : "#2f6f7a"}
              onChange={(e) => onChange({ ...series, bandStyle: { ...series.bandStyle, background: { type: "color", value: e.target.value } } })}
            />
          </label>
          <label className="sm-field">
            <span>Text color</span>
            <input
              type="color"
              value={series.bandStyle.textColor}
              onChange={(e) => onChange({ ...series, bandStyle: { ...series.bandStyle, textColor: e.target.value } })}
            />
          </label>
          <label className="sm-field">
            <span>Font</span>
            <select value={series.bandStyle.fontFamily} onChange={(e) => onChange({ ...series, bandStyle: { ...series.bandStyle, fontFamily: e.target.value } })}>
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
          <label className="sm-field">
            <span>Font size</span>
            <input
              type="range"
              min={9}
              max={22}
              value={series.bandStyle.fontSize}
              onChange={(e) => onChange({ ...series, bandStyle: { ...series.bandStyle, fontSize: Number(e.target.value) } })}
            />
          </label>
        </div>
      )}
    </div>
  );
}
