import { useState, type ReactNode } from "react";
import { Icon, type IconName } from "../Icon";
import "./CollapsibleSection.css";

interface Props {
  title: string;
  /** Icon shown inside the header, before the title text. */
  icon?: IconName;
  /** Alternative to `icon` for cases with no matching IconName — e.g. a scaled-down thumbnail of the actual asset. */
  iconNode?: ReactNode;
  /** Rendered outside the section's own bordered box, to its left — e.g. a visibility toggle. */
  headExtra?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

/** A single collapsible group used throughout the settings/details panels to keep less-common controls out of the way until asked for. */
export function CollapsibleSection({ title, icon, iconNode, headExtra, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="cs-row">
      {headExtra && (
        <span className="cs-head-extra" onClick={(e) => e.stopPropagation()}>
          {headExtra}
        </span>
      )}
      <div className="cs-section">
        <button type="button" className="cs-head" onClick={() => setOpen((o) => !o)}>
          {icon && <Icon name={icon} size={13} />}
          {iconNode}
          <span className="cs-title">{title}</span>
          <span className="cs-caret">{open ? "▾" : "▸"}</span>
        </button>
        {open && <div className="cs-body">{children}</div>}
      </div>
    </div>
  );
}
