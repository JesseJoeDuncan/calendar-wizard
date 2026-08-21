import { HexColorInput } from "../HexColorInput";
import { Icon } from "../Icon";
import { COLORABLE_ELEMENTS, isBuiltinCategory, nextAddedCategoryName, PALETTE_SEASONS } from "../../lib/colorPalette";
import type { ColorableElementId, ColorPalette, Season } from "../../types/calendar";
import "./PaletteEditor.css";

interface Props {
  activeSeason: Season;
  onSeasonChange: (season: Season) => void;
  palette: ColorPalette;
  onChange: (palette: ColorPalette) => void;
  /** Hides the season tab row — used when editing a single calendar's own palette, where switching season doesn't make sense. */
  lockedSeason?: boolean;
}

/**
 * The "Color Palettes" editor: one tab per season (plus Custom, for calendars with no season
 * title), each holding an independent, fully-editable ColorPalette. Every non-card/band colorable
 * element (see colorPalette.ts) is grouped under one of the palette's categories; moving an element
 * or recoloring a category updates every element that shares it at once.
 */
export function PaletteEditor({ activeSeason, onSeasonChange, palette, onChange, lockedSeason }: Props) {
  function elementsFor(categoryId: string) {
    return COLORABLE_ELEMENTS.filter((el) => palette.assignments[el.id] === categoryId);
  }

  function moveElement(elementId: ColorableElementId, currentIdx: number, dir: -1 | 1) {
    const targetCategory = palette.categories[currentIdx + dir];
    if (!targetCategory) return;
    onChange({ ...palette, assignments: { ...palette.assignments, [elementId]: targetCategory.id } });
  }

  function recolorCategory(id: string, color: string) {
    onChange({ ...palette, categories: palette.categories.map((c) => (c.id === id ? { ...c, color } : c)) });
  }

  function renameCategory(id: string, name: string) {
    onChange({ ...palette, categories: palette.categories.map((c) => (c.id === id ? { ...c, name } : c)) });
  }

  function addCategory() {
    const newCategory = { id: `custom-${Date.now()}`, name: nextAddedCategoryName(palette.categories), color: "#888888" };
    onChange({ ...palette, categories: [...palette.categories, newCategory] });
  }

  function deleteCategory(id: string) {
    const idx = palette.categories.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const fallback = palette.categories[idx - 1] ?? palette.categories.find((c) => c.id !== id);
    if (!fallback) return;
    const assignments = { ...palette.assignments };
    for (const key of Object.keys(assignments) as ColorableElementId[]) {
      if (assignments[key] === id) assignments[key] = fallback.id;
    }
    onChange({ categories: palette.categories.filter((c) => c.id !== id), assignments });
  }

  return (
    <div className="palette-editor">
      {!lockedSeason && (
        <div className="pe-tabs">
          {PALETTE_SEASONS.map((s) => (
            <button key={s} type="button" className={`pe-tab ${s === activeSeason ? "sel" : ""}`} onClick={() => onSeasonChange(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="pe-categories">
        {palette.categories.map((cat, idx) => {
          const builtin = isBuiltinCategory(cat.id);
          const elements = elementsFor(cat.id);
          return (
            <div className="pe-category" key={cat.id}>
              <div className="pe-category-head">
                {builtin ? (
                  <span className="pe-category-name">{cat.name}</span>
                ) : (
                  <input
                    type="text"
                    className="pe-category-name-input"
                    value={cat.name}
                    onChange={(e) => renameCategory(cat.id, e.target.value)}
                  />
                )}
                <HexColorInput value={cat.color} onChange={(hex) => recolorCategory(cat.id, hex)} />
                {!builtin && (
                  <button type="button" className="pe-cat-delete" title="Delete this color" onClick={() => deleteCategory(cat.id)}>
                    <Icon name="delete" size={13} />
                  </button>
                )}
              </div>
              <div className="pe-elements">
                {elements.length === 0 && <div className="pe-empty">No elements assigned</div>}
                {elements.map((el) => (
                  <div className="pe-element" key={el.id}>
                    <span>{el.label}</span>
                    <div className="pe-element-move">
                      <button type="button" disabled={idx === 0} title="Move to previous color" onClick={() => moveElement(el.id, idx, -1)}>
                        <Icon name="up" size={11} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === palette.categories.length - 1}
                        title="Move to next color"
                        onClick={() => moveElement(el.id, idx, 1)}
                      >
                        <Icon name="down" size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <button type="button" className="pe-add-color" onClick={addCategory}>
          <Icon name="add_minor" size={13} /> Add color
        </button>
      </div>
    </div>
  );
}
