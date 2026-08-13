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
}

/** Renders a color/gradient/image FillStyle as a plain rect (or image) covering the given area. */
export function FillRect({ fill, x, y, w, h, cornerRadius }: Props) {
  if (fill.type === "image") {
    return <KonvaImg src={fill.value} x={x} y={y} width={w} height={h} />;
  }
  if (fill.type === "gradient") {
    return (
      <Rect
        x={x}
        y={y}
        width={w}
        height={h}
        cornerRadius={cornerRadius}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: w, y: h }}
        fillLinearGradientColorStops={[0, fill.value, 1, fill.value2 || fill.value]}
      />
    );
  }
  return <Rect x={x} y={y} width={w} height={h} cornerRadius={cornerRadius} fill={fill.value} />;
}
