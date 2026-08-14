import { Rect } from "react-konva";
import type { FillStyle } from "../../types/calendar";
import { KonvaImg } from "./KonvaImg";

interface Props {
  fill: FillStyle;
  x: number;
  y: number;
  w: number;
  h: number;
  cornerRadius?: number;
  /** False (default) so clicks pass through to the stage, letting empty-area clicks deselect. */
  listening?: boolean;
}

/** Renders a color/gradient/image FillStyle as a plain rect (or image) covering the given area. */
export function FillRect({ fill, x, y, w, h, cornerRadius, listening = false }: Props) {
  if (fill.type === "image") {
    return <KonvaImg src={fill.value} x={x} y={y} width={w} height={h} listening={listening} />;
  }
  if (fill.type === "gradient") {
    return (
      <Rect
        x={x}
        y={y}
        width={w}
        height={h}
        cornerRadius={cornerRadius}
        listening={listening}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: w, y: h }}
        fillLinearGradientColorStops={[0, fill.value, 1, fill.value2 || fill.value]}
      />
    );
  }
  return <Rect x={x} y={y} width={w} height={h} cornerRadius={cornerRadius} listening={listening} fill={fill.value} />;
}
