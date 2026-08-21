import { useState } from "react";
import { dropdownLabel } from "../../lib/calendarLabel";
import type { CalendarSummary } from "../../types/calendar";
import { Icon } from "../Icon";
import "./CalendarSwitcher.css";

interface Props {
  currentId: string;
  currentLabel: string;
  summaries: CalendarSummary[];
  onSwitch: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

/** Replaces the plain calendar-select dropdown — each row carries its own duplicate/rename/delete controls, not just the current calendar's. */
export function CalendarSwitcher({ currentId, currentLabel, summaries, onSwitch, onDuplicate, onRename, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const knowsCurrentId = summaries.some((s) => s.id === currentId);
  const rows = knowsCurrentId ? summaries : [{ id: currentId, season: "Custom" as const, customName: currentLabel, year: new Date().getFullYear(), updatedAt: "", createdAt: "" }, ...summaries];

  function startRename(s: CalendarSummary) {
    setRenamingId(s.id);
    setRenameValue(s.customName ?? "");
  }

  function commitRename() {
    if (renamingId) onRename(renamingId, renameValue);
    setRenamingId(null);
  }

  return (
    <div className="cw-wrap">
      <button type="button" className="cw-trigger" onClick={() => setOpen((o) => !o)}>
        <span className="cw-trigger-label">{currentLabel}</span>
        <Icon name={open ? "up" : "down"} size={11} />
      </button>
      {open && (
        <>
          <div className="cw-backdrop" onClick={() => setOpen(false)} />
          <div className="cw-panel">
            {rows.map((s) => (
              <div className={`cw-row ${s.id === currentId ? "sel" : ""}`} key={s.id}>
                {renamingId === s.id ? (
                  <input
                    className="cw-rename-input"
                    autoFocus
                    value={renameValue}
                    placeholder={dropdownLabel(s, rows)}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    className="cw-row-label"
                    onClick={() => {
                      onSwitch(s.id);
                      setOpen(false);
                    }}
                  >
                    {dropdownLabel(s, rows)}
                  </button>
                )}
                <button type="button" className="cw-row-icon" title="Duplicate this calendar" onClick={() => onDuplicate(s.id)}>
                  <Icon name="duplicate" size={13} />
                </button>
                <button type="button" className="cw-row-icon" title="Rename this calendar" onClick={() => startRename(s)}>
                  <Icon name="edit_text" size={13} />
                </button>
                <button type="button" className="cw-row-icon" title="Delete this calendar" onClick={() => onDelete(s.id)}>
                  <Icon name="delete" size={13} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
