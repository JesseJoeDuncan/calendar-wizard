import type Konva from "konva";
import type { jsPDF } from "jspdf";
import { useRef, useState } from "react";
import { buildCalendarJpgDataUrl, downloadDataUrl, estimateDataUrlBytes, formatBytes } from "../../lib/exportImage";
import { buildCalendarPdf } from "../../lib/exportPdf";
import { Icon } from "../Icon";
import "./ExportMenu.css";

interface Props {
  stageRef: React.RefObject<Konva.Stage | null>;
  filenameBase: string;
}

/** Export options popup — PDF and JPG, each with a computed file-size estimate generated from the real export the moment the menu opens. */
export function ExportMenu({ stageRef, filenameBase }: Props) {
  const [open, setOpen] = useState(false);
  const [sizes, setSizes] = useState<{ pdf: number | null; jpg: number | null }>({ pdf: null, jpg: null });
  const pdfDocRef = useRef<jsPDF | null>(null);
  const jpgDataUrlRef = useRef<string | null>(null);

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next && stageRef.current) {
      const doc = buildCalendarPdf(stageRef.current);
      pdfDocRef.current = doc;
      const jpgUrl = buildCalendarJpgDataUrl(stageRef.current);
      jpgDataUrlRef.current = jpgUrl;
      setSizes({ pdf: doc.output("arraybuffer").byteLength, jpg: estimateDataUrlBytes(jpgUrl) });
    }
  }

  function downloadPdf() {
    pdfDocRef.current?.save(`${filenameBase}.pdf`);
    setOpen(false);
  }

  function downloadJpg() {
    if (jpgDataUrlRef.current) downloadDataUrl(jpgDataUrlRef.current, `${filenameBase}.jpg`);
    setOpen(false);
  }

  return (
    <div className="export-menu-wrap">
      <button type="button" className="btn-dl" onClick={handleToggle}>
        <Icon name="download_or_export" /> Export
      </button>
      {open && (
        <>
          <div className="cw-backdrop" onClick={() => setOpen(false)} />
          <div className="export-menu-panel">
            <button type="button" className="export-menu-item" onClick={downloadPdf}>
              <span className="export-menu-item-label">Download as PDF</span>
              <span className="export-menu-item-size">{sizes.pdf !== null ? formatBytes(sizes.pdf) : "…"}</span>
            </button>
            <button type="button" className="export-menu-item" onClick={downloadJpg}>
              <span className="export-menu-item-label">Download as JPG</span>
              <span className="export-menu-item-size">{sizes.jpg !== null ? formatBytes(sizes.jpg) : "…"}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
