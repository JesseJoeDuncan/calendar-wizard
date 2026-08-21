import { nextId, type DraftSeries, type DraftTitle } from "../lib/draftTypes";
import { Icon } from "./Icon";
import "./SeriesEditor.css";

interface Props {
  titles: DraftTitle[];
  series: DraftSeries[];
  onChange: (series: DraftSeries[]) => void;
  onTitlesChange: (titles: DraftTitle[]) => void;
}

export function SeriesEditor({ titles, series, onChange, onTitlesChange }: Props) {
  function addSeries() {
    onChange([...series, { id: nextId("series"), name: "", titleIds: [] }]);
  }

  function updateSeries(id: string, patch: Partial<DraftSeries>) {
    onChange(series.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function removeSeries(id: string) {
    onChange(series.filter((s) => s.id !== id));
    onTitlesChange(titles.map((t) => (t.seriesId === id ? { ...t, seriesId: undefined } : t)));
  }

  function toggleTitle(seriesId: string, titleId: string, checked: boolean) {
    const s = series.find((x) => x.id === seriesId);
    if (!s) return;
    updateSeries(seriesId, {
      titleIds: checked ? [...s.titleIds, titleId] : s.titleIds.filter((id) => id !== titleId),
    });
    onTitlesChange(titles.map((t) => (t.id === titleId ? { ...t, seriesId: checked ? seriesId : undefined } : t)));
  }

  const namedTitles = titles.filter((t) => t.name.trim().length > 0);

  return (
    <div className="series-block">
      <h3>
        Series <span className="optional">(optional)</span>
      </h3>
      <p className="sub">Group titles above into a labeled run. A title can belong to at most one series.</p>

      {series.map((s) => {
        const availableTitles = namedTitles.filter((t) => !t.seriesId || t.seriesId === s.id);
        return (
          <div className="series-card" key={s.id}>
            <div className="series-card-head">
              <input
                className="series-name-input"
                type="text"
                placeholder="Series name (e.g. Studio Ghibli in July)"
                value={s.name}
                onChange={(e) => updateSeries(s.id, { name: e.target.value })}
              />
              <button type="button" className="del-btn" onClick={() => removeSeries(s.id)} aria-label={`Remove series ${s.name || "untitled"}`} title="Remove series">
                <Icon name="delete" />
              </button>
            </div>
            <div className="series-title-picker">
              {availableTitles.length === 0 && <span className="sub">Add movie titles above first.</span>}
              {availableTitles.map((t) => (
                <label key={t.id} className="title-check">
                  <input type="checkbox" checked={s.titleIds.includes(t.id)} onChange={(e) => toggleTitle(s.id, t.id, e.target.checked)} />
                  {t.name}
                </label>
              ))}
            </div>
          </div>
        );
      })}

      <button type="button" className="series-add" onClick={addSeries}>
        <Icon name="add" size={14} /> Add series
      </button>
    </div>
  );
}
