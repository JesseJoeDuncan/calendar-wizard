import Konva from "konva";
import { useEffect, useRef, useState } from "react";
import { Layer, Stage } from "react-konva";
import { CANVAS_H, CANVAS_W, type CalendarGeometry } from "../../lib/calendarGeometry";
import type { CalendarLayout } from "../../lib/layoutEngine";
import { useFontsLoaded } from "../../lib/useFontsLoaded";
import type { Calendar } from "../../types/calendar";
import { Icon } from "../Icon";
import { CalendarScene } from "./CalendarScene";
import "./CalendarCanvas.css";

export type CanvasMode = "select" | "pan";

interface Props {
  calendar: Calendar;
  layout: CalendarLayout;
  geometry: CalendarGeometry;
  selectedTitleId: string | null;
  onSelectTitle: (id: string | null) => void;
  onImageOffsetChange?: (titleId: string, offsetX: number, offsetY: number) => void;
  onImageScaleChange?: (titleId: string, scale: number) => void;
  onOpenHeaderFooter?: () => void;
  stageRef?: React.RefObject<Konva.Stage | null>;
  xrayTitleId?: string | null;
}

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 4;

export function CalendarCanvas({ calendar, layout, geometry, selectedTitleId, onSelectTitle, onImageOffsetChange, onImageScaleChange, onOpenHeaderFooter, stageRef, xrayTitleId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const internalStageRef = useRef<Konva.Stage>(null);
  const actualStageRef = stageRef ?? internalStageRef;
  const fontsLoaded = useFontsLoaded();

  const [containerSize, setContainerSize] = useState({ w: 700, h: 860 });
  const [mode, setMode] = useState<CanvasMode>("select");
  const [zoom, setZoom] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [hoveredTitleId, setHoveredTitleId] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const box = entries[0].contentRect;
      setContainerSize({ w: box.width, h: box.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const baseScale = Math.min((containerSize.w * 0.92) / CANVAS_W, (containerSize.h * 0.92) / CANVAS_H);
  const scale = baseScale * zoom;

  // Re-centers on the selected box (or the full calendar, if nothing is selected) whenever the
  // selection changes OR the container is resized — e.g. the details panel opening/closing next
  // to the canvas changes its width, which would otherwise leave a stale pan/zoom behind.
  useEffect(() => {
    if (!selectedTitleId) {
      setZoom(1);
      setStagePos({ x: (containerSize.w - CANVAS_W * baseScale) / 2, y: (containerSize.h - CANVAS_H * baseScale) / 2 });
      return;
    }
    const box = geometry.rows.flatMap((r) => r.boxes).find((b) => b.titleId === selectedTitleId);
    if (!box) return;
    const pad = 1.25;
    const fitZoom = Math.min(MAX_ZOOM, Math.min((containerSize.w * 0.92) / (box.w * pad) / baseScale, (containerSize.h * 0.92) / (box.h * pad) / baseScale));
    const newZoom = Math.max(MIN_ZOOM, fitZoom);
    const newScale = baseScale * newZoom;
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    setZoom(newZoom);
    setStagePos({ x: containerSize.w / 2 - cx * newScale, y: containerSize.h / 2 - cy * newScale });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTitleId, containerSize.w, containerSize.h, baseScale]);

  function handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();
    const stage = actualStageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const oldScale = scale;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * (1 + direction * 0.08)));
    const newScale = baseScale * newZoom;

    const mousePointTo = { x: (pointer.x - stagePos.x) / oldScale, y: (pointer.y - stagePos.y) / oldScale };
    setZoom(newZoom);
    setStagePos({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale });
  }

  function resetView() {
    setZoom(1);
    setStagePos({ x: (containerSize.w - CANVAS_W * baseScale) / 2, y: (containerSize.h - CANVAS_H * baseScale) / 2 });
  }

  // Clicking truly empty canvas (not any box/band shape) deselects and zooms back out. Clicking a
  // box is handled by that box's own onClick, which bubbles here too — only act when the click
  // target is the stage itself, so a box click never gets overridden by this.
  function handleStageClick(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    if (e.target === e.target.getStage()) onSelectTitle(null);
  }

  // Konva drag events bubble from the originating node up through its ancestors, same as click —
  // so dragging the selected title's image (a child several levels down) also fires this handler
  // with e.target still pointing at that image, not the Stage. Without this guard, stagePos was
  // being overwritten with the dragged image's own local x/y, snapping the camera to a bogus pan.
  function handleStageDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    if (e.target !== e.target.getStage()) return;
    setStagePos({ x: e.target.x(), y: e.target.y() });
  }

  return (
    <div className="canvas-viewport" ref={containerRef}>
      <div className="canvas-toolbar">
        <button className={`icon-btn ${mode === "select" ? "sel" : ""}`} title="Select" onClick={() => setMode("select")}>
          <Icon name="select_tool" />
        </button>
        <button className={`icon-btn ${mode === "pan" ? "sel" : ""}`} title="Pan" onClick={() => setMode("pan")}>
          <Icon name="grab_tool" />
        </button>
        <div className="divider" />
        <button className="icon-btn" title="Zoom in" onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.2))}>
          <Icon name="zoom_in" />
        </button>
        <button className="icon-btn" title="Zoom out" onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.2))}>
          <Icon name="zoom_out" />
        </button>
        <button className="icon-btn" title="Reset view" onClick={resetView}>
          ⤢
        </button>
      </div>

      {fontsLoaded && (
        <Stage
          ref={actualStageRef}
          width={containerSize.w}
          height={containerSize.h}
          scaleX={scale}
          scaleY={scale}
          x={stagePos.x}
          y={stagePos.y}
          draggable={mode === "pan"}
          onDragEnd={handleStageDragEnd}
          onWheel={handleWheel}
          onClick={handleStageClick}
          onTap={handleStageClick}
        >
          <Layer>
            <CalendarScene
              calendar={calendar}
              layout={layout}
              geometry={geometry}
              selectedTitleId={selectedTitleId}
              hoveredTitleId={hoveredTitleId}
              interactive={mode === "select"}
              onSelectTitle={onSelectTitle}
              onHoverTitle={setHoveredTitleId}
              onImageOffsetChange={onImageOffsetChange}
              onImageScaleChange={onImageScaleChange}
              onOpenHeaderFooter={onOpenHeaderFooter}
              xrayTitleId={xrayTitleId}
            />
          </Layer>
        </Stage>
      )}
    </div>
  );
}
