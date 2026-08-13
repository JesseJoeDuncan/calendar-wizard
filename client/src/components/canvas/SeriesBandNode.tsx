import { Text } from "react-konva";
import type { BandGeometry } from "../../lib/calendarGeometry";
import type { Series } from "../../types/calendar";
import { FillRect } from "./FillRect";

interface Props {
  geometry: BandGeometry;
  series: Series;
}

export function SeriesBandNode({ geometry, series }: Props) {
  const { x, y, w, h } = geometry;
  const pillRadius = h / 2;

  return (
    <>
      <FillRect fill={series.bandStyle.background} x={x} y={y} w={w} h={h} cornerRadius={pillRadius} />
      <Text
        x={x}
        y={y}
        width={w}
        height={h}
        text={series.name.toUpperCase()}
        fontFamily={series.bandStyle.fontFamily}
        fontStyle="bold"
        fontSize={series.bandStyle.fontSize}
        letterSpacing={1.5}
        fill={series.bandStyle.textColor}
        align="center"
        verticalAlign="middle"
      />
    </>
  );
}
