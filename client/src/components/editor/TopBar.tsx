import type Konva from "konva";
import { CalendarSwitcher } from "./CalendarSwitcher";
import { ExportMenu } from "./ExportMenu";
import { ThemeSwitch } from "./ThemeSwitch";
import type { CalendarSummary } from "../../types/calendar";
import { Icon } from "../Icon";
import "./TopBar.css";

export interface TopBarEditorControls {
  countWarning?: string | null;
  onLayoutMenu: () => void;
  onStyleMenu: () => void;
  onHeaderFooter: () => void;
  onSave: () => void;
  saving: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  stageRef: React.RefObject<Konva.Stage | null>;
  exportFilenameBase: string;
}

interface Props {
  currentId: string;
  currentLabel: string;
  summaries: CalendarSummary[];
  onSwitch: (targetId: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onOpenDefaultSettings?: () => void;
  editor?: TopBarEditorControls;
}

/**
 * Shown on every page (start, image selection, editor) so a calendar is always reachable and
 * switchable. Left-justified: brand + default settings + new calendar + the calendar switcher
 * (which itself carries per-calendar duplicate/rename/delete). Center-justified: the three editor
 * menus, tinted so they read as primary navigation. Right-justified: theme switch, then
 * editor-only undo/redo/save/export.
 */
export function TopBar({ currentId, currentLabel, summaries, onSwitch, onNew, onDelete, onDuplicate, onRename, onOpenDefaultSettings, editor }: Props) {
  return (
    <div className="editor-top">
      <div className="tb-zone tb-left">
        <img className="tb-logo" src="/assets/logos/CalWiz_LOGO.png" alt="Calendar Wizard" />
        {onOpenDefaultSettings && (
          <button className="icon-btn" onClick={onOpenDefaultSettings} title="Default settings">
            <Icon name="defaults_menu" size={22} />
          </button>
        )}
        <button className="icon-btn" onClick={onNew} title="New calendar">
          <Icon name="new_calendar" size={22} />
        </button>
        <CalendarSwitcher currentId={currentId} currentLabel={currentLabel} summaries={summaries} onSwitch={onSwitch} onDuplicate={onDuplicate} onRename={onRename} onDelete={onDelete} />
      </div>

      <div className="tb-zone tb-center">
        {editor && (
          <>
            <button className="tb-center-btn tb-tint-a" onClick={editor.onLayoutMenu} title="Layout">
              <Icon name="layout" size={20} /> Layout
            </button>
            <button className="tb-center-btn tb-tint-b" onClick={editor.onStyleMenu} title="Style">
              <Icon name="colors_menu" size={20} /> Style
            </button>
            <button className="tb-center-btn tb-tint-c" onClick={editor.onHeaderFooter} title="Header & footer">
              <Icon name="header_footer_menu" size={20} /> Header &amp; Footer
            </button>
          </>
        )}
      </div>

      <div className="tb-zone tb-right">
        {editor?.countWarning && (
          <div className="count-warning">
            <Icon name="warning" size={16} /> {editor.countWarning}
          </div>
        )}
        <ThemeSwitch />
        {editor && (
          <>
            <button className="icon-btn" onClick={editor.onUndo} disabled={!editor.canUndo} title="Undo">
              <Icon name="undo" size={22} />
            </button>
            <button className="icon-btn" onClick={editor.onRedo} disabled={!editor.canRedo} title="Redo">
              <Icon name="redo" size={22} />
            </button>
            <button className="btn-ghost" onClick={editor.onSave} disabled={editor.saving}>
              <Icon name="save" size={20} /> {editor.saving ? "Saving…" : "Save"}
            </button>
            <ExportMenu stageRef={editor.stageRef} filenameBase={editor.exportFilenameBase} />
          </>
        )}
      </div>
    </div>
  );
}
