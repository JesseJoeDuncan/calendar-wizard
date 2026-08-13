import Konva from "konva";
import { forwardRef } from "react";
import { Layer, Stage } from "react-konva";
import { CANVAS_H, CANVAS_W, type CalendarGeometry } from "../../lib/calendarGeometry";
import type { CalendarLayout } from "../../lib/layoutEngine";
import type { Calendar } from "../../types/calendar";
import { CalendarScene } from "./CalendarScene";

interface Props {
  calendar: Calendar;
  layout: CalendarLayout;
  geometry: CalendarGeometry;
}

/** Off-screen 1x-scale render of the full calendar, used as the source for PDF export. */
export const ExportStage = forwardRef<Konva.Stage, Props>(function ExportStage({ calendar, layout, geometry }, ref) {
  return (
    <div style={{ position: "fixed", left: -99999, top: 0, width: CANVAS_W, height: CANVAS_H, pointerEvents: "none" }} aria-hidden="true">
      <Stage ref={ref} width={CANVAS_W} height={CANVAS_H}>
        <Layer>
          <CalendarScene
            calendar={calendar}
            layout={layout}
            geometry={geometry}
            selectedTitleId={null}
            hoveredTitleId={null}
            interactive={false}
            onSelectTitle={() => {}}
            onHoverTitle={() => {}}
          />
        </Layer>
      </Stage>
    </div>
  );
});
