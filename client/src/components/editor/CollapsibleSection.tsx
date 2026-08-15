import { useState, type ReactNode } from "react";
import "./CollapsibleSection.css";

interface Props {
  title: string;
  /** Rendered before the caret, inline with the title — e.g. a visibility checkbox. */
  headExtra?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

/** A single collapsible group used throughout the settings/details panels to keep less-common controls out of the way until asked for. */
export function CollapsibleSection({ title, headExtra, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="cs-section">
      <button type="button" className="cs-head" onClick={() => setOpen((o) => !o)}>
        {headExtra && (
          <span className="cs-head-extra" onClick={(e) => e.stopPropagation()}>
            {headExtra}
          </span>
        )}
        <span className="cs-title">{title}</span>
        <span className="cs-caret">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="cs-body">{children}</div>}
    </div>
  );
}
