import { dropdownLabel } from "../../lib/calendarLabel";
import type { CalendarSummary } from "../../types/calendar";
import "./TopBar.css";

export interface TopBarEditorControls {
  countWarning?: string | null;
  onSettings: () => void;
  onHeaderFooter: () => void;
  onSave: () => void;
  saving: boolean;
  onDownload: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface Props {
  currentId: string;
  currentLabel: string;
  summaries: CalendarSummary[];
  onSwitch: (targetId: string) => void;
  onNew: () => void;
  onDelete: () => void;
  editor?: TopBarEditorControls;
}

/**
 * Shown on every page (start, image selection, editor) so a calendar is always reachable and
 * switchable. Editor-only controls (settings, save, download, undo/redo) are omitted elsewhere.
 */
export function TopBar({ currentId, currentLabel, summaries, onSwitch, onNew, onDelete, editor }: Props) {
  const knowsCurrentId = summaries.some((s) => s.id === currentId);

  return (
    <div className="editor-top">
      {editor && (
        <button className="icon-btn" onClick={editor.onSettings} title="Settings">
          ⚙
        </button>
      )}
      {editor && (
        <button className="icon-btn" onClick={editor.onHeaderFooter} title="Header & footer">
          🖼
        </button>
      )}
      <button className="icon-btn" onClick={onNew} title="New calendar">
        +
      </button>
      <select className="cal-select" value={currentId} onChange={(e) => onSwitch(e.target.value)}>
        {!knowsCurrentId && <option value={currentId}>{currentLabel}</option>}
        {summaries.map((s) => (
          <option key={s.id} value={s.id}>
            {dropdownLabel(s, summaries)}
          </option>
        ))}
      </select>
      <button className="icon-btn" onClick={onDelete} title="Delete this calendar">
        🗑
      </button>
      <div className="spacer" />
      {editor?.countWarning && <div className="count-warning">{editor.countWarning}</div>}
      {editor && (
        <>
          <button className="icon-btn" onClick={editor.onUndo} disabled={!editor.canUndo} title="Undo">
            ↶
          </button>
          <button className="icon-btn" onClick={editor.onRedo} disabled={!editor.canRedo} title="Redo">
            ↷
          </button>
          <button className="btn-ghost" onClick={editor.onSave} disabled={editor.saving}>
            💾 {editor.saving ? "Saving…" : "Save"}
          </button>
          <button className="btn-dl" onClick={editor.onDownload}>
            ⬇ Download PDF
          </button>
        </>
      )}
    </div>
  );
}
