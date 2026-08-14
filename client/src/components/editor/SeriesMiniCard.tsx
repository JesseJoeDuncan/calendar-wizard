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
  const words = series.name.split(/\s+/).filter(Boolean);

  function updateStyle(patch: Partial<Series["bandStyle"]>) {
    onChange({ ...series, bandStyle: { ...series.bandStyle, ...patch } });
  }

  function updateWordSize(index: number, size: number) {
    const next = words.map((_, i) => series.bandStyle.wordSizes?.[i] ?? series.bandStyle.fontSize);
    next[index] = size;
    updateStyle({ wordSizes: next });
  }

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
              onChange={(e) => updateStyle({ background: { type: "color", value: e.target.value } })}
            />
          </label>
          <label className="sm-field">
            <span>Text color</span>
            <input type="color" value={series.bandStyle.textColor} onChange={(e) => updateStyle({ textColor: e.target.value })} />
          </label>
          <label className="sm-field">
            <span>Font</span>
            <select value={series.bandStyle.fontFamily} onChange={(e) => updateStyle({ fontFamily: e.target.value })}>
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
          <label className="sm-field">
            <span>Base size</span>
            <div className="sm-num-row">
              <input type="range" min={6} max={40} step={0.1} value={series.bandStyle.fontSize} onChange={(e) => updateStyle({ fontSize: Number(e.target.value) })} />
              <input type="number" className="sm-num" step={0.1} value={series.bandStyle.fontSize} onChange={(e) => updateStyle({ fontSize: Number(e.target.value) })} />
            </div>
          </label>
          <label className="sm-field">
            <span>Kerning</span>
            <input type="range" min={-4} max={12} step={0.1} value={series.bandStyle.kerning} onChange={(e) => updateStyle({ kerning: Number(e.target.value) })} />
          </label>
          <div className="sm-field">
            <span>Justify</span>
            <div className="sm-just-row">
              {(["left", "center", "right"] as const).map((j) => (
                <button
                  key={j}
                  type="button"
                  className={`sm-just-btn ${series.bandStyle.justify === j ? "sel" : ""}`}
                  onClick={() => updateStyle({ justify: j })}
                >
                  {j === "left" ? "◧" : j === "right" ? "◨" : "▦"}
                </button>
              ))}
            </div>
          </div>
          <label className="sm-field">
            <span>Position X</span>
            <input type="range" min={-100} max={100} step={0.5} value={series.bandStyle.offsetX} onChange={(e) => updateStyle({ offsetX: Number(e.target.value) })} />
          </label>
          <label className="sm-field">
            <span>Position Y</span>
            <input type="range" min={-40} max={40} step={0.5} value={series.bandStyle.offsetY} onChange={(e) => updateStyle({ offsetY: Number(e.target.value) })} />
          </label>

          {words.length > 1 && (
            <div className="sm-word-sizes">
              <div className="sm-word-head">
                <span>Per-word size</span>
                <button type="button" className="sm-link-btn" onClick={() => updateStyle({ wordSizes: undefined })}>
                  Reset all
                </button>
              </div>
              {words.map((word, i) => (
                <label className="sm-field" key={i}>
                  <span className="sm-word-label" title={word}>
                    {word}
                  </span>
                  <input
                    type="range"
                    min={6}
                    max={60}
                    step={0.1}
                    value={series.bandStyle.wordSizes?.[i] ?? series.bandStyle.fontSize}
                    onChange={(e) => updateWordSize(i, Number(e.target.value))}
                  />
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
