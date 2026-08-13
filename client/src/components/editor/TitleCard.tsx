import type { Series, Title } from "../../types/calendar";
import "./TitleCard.css";

interface Props {
  title: Title;
  series: Series[];
  onChange: (next: Title) => void;
  onSeriesChange: (seriesId: string | undefined) => void;
  onOpenDetails: () => void;
}

export function TitleCard({ title, series, onChange, onSeriesChange, onOpenDetails }: Props) {
  const swatchUrl = title.image?.cutoutUrl || title.image?.url;

  return (
    <div className="title-card">
      <input className="tc-name" value={title.name} onChange={(e) => onChange({ ...title, name: e.target.value })} placeholder="Title" />
      <div className="tc-row">
        {swatchUrl ? <img className="tc-swatch" src={swatchUrl} alt="" /> : <div className="tc-swatch tc-swatch-empty" />}
        <input
          className="tc-mini-field tc-runtime"
          type="number"
          min={0}
          value={title.runtimeMinutes ?? ""}
          onChange={(e) => onChange({ ...title, runtimeMinutes: Number(e.target.value) || undefined })}
          placeholder="min"
        />
        <span className="tc-unit">min</span>
      </div>
      <div className="tc-row">
        <select className="tc-mini-field" value={title.seriesId ?? ""} onChange={(e) => onSeriesChange(e.target.value || undefined)}>
          <option value="">No series</option>
          {series.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name || "Untitled series"}
            </option>
          ))}
        </select>
      </div>
      <button className="tc-details-btn" onClick={onOpenDetails}>
        Details
      </button>
    </div>
  );
}
