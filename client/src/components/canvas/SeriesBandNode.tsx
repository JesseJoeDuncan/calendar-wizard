import type { BandGeometry } from "../../lib/calendarGeometry";
import type { Series } from "../../types/calendar";
import { FillRect } from "./FillRect";
import { RichWordText } from "./RichWordText";

interface Props {
  geometry: BandGeometry;
  series: Series;
}

export function SeriesBandNode({ geometry, series }: Props) {
  const { x, y, w, h } = geometry;
  const pillRadius = h / 2;
  const style = series.bandStyle;

  return (
    <>
      <FillRect fill={style.background} x={x} y={y} w={w} h={h} cornerRadius={pillRadius} />
      {series.name && (
        <RichWordText
          text={series.name}
          x={x + 10}
          y={y}
          width={w - 20}
          height={h}
          baseFontSize={style.fontSize}
          wordSizes={style.wordSizes}
          fontFamily={style.fontFamily}
          kerning={style.kerning}
          lineHeightMultiplier={style.lineSpacing || 1.08}
          justify={style.justify}
          color={style.textColor}
          verticalAlign="middle"
          uppercase
          offsetX={style.offsetX}
          offsetY={style.offsetY}
          listening={false}
        />
      )}
    </>
  );
}
