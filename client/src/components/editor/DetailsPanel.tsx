import { useRef } from "react";
import { SettingRow } from "../SettingRow";
import { api } from "../../lib/api";
import { computeAutoFitTitleText } from "../../lib/autoFitText";
import { nextId } from "../../lib/draftTypes";
import type { Calendar, ImageCandidate, MpaRating, Title } from "../../types/calendar";
import { CollapsibleSection } from "./CollapsibleSection";
import "./DetailsPanel.css";

const MPA_OPTIONS: MpaRating[] = ["NR", "G", "PG", "PG-13", "R", "NC-17"];

interface Props {
  calendar: Calendar;
  title: Title;
  boxWidth: number | null;
  onChange: (next: Title) => void;
  onBack: () => void;
}

export function DetailsPanel({ title, boxWidth, onChange, onBack }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function pickCandidate(candidate: ImageCandidate) {
    onChange({
      ...title,
      image: { source: "tmdb", tmdbPath: candidate.tmdbPath, url: candidate.fullUrl, scale: 1, offsetX: 0, offsetY: 0 },
    });
  }

  async function handleUpload(file: File) {
    const localUrl = URL.createObjectURL(file);
    try {
      const { url } = await api.uploadImage(file);
      onChange({ ...title, image: { source: "upload", url, scale: 1, offsetX: 0, offsetY: 0 } });
    } catch (err) {
      console.error(err);
      onChange({ ...title, image: { source: "upload", url: localUrl, scale: 1, offsetX: 0, offsetY: 0 } });
    }
  }

  function centerImage() {
    if (!title.image) return;
    onChange({ ...title, image: { ...title.image, offsetX: 0, offsetY: 0 } });
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

  function updateWordSize(index: number, size: number) {
    const words = title.name.split(/\s+/).filter(Boolean);
    const next = words.map((_, i) => title.titleTextStyle.wordSizes?.[i] ?? title.titleTextStyle.fontSize);
    next[index] = size;
    onChange({ ...title, titleTextStyle: { ...title.titleTextStyle, wordSizes: next } });
  }

  function resetWordSizes() {
    onChange({ ...title, titleTextStyle: { ...title.titleTextStyle, wordSizes: undefined } });
  }

  const candidates = title.imageCandidates ?? [];
  const currentUrl = title.image?.url;
  const words = title.name.split(/\s+/).filter(Boolean);
  const style = title.titleTextStyle;
  const defaultFit = boxWidth ? computeAutoFitTitleText(title.name, boxWidth, "Futura Wizard Condensed") : null;

  return (
    <div className="details-left">
      <div className="details-back" onClick={onBack}>
        ✕ Close details
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

      <CollapsibleSection title="Image" defaultOpen>
        <div className="field-group">
          <label>Choose image</label>
          <div className="img-grid">
            {candidates.map((c) => (
              <button key={c.tmdbPath} type="button" className={`img-opt ${currentUrl === c.fullUrl ? "sel" : ""}`} onClick={() => pickCandidate(c)}>
                <img src={c.thumbUrl} alt="" loading="lazy" />
              </button>
            ))}
            <button type="button" className="img-opt upload" onClick={() => fileInputRef.current?.click()}>
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
          <div className="field-group-head">
            <label>Position &amp; scale</label>
            <button type="button" className="link-btn" onClick={centerImage} disabled={!title.image}>
              Center image
            </button>
          </div>
          <p className="field-hint">Tip: drag the image directly on the preview (select mode, this title open) to reposition it.</p>
          <SettingRow
            label="Scale"
            value={title.image?.scale ?? 1}
            defaultValue={1}
            min={0.1}
            max={8}
            step={0.001}
            disabled={!title.image}
            onChange={(v) => onChange({ ...title, image: { ...(title.image as Title["image"] & object), scale: v } })}
          />
          <SettingRow
            label="Position X"
            value={title.image?.offsetX ?? 0}
            defaultValue={0}
            min={-300}
            max={300}
            step={0.5}
            unit="px"
            disabled={!title.image}
            onChange={(v) => onChange({ ...title, image: { ...(title.image as Title["image"] & object), offsetX: v } })}
          />
          <SettingRow
            label="Position Y"
            value={title.image?.offsetY ?? 0}
            defaultValue={0}
            min={-300}
            max={300}
            step={0.5}
            unit="px"
            disabled={!title.image}
            onChange={(v) => onChange({ ...title, image: { ...(title.image as Title["image"] & object), offsetY: v } })}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Title text" defaultOpen>
        <div className="just-row">
          {(["left", "center", "right"] as const).map((j) => (
            <button
              key={j}
              type="button"
              className={`just-btn ${style.justify === j ? "sel" : ""}`}
              onClick={() => onChange({ ...title, titleTextStyle: { ...style, justify: j } })}
            >
              {j === "left" ? "◧" : j === "right" ? "◨" : "▦"}
            </button>
          ))}
          <label className="toggle-row">
            <input type="checkbox" checked={style.dropShadow} onChange={(e) => onChange({ ...title, titleTextStyle: { ...style, dropShadow: e.target.checked } })} />
            Shadow
          </label>
        </div>
        <SettingRow
          label="Base size"
          value={style.fontSize}
          defaultValue={defaultFit?.fontSize ?? style.fontSize}
          min={6}
          max={40}
          step={0.1}
          disabled={!defaultFit}
          onChange={(v) => onChange({ ...title, titleTextStyle: { ...style, fontSize: v } })}
        />
        <SettingRow label="Kerning" value={style.kerning} defaultValue={0} min={-4} max={12} step={0.1} onChange={(v) => onChange({ ...title, titleTextStyle: { ...style, kerning: v } })} />
        <SettingRow
          label="Line spacing"
          value={style.lineSpacing || 1.08}
          defaultValue={1.08}
          min={0.8}
          max={2}
          step={0.01}
          onChange={(v) => onChange({ ...title, titleTextStyle: { ...style, lineSpacing: v } })}
        />
        <SettingRow label="Position X" value={style.offsetX} defaultValue={0} min={-100} max={100} step={0.5} unit="px" onChange={(v) => onChange({ ...title, titleTextStyle: { ...style, offsetX: v } })} />
        <SettingRow label="Position Y" value={style.offsetY} defaultValue={0} min={-100} max={100} step={0.5} unit="px" onChange={(v) => onChange({ ...title, titleTextStyle: { ...style, offsetY: v } })} />

        {words.length > 1 && (
          <div className="word-size-list">
            <div className="word-size-head">
              <span>Per-word size</span>
              <button type="button" className="link-btn" onClick={resetWordSizes}>
                Reset all
              </button>
            </div>
            {words.map((word, i) => (
              <SettingRow
                key={i}
                label={word}
                value={style.wordSizes?.[i] ?? style.fontSize}
                defaultValue={style.fontSize}
                min={6}
                max={60}
                step={0.1}
                onChange={(v) => updateWordSize(i, v)}
              />
            ))}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Date text">
        <SettingRow
          label="Position X"
          value={title.dateOffsetX}
          defaultValue={0}
          min={-6}
          max={6}
          step={1}
          onChange={(v) => onChange({ ...title, dateOffsetX: v })}
        />
        <SettingRow
          label="Position Y"
          value={title.dateOffsetY}
          defaultValue={0}
          min={-6}
          max={6}
          step={1}
          onChange={(v) => onChange({ ...title, dateOffsetY: v })}
        />
        <SettingRow
          label="Number kerning"
          value={title.dateStyle.numberKerning}
          defaultValue={0}
          min={-4}
          max={12}
          step={0.1}
          onChange={(v) => onChange({ ...title, dateStyle: { ...title.dateStyle, numberKerning: v } })}
        />
        <SettingRow
          label="Opacity"
          value={title.dateStyle.opacity}
          defaultValue={1}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => onChange({ ...title, dateStyle: { ...title.dateStyle, opacity: v } })}
        />
        <SettingRow
          label="Shadow opacity"
          value={title.dateStyle.dropShadowOpacity}
          defaultValue={0.6}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => onChange({ ...title, dateStyle: { ...title.dateStyle, dropShadowOpacity: v } })}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Runtime">
        <SettingRow label="Position X" value={title.runtimeStyle.offsetX} defaultValue={0} min={-100} max={100} step={0.5} unit="px" onChange={(v) => onChange({ ...title, runtimeStyle: { ...title.runtimeStyle, offsetX: v } })} />
        <SettingRow label="Position Y" value={title.runtimeStyle.offsetY} defaultValue={0} min={-100} max={100} step={0.5} unit="px" onChange={(v) => onChange({ ...title, runtimeStyle: { ...title.runtimeStyle, offsetY: v } })} />
        <SettingRow label="Scale" value={title.runtimeStyle.scale} defaultValue={1} min={0.2} max={4} step={0.05} onChange={(v) => onChange({ ...title, runtimeStyle: { ...title.runtimeStyle, scale: v } })} />
        <SettingRow label="Opacity" value={title.runtimeStyle.opacity} defaultValue={0.85} min={0} max={1} step={0.05} onChange={(v) => onChange({ ...title, runtimeStyle: { ...title.runtimeStyle, opacity: v } })} />
        <label className="toggle-row">
          <input type="checkbox" checked={title.runtimeStyle.dropShadow} onChange={(e) => onChange({ ...title, runtimeStyle: { ...title.runtimeStyle, dropShadow: e.target.checked } })} />
          Drop shadow
        </label>
        <SettingRow
          label="Shadow opacity"
          value={title.runtimeStyle.dropShadowOpacity}
          defaultValue={0.5}
          min={0}
          max={1}
          step={0.05}
          disabled={!title.runtimeStyle.dropShadow}
          onChange={(v) => onChange({ ...title, runtimeStyle: { ...title.runtimeStyle, dropShadowOpacity: v } })}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Rating">
        <SettingRow label="Position X" value={title.ratingStyle.offsetX} defaultValue={0} min={-100} max={100} step={0.5} unit="px" onChange={(v) => onChange({ ...title, ratingStyle: { ...title.ratingStyle, offsetX: v } })} />
        <SettingRow label="Position Y" value={title.ratingStyle.offsetY} defaultValue={0} min={-100} max={100} step={0.5} unit="px" onChange={(v) => onChange({ ...title, ratingStyle: { ...title.ratingStyle, offsetY: v } })} />
        <SettingRow label="Scale" value={title.ratingStyle.scale} defaultValue={1} min={0.2} max={4} step={0.05} onChange={(v) => onChange({ ...title, ratingStyle: { ...title.ratingStyle, scale: v } })} />
        <SettingRow label="Opacity" value={title.ratingStyle.opacity} defaultValue={0.85} min={0} max={1} step={0.05} onChange={(v) => onChange({ ...title, ratingStyle: { ...title.ratingStyle, opacity: v } })} />
        <label className="toggle-row">
          <input type="checkbox" checked={title.ratingStyle.dropShadow} onChange={(e) => onChange({ ...title, ratingStyle: { ...title.ratingStyle, dropShadow: e.target.checked } })} />
          Drop shadow
        </label>
        <SettingRow
          label="Shadow opacity"
          value={title.ratingStyle.dropShadowOpacity}
          defaultValue={0.5}
          min={0}
          max={1}
          step={0.05}
          disabled={!title.ratingStyle.dropShadow}
          onChange={(v) => onChange({ ...title, ratingStyle: { ...title.ratingStyle, dropShadowOpacity: v } })}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Special elements" defaultOpen>
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
      </CollapsibleSection>
    </div>
  );
}
