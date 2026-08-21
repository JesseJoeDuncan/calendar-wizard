import { useEffect, useRef, useState } from "react";
import type { DraftTitle } from "../lib/draftTypes";
import { useDebouncedTmdbSearch } from "../lib/useDebouncedTmdbSearch";
import { Icon } from "./Icon";
import "./TitleRow.css";

interface Props {
  title: DraftTitle;
  index: number;
  onChange: (next: DraftTitle) => void;
  onDelete: () => void;
}

export function TitleRow({ title, index, onChange, onDelete }: Props) {
  const [query, setQuery] = useState(title.name);
  const [open, setOpen] = useState(false);

  // Keeps the input in sync when the name is set from outside this row (e.g. auto-generate) —
  // otherwise this row's own typed-echo round trip is the only thing that ever updates `query`.
  useEffect(() => {
    setQuery(title.name);
  }, [title.name]);
  const [highlight, setHighlight] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { results } = useDebouncedTmdbSearch(open ? query : "", 300);

  function selectMatch(id: number, name: string, posterUrl: string | null) {
    setQuery(name);
    onChange({ ...title, name, tmdbId: id, posterUrl });
    setOpen(false);
  }

  function handleNameChange(value: string) {
    setQuery(value);
    setHighlight(0);
    onChange({ ...title, name: value, tmdbId: undefined, posterUrl: undefined });
    setOpen(true);
  }

  return (
    <div className="title-row">
      <input
        className="date-input"
        type="date"
        value={title.date}
        onChange={(e) => onChange({ ...title, date: e.target.value })}
        aria-label={`Date for title ${index + 1}`}
      />
      <div className="title-field-wrap">
        <div className="title-field">
          {title.tmdbId && title.posterUrl ? (
            <img className="poster-mini" src={title.posterUrl} alt="" />
          ) : (
            <span className="poster-mini poster-mini-empty" aria-hidden="true" />
          )}
          <input
            className="title-input"
            type="text"
            placeholder="Movie title"
            value={query}
            onChange={(e) => handleNameChange(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              blurTimer.current = setTimeout(() => setOpen(false), 120);
            }}
            onKeyDown={(e) => {
              if (!open || results.length === 0) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlight((h) => Math.min(h + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlight((h) => Math.max(h - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const m = results[highlight];
                if (m) selectMatch(m.id, m.title, m.posterUrl);
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            aria-label={`Title for entry ${index + 1}`}
            aria-expanded={open && results.length > 0}
            role="combobox"
            aria-autocomplete="list"
          />
        </div>
        {open && results.length > 0 && (
          <ul className="suggest-list" role="listbox">
            {results.map((r, i) => (
              <li
                key={r.id}
                role="option"
                aria-selected={i === highlight}
                className={i === highlight ? "hi" : ""}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (blurTimer.current) clearTimeout(blurTimer.current);
                  selectMatch(r.id, r.title, r.posterUrl);
                }}
              >
                {r.posterUrl ? <img className="poster-mini" src={r.posterUrl} alt="" /> : <span className="poster-mini poster-mini-empty" />}
                <span>{r.title}</span>
                {r.releaseYear && <span className="yr">({r.releaseYear})</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="button" className="del-btn" onClick={onDelete} aria-label={`Remove entry ${index + 1}`} title="Remove">
        <Icon name="close_window" />
      </button>
    </div>
  );
}
