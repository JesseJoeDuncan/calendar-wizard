import { useRef } from "react";
import { SettingRow } from "../SettingRow";
import { Icon } from "../Icon";
import { VisibilityToggle } from "../VisibilityToggle";
import { CustomElementEditor } from "../CustomElementEditor";
import { api } from "../../lib/api";
import { computeAutoFitTitleText } from "../../lib/autoFitText";
import { nextId } from "../../lib/draftTypes";
import type { Calendar, CustomElementKind, ImageCandidate, MpaRating, Title } from "../../types/calendar";
import { CollapsibleSection } from "./CollapsibleSection";
import "./DetailsPanel.css";

const MPA_OPTIONS: MpaRating[] = ["NR", "G", "PG", "PG-13", "R", "NC-17"];
const ROTATION_STEPS = [0, 90, 180, 270] as const;

interface Props {
  calendar: Calendar;
  title: Title;
  boxWidth: number | null;
  onChange: (next: Title) => void;
  onBack: () => void;
  xrayOn: boolean;
  onToggleXray: (on: boolean) => void;
}

export function DetailsPanel({ calendar, title, boxWidth, onChange, onBack, xrayOn, onToggleXray }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function pickCandidate(candidate: ImageCandidate) {
    onChange({
      ...title,
      image: { source: "tmdb", tmdbPath: candidate.tmdbPath, url: candidate.fullUrl, scale: 1, offsetX: 0, offsetY: 0, rotation: 0, flipHorizontal: false, flipVertical: false },
    });
  }

  async function handleUpload(file: File) {
    const localUrl = URL.createObjectURL(file);
    try {
      const { url } = await api.uploadImage(file);
      onChange({ ...title, image: { source: "upload", url, scale: 1, offsetX: 0, offsetY: 0, rotation: 0, flipHorizontal: false, flipVertical: false } });
    } catch (err) {
      console.error(err);
      onChange({ ...title, image: { source: "upload", url: localUrl, scale: 1, offsetX: 0, offsetY: 0, rotation: 0, flipHorizontal: false, flipVertical: false } });
    }
  }

  function centerImage() {
    if (!title.image) return;
    onChange({ ...title, image: { ...title.image, offsetX: 0, offsetY: 0 } });
  }

  function cycleRotation() {
    if (!title.image) return;
    const idx = ROTATION_STEPS.indexOf(title.image.rotation);
    const next = ROTATION_STEPS[(idx + 1) % ROTATION_STEPS.length];
    onChange({ ...title, image: { ...title.image, rotation: next } });
  }

  function toggleFlipHorizontal() {
    if (!title.image) return;
    onChange({ ...title, image: { ...title.image, flipHorizontal: !title.image.flipHorizontal } });
  }

  function toggleFlipVertical() {
    if (!title.image) return;
    onChange({ ...title, image: { ...title.image, flipVertical: !title.image.flipVertical } });
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

  function refitTitleText() {
    if (!boxWidth) return;
    const threshold = title.titleTextStyle.wrapCharThreshold ?? calendar.theme.cardText.title.wrapCharThreshold;
    const fit = computeAutoFitTitleText(title.name, boxWidth, threshold, "Futura Wizard Condensed");
    onChange({ ...title, titleTextStyle: { ...title.titleTextStyle, fontSize: fit.fontSize, manualLineBreaks: fit.manualLineBreaks } });
  }

  function addCustomElement(kind: CustomElementKind) {
    const count = title.customElements.filter((e) => e.kind === kind).length + 1;
    const label = kind === "text" ? `New Text Element ${count}` : `New Image ${count}`;
    onChange({
      ...title,
      customElements: [
        ...title.customElements,
        { id: nextId("custom"), kind, label, visible: true, offsetX: 0, offsetY: 0, scale: 1, ...(kind === "text" ? { text: "", fontFamily: "Futura Wizard", fontSize: 16, color: "#ffffff", kerning: 0 } : {}) },
      ],
    });
  }

  function updateCustomElement(id: string, patch: Partial<Title["customElements"][number]>) {
    onChange({ ...title, customElements: title.customElements.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  }

  function removeCustomElement(id: string) {
    onChange({ ...title, customElements: title.customElements.filter((e) => e.id !== id) });
  }

  const candidates = title.imageCandidates ?? [];
  const currentUrl = title.image?.url;
  const words = title.name.split(/\s+/).filter(Boolean);
  const style = title.titleTextStyle;
  const wrapThreshold = style.wrapCharThreshold ?? calendar.theme.cardText.title.wrapCharThreshold;
  const defaultFit = boxWidth ? computeAutoFitTitleText(title.name, boxWidth, wrapThreshold, "Futura Wizard Condensed") : null;

  return (
    <div className="details-left">
      <div className="details-back" onClick={onBack}>
        <Icon name="close_window" size={13} /> Close details
      </div>
      <div className="details-h">{title.name || "Untitled"}</div>

      <div className="field-group">
        <label>Date</label>
        <input type="date" className="field-input" value={title.date} onChange={(e) => onChange({ ...title, date: e.target.value })} />
      </div>

      <CollapsibleSection
        title="Image"
        icon="image"
        defaultOpen
        headExtra={<VisibilityToggle visible={title.imageVisible} onChange={(imageVisible) => onChange({ ...title, imageVisible })} title="Image visible" />}
      >
        <div className="field-group">
          <label>Choose image</label>
          <div className="img-grid">
            {candidates.map((c) => (
              <button key={c.tmdbPath} type="button" className={`img-opt ${currentUrl === c.fullUrl ? "sel" : ""}`} onClick={() => pickCandidate(c)}>
                <img src={c.thumbUrl} alt="" loading="lazy" />
              </button>
            ))}
            <button type="button" className="img-opt upload" onClick={() => fileInputRef.current?.click()} title="Upload your own image">
              <Icon name="upload_image" size={20} />
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
          <div className="img-transform-row">
            <button type="button" className="del-btn" onClick={cycleRotation} disabled={!title.image} title="Rotate 90°">
              <Icon name="rotate_element" size={15} />
            </button>
            <button type="button" className={`del-btn ${title.image?.flipHorizontal ? "sel" : ""}`} onClick={toggleFlipHorizontal} disabled={!title.image} title="Flip horizontal">
              <Icon name="flip_horizontal" size={15} />
            </button>
            <button type="button" className={`del-btn ${title.image?.flipVertical ? "sel" : ""}`} onClick={toggleFlipVertical} disabled={!title.image} title="Flip vertical">
              <Icon name="flip_vertical" size={15} />
            </button>
            <button type="button" className={`del-btn ${xrayOn ? "sel" : ""}`} onClick={() => onToggleXray(!xrayOn)} disabled={!title.image} title="X-ray mode — dims everything else so you can see the image beyond the card's bounds">
              <Icon name="xray_mode" size={15} />
            </button>
          </div>
          <SettingRow
            label="Scale"
            icon="scale"
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
            icon="horizontal_distance"
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
            icon="vertical_distance"
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

      <CollapsibleSection
        title="Title text"
        icon="title_element"
        defaultOpen
        headExtra={<VisibilityToggle visible={title.titleVisible} onChange={(titleVisible) => onChange({ ...title, titleVisible })} title="Title text visible" />}
      >
        <div className="field-group">
          <label>Title</label>
          <input className="field-input" type="text" value={title.name} onChange={(e) => onChange({ ...title, name: e.target.value })} />
        </div>
        <div className="just-row">
          {(["left", "center", "right"] as const).map((j) => (
            <button
              key={j}
              type="button"
              className={`just-btn ${style.justify === j ? "sel" : ""}`}
              onClick={() => onChange({ ...title, titleTextStyle: { ...style, justify: j } })}
            >
              {j === "left" ? <Icon name="left" size={13} /> : j === "right" ? <Icon name="right" size={13} /> : "▦"}
            </button>
          ))}
          <label className="toggle-row">
            <input type="checkbox" checked={style.dropShadow} onChange={(e) => onChange({ ...title, titleTextStyle: { ...style, dropShadow: e.target.checked } })} />
            <Icon name="dropshadow" title="Drop shadow" />
          </label>
        </div>
        <SettingRow
          label="Base size"
          icon="text_size"
          value={style.fontSize}
          defaultValue={defaultFit?.fontSize ?? style.fontSize}
          min={6}
          max={40}
          step={0.1}
          disabled={!defaultFit}
          onChange={(v) => onChange({ ...title, titleTextStyle: { ...style, fontSize: v } })}
        />
        <SettingRow label="Kerning" icon="kerning" value={style.kerning} defaultValue={0} min={-4} max={12} step={0.1} onChange={(v) => onChange({ ...title, titleTextStyle: { ...style, kerning: v } })} />
        <SettingRow
          label="Line spacing"
          icon="line_spacing"
          value={style.lineSpacing || 1.08}
          defaultValue={1.08}
          min={0.8}
          max={2}
          step={0.01}
          onChange={(v) => onChange({ ...title, titleTextStyle: { ...style, lineSpacing: v } })}
        />
        <SettingRow label="Position X" icon="horizontal_distance" value={style.offsetX} defaultValue={0} min={-100} max={100} step={0.5} unit="px" onChange={(v) => onChange({ ...title, titleTextStyle: { ...style, offsetX: v } })} />
        <SettingRow label="Position Y" icon="vertical_distance" value={style.offsetY} defaultValue={0} min={-100} max={100} step={0.5} unit="px" onChange={(v) => onChange({ ...title, titleTextStyle: { ...style, offsetY: v } })} />

        <div className="field-group">
          <div className="field-group-head">
            <label>Wrap after N characters</label>
            <button type="button" className="link-btn" onClick={refitTitleText} disabled={!boxWidth}>
              Re-fit text
            </button>
          </div>
          <SettingRow
            label="Wrap threshold"
            value={wrapThreshold}
            defaultValue={calendar.theme.cardText.title.wrapCharThreshold}
            min={4}
            max={40}
            step={1}
            onChange={(v) => onChange({ ...title, titleTextStyle: { ...style, wrapCharThreshold: v } })}
          />
        </div>

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

      <CollapsibleSection
        title="Date text"
        icon="text_element"
        headExtra={<VisibilityToggle visible={title.dateVisible} onChange={(dateVisible) => onChange({ ...title, dateVisible })} title="Date text visible" />}
      >
        <SettingRow
          label="Position X"
          icon="horizontal_distance"
          value={title.dateOffsetX}
          defaultValue={0}
          min={-6}
          max={6}
          step={1}
          onChange={(v) => onChange({ ...title, dateOffsetX: v })}
        />
        <SettingRow
          label="Position Y"
          icon="vertical_distance"
          value={title.dateOffsetY}
          defaultValue={0}
          min={-6}
          max={6}
          step={1}
          onChange={(v) => onChange({ ...title, dateOffsetY: v })}
        />
        <SettingRow
          label="Number kerning"
          icon="kerning"
          value={title.dateStyle.numberKerning}
          defaultValue={0}
          min={-4}
          max={12}
          step={0.1}
          onChange={(v) => onChange({ ...title, dateStyle: { ...title.dateStyle, numberKerning: v } })}
        />
        <SettingRow
          label="Opacity"
          icon="opacity"
          value={title.dateStyle.opacity}
          defaultValue={1}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => onChange({ ...title, dateStyle: { ...title.dateStyle, opacity: v } })}
        />
        <SettingRow
          label="Shadow opacity"
          icon="dropshadow"
          value={title.dateStyle.dropShadowOpacity}
          defaultValue={0.6}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => onChange({ ...title, dateStyle: { ...title.dateStyle, dropShadowOpacity: v } })}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Runtime"
        icon="text_element"
        headExtra={<VisibilityToggle visible={title.runtimeVisible} onChange={(runtimeVisible) => onChange({ ...title, runtimeVisible })} title="Runtime visible" />}
      >
        <div className="field-group">
          <label>Runtime (minutes)</label>
          <input
            type="number"
            className="field-input"
            value={title.runtimeMinutes ?? ""}
            onChange={(e) => onChange({ ...title, runtimeMinutes: Number(e.target.value) || undefined })}
          />
        </div>
        <SettingRow label="Position X" icon="horizontal_distance" value={title.runtimeStyle.offsetX} defaultValue={0} min={-100} max={100} step={0.5} unit="px" onChange={(v) => onChange({ ...title, runtimeStyle: { ...title.runtimeStyle, offsetX: v } })} />
        <SettingRow label="Position Y" icon="vertical_distance" value={title.runtimeStyle.offsetY} defaultValue={0} min={-100} max={100} step={0.5} unit="px" onChange={(v) => onChange({ ...title, runtimeStyle: { ...title.runtimeStyle, offsetY: v } })} />
        <SettingRow label="Scale" icon="scale" value={title.runtimeStyle.scale} defaultValue={1} min={0.2} max={4} step={0.05} onChange={(v) => onChange({ ...title, runtimeStyle: { ...title.runtimeStyle, scale: v } })} />
        <SettingRow label="Opacity" icon="opacity" value={title.runtimeStyle.opacity} defaultValue={0.85} min={0} max={1} step={0.05} onChange={(v) => onChange({ ...title, runtimeStyle: { ...title.runtimeStyle, opacity: v } })} />
        <SettingRow
          label="Shadow opacity"
          icon="dropshadow"
          value={title.runtimeStyle.dropShadowOpacity}
          defaultValue={0.5}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => onChange({ ...title, runtimeStyle: { ...title.runtimeStyle, dropShadowOpacity: v } })}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Rating"
        icon="text_element"
        headExtra={<VisibilityToggle visible={title.ratingVisible} onChange={(ratingVisible) => onChange({ ...title, ratingVisible })} title="Rating badge visible" />}
      >
        <div className="field-group">
          <label>MPA Rating</label>
          <select className="field-input" value={title.mpaRating} onChange={(e) => onChange({ ...title, mpaRating: e.target.value as MpaRating })}>
            {MPA_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <SettingRow label="Position X" icon="horizontal_distance" value={title.ratingStyle.offsetX} defaultValue={0} min={-100} max={100} step={0.5} unit="px" onChange={(v) => onChange({ ...title, ratingStyle: { ...title.ratingStyle, offsetX: v } })} />
        <SettingRow label="Position Y" icon="vertical_distance" value={title.ratingStyle.offsetY} defaultValue={0} min={-100} max={100} step={0.5} unit="px" onChange={(v) => onChange({ ...title, ratingStyle: { ...title.ratingStyle, offsetY: v } })} />
        <SettingRow label="Scale" icon="scale" value={title.ratingStyle.scale} defaultValue={1} min={0.2} max={4} step={0.05} onChange={(v) => onChange({ ...title, ratingStyle: { ...title.ratingStyle, scale: v } })} />
        <SettingRow label="Opacity" icon="opacity" value={title.ratingStyle.opacity} defaultValue={0.85} min={0} max={1} step={0.05} onChange={(v) => onChange({ ...title, ratingStyle: { ...title.ratingStyle, opacity: v } })} />
        <label className="toggle-row">
          <input type="checkbox" checked={title.ratingStyle.dropShadow} onChange={(e) => onChange({ ...title, ratingStyle: { ...title.ratingStyle, dropShadow: e.target.checked } })} />
          <Icon name="dropshadow" title="Drop shadow" />
        </label>
        <SettingRow
          label="Shadow opacity"
          icon="dropshadow"
          value={title.ratingStyle.dropShadowOpacity}
          defaultValue={0.5}
          min={0}
          max={1}
          step={0.05}
          disabled={!title.ratingStyle.dropShadow}
          onChange={(v) => onChange({ ...title, ratingStyle: { ...title.ratingStyle, dropShadowOpacity: v } })}
        />
      </CollapsibleSection>

      {title.badges.length > 0 && (
        <CollapsibleSection title="Special elements" icon="special_element" defaultOpen>
          {title.badges.map((b) => (
            <div className="badge-field" key={b.id}>
              <input className="field-input" value={b.text} placeholder="e.g. Live Musical Accompaniment" onChange={(e) => updateBadge(b.id, { text: e.target.value })} />
              <select className="field-input badge-style-select" value={b.style ?? "tag"} onChange={(e) => updateBadge(b.id, { style: e.target.value as Title["badges"][number]["style"] })}>
                <option value="tag">Tag</option>
                <option value="seal">Seal</option>
                <option value="ribbon">Ribbon</option>
                <option value="banner">Banner</option>
              </select>
              <button type="button" className="del-btn" onClick={() => removeBadge(b.id)} title="Remove special element">
                <Icon name="remove_special_element" size={15} />
              </button>
            </div>
          ))}
        </CollapsibleSection>
      )}

      {title.customElements.map((el) => (
        <CollapsibleSection
          key={el.id}
          title={el.label}
          icon={el.kind === "text" ? "text_element" : "image"}
          defaultOpen
          headExtra={<VisibilityToggle visible={el.visible} onChange={(visible) => updateCustomElement(el.id, { visible })} />}
        >
          <CustomElementEditor element={el} onChange={(patch) => updateCustomElement(el.id, patch)} onRemove={() => removeCustomElement(el.id)} offsetRange={100} />
        </CollapsibleSection>
      ))}

      <div className="details-add-row">
        <button type="button" className="series-add" onClick={() => addCustomElement("image")}>
          <Icon name="add_image" size={14} /> Add Image
        </button>
        <button type="button" className="series-add" onClick={() => addCustomElement("text")}>
          <Icon name="add_text_element" size={14} /> Add Text Element
        </button>
        <button type="button" className="series-add" onClick={addBadge}>
          <Icon name="add_special_element" size={14} /> Add Special Element
        </button>
      </div>
    </div>
  );
}
