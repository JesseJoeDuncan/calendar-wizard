import type Konva from "konva";
import { EXPORT_DPI, SOURCE_DPI } from "./exportPdf";

const JPG_QUALITY = 0.92;

export function buildCalendarJpgDataUrl(stage: Konva.Stage): string {
  const pixelRatio = EXPORT_DPI / SOURCE_DPI;
  return stage.toDataURL({ pixelRatio, mimeType: "image/jpeg", quality: JPG_QUALITY });
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export function estimateDataUrlBytes(dataUrl: string): number {
  const base64Len = dataUrl.length - dataUrl.indexOf(",") - 1;
  return Math.round(base64Len * 0.75);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
