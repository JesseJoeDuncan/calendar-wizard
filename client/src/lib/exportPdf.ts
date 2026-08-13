import { jsPDF } from "jspdf";
import type Konva from "konva";

const PAGE_W_IN = 8.5;
const PAGE_H_IN = 11;
const EXPORT_DPI = 300;
const SOURCE_DPI = 100; // matches CANVAS_W/H (850x1100)

export function exportCalendarPdf(stage: Konva.Stage, filename: string) {
  const pixelRatio = EXPORT_DPI / SOURCE_DPI;
  const dataUrl = stage.toDataURL({ pixelRatio, mimeType: "image/png" });

  const doc = new jsPDF({ unit: "in", format: "letter", orientation: "portrait" });
  doc.addImage(dataUrl, "PNG", 0, 0, PAGE_W_IN, PAGE_H_IN);
  doc.save(filename);
}
