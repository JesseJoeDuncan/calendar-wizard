import { useRef, useState } from "react";
import { api } from "../../lib/api";
import { nextId } from "../../lib/draftTypes";
import type { Calendar, MpaRating, Title } from "../../types/calendar";
import "./DetailsPanel.css";

const MPA_OPTIONS: MpaRating[] = ["NR", "G", "PG", "PG-13", "R", "NC-17"];

interface Props {
  calendar: Calendar;
  title: Title;
  onChange: (next: Title) => void;
  onBack: () => void;
}

export function DetailsPanel({ title, onChange, onBack }: Props) {
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function pickCandidate(candidate: { url: string; tmdbPath: string }) {
    setBusy(true);
    try {
      const { cutoutUrl } = await api.cutoutFromUrl(candidate.url);
      onChange({
        ...title,
        image: { source: "tmdb", tmdbPath: candidate.tmdbPath, url: candidate.url, cutoutUrl, scale: 1, offsetX: 0, offsetY: 0 },
      });
    } catch (err) {
      console.error(err);
      onChange({ ...title, image: { source: "tmdb", tmdbPath: candidate.tmdbPath, url: candidate.url, scale: 1, offsetX: 0, offsetY: 0 } });
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload(file: File) {
    setBusy(true);
    const localUrl = URL.createObjectURL(file);
    try {
      const { cutoutUrl } = await api.cutoutFromUpload(file);
      onChange({ ...title, image: { source: "upload", url: localUrl, cutoutUrl, scale: 1, offsetX: 0, offsetY: 0 } });
    } catch (err) {
      console.error(err);
      onChange({ ...title, image: { source: "upload", url: localUrl, scale: 1, offsetX: 0, offsetY: 0 } });
    } finally {
      setBusy(false);
    }
  }

  function addBadge() {
    onChange({ ...title, badges: [...title.badges, { id: nextId("badge"), text: "" }] });
  }

  function updateBadge(id: string, patch: Partial<Title["badges"][number]>) {
    onChange({ ...title, badges: title.badges.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
  }

  function removeBadge(id: string) {
    onChange({ ...title, badges: title.badges.filter((b) => b.id !== id) });
  }

  const candidates = title.imageCandidates ?? [];
  const currentUrl = title.image?.url;

  return (
    <div className="details-left">
      <div className="details-back" onClick={onBack}>
        ← Back to all titles
      </div>
      <div className="details-h">{title.name || "Untitled"}</div>

      <div className="field-group">
        <label>Date</label>
        <input type="date" className="field-input" value={title.date} onChange={(e) => onChange({ ...title, date: e.target.value })} />
      </div>

      <div className="field-group">
        <label>Runtime (minutes)</label>
        <input
          type="number"
          className="field-input"
          value={title.runtimeMinutes ?? ""}
          onChange={(e) => onChange({ ...title, runtimeMinutes: Number(e.target.value) || undefined })}
        />
      </div>

      <div className="field-group">
        <label>MPA Rating</label>
        <div className="field-row">
          <select className="field-input" value={title.mpaRating} onChange={(e) => onChange({ ...title, mpaRating: e.target.value as MpaRating })}>
            {MPA_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <label className="toggle-row">
            <input type="checkbox" checked={title.ratingVisible} onChange={(e) => onChange({ ...title, ratingVisible: e.target.checked })} />
            Visible
          </label>
        </div>
      </div>

      <div className="field-group">
        <label>Image {busy && <span className="busy-note">generating cutout…</span>}</label>
        <div className="img-grid">
          {candidates.map((c) => (
            <button key={c.url} type="button" className={`img-opt ${currentUrl === c.url ? "sel" : ""}`} onClick={() => pickCandidate(c)} disabled={busy}>
              <img src={c.url} alt="" />
            </button>
          ))}
          <button type="button" className="img-opt upload" onClick={() => fileInputRef.current?.click()} disabled={busy}>
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="field-group">
        <label>Image scale</label>
        <input
          type="range"
          min={0.5}
          max={2.5}
          step={0.02}
          value={title.image?.scale ?? 1}
          onChange={(e) => onChange({ ...title, image: { ...(title.image as any), scale: Number(e.target.value) } })}
          disabled={!title.image}
        />
      </div>

      <div className="field-group">
        <label>Image position</label>
        <div className="slider-pair">
          <input
            type="range"
            min={-120}
            max={120}
            value={title.image?.offsetX ?? 0}
            onChange={(e) => onChange({ ...title, image: { ...(title.image as any), offsetX: Number(e.target.value) } })}
            disabled={!title.image}
          />
          <input
            type="range"
            min={-120}
            max={120}
            value={title.image?.offsetY ?? 0}
            onChange={(e) => onChange({ ...title, image: { ...(title.image as any), offsetY: Number(e.target.value) } })}
            disabled={!title.image}
          />
        </div>
      </div>

      <div className="field-group">
        <label>Date position (limited)</label>
        <div className="slider-pair">
          <input type="range" min={-6} max={6} value={title.dateOffsetX} onChange={(e) => onChange({ ...title, dateOffsetX: Number(e.target.value) })} />
          <input type="range" min={-6} max={6} value={title.dateOffsetY} onChange={(e) => onChange({ ...title, dateOffsetY: Number(e.target.value) })} />
        </div>
      </div>

      <div className="field-group">
        <label>Title text</label>
        <div className="just-row">
          {(["left", "center", "right"] as const).map((j) => (
            <button
              key={j}
              type="button"
              className={`just-btn ${title.titleTextStyle.justify === j ? "sel" : ""}`}
              onClick={() => onChange({ ...title, titleTextStyle: { ...title.titleTextStyle, justify: j } })}
            >
              {j === "left" ? "◧" : j === "right" ? "◨" : "▦"}
            </button>
          ))}
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={title.titleTextStyle.dropShadow}
              onChange={(e) => onChange({ ...title, titleTextStyle: { ...title.titleTextStyle, dropShadow: e.target.checked } })}
            />
            Shadow
          </label>
        </div>
        <div className="slider-labeled">
          <span>Size</span>
          <input
            type="range"
            min={9}
            max={26}
            value={title.titleTextStyle.fontSize}
            onChange={(e) => onChange({ ...title, titleTextStyle: { ...title.titleTextStyle, fontSize: Number(e.target.value) } })}
          />
        </div>
        <div className="slider-labeled">
          <span>Kerning</span>
          <input
            type="range"
            min={-2}
            max={6}
            value={title.titleTextStyle.kerning}
            onChange={(e) => onChange({ ...title, titleTextStyle: { ...title.titleTextStyle, kerning: Number(e.target.value) } })}
          />
        </div>
      </div>

      <div className="field-group">
        <label>Runtime &amp; rating opacity</label>
        <div className="slider-labeled">
          <span>Runtime</span>
          <input type="range" min={0} max={1} step={0.05} value={title.runtimeOpacity} onChange={(e) => onChange({ ...title, runtimeOpacity: Number(e.target.value) })} />
        </div>
        <div className="slider-labeled">
          <span>Rating</span>
          <input type="range" min={0} max={1} step={0.05} value={title.ratingOpacity} onChange={(e) => onChange({ ...title, ratingOpacity: Number(e.target.value) })} />
        </div>
      </div>

      <div className="field-group">
        <label>Special elements</label>
        {title.badges.map((b) => (
          <div className="badge-field" key={b.id}>
            <input className="field-input" value={b.text} placeholder="e.g. Live Musical Accompaniment" onChange={(e) => updateBadge(b.id, { text: e.target.value })} />
            <select className="field-input badge-style-select" value={b.style ?? "tag"} onChange={(e) => updateBadge(b.id, { style: e.target.value as Title["badges"][number]["style"] })}>
              <option value="tag">Tag</option>
              <option value="seal">Seal</option>
              <option value="ribbon">Ribbon</option>
              <option value="banner">Banner</option>
            </select>
            <button type="button" className="del-btn" onClick={() => removeBadge(b.id)}>
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="series-add" onClick={addBadge}>
          + Add special element
        </button>
      </div>
    </div>
  );
}
