import type { BandGeometry } from "../../lib/calendarGeometry";
import type { CalendarSpacing, DropShadowSettings, Series } from "../../types/calendar";
import { FillRect } from "./FillRect";
import { RichWordText } from "./RichWordText";

interface Props {
  geometry: BandGeometry;
  series: Series;
  radii: Pick<CalendarSpacing, "primaryRadius" | "secondaryRadius" | "tertiaryRadius">;
  shadow: DropShadowSettings;
}

export function SeriesBandNode({ geometry, series, radii, shadow }: Props) {
  const { x, y, w, h } = geometry;
  const style = series.bandStyle;
  // Top corners meet the cards above (tertiaryRadius, matching the cards' own bottom corners so
  // they line up flush); bottom corners are the band's own free outer corners (primaryRadius),
  // the same rounding scheme cards use for their free corners.
  const cornerRadius: [number, number, number, number] = [radii.tertiaryRadius, radii.tertiaryRadius, radii.primaryRadius, radii.primaryRadius];

  return (
    <>
      <FillRect
        fill={style.background}
        x={x}
        y={y}
        w={w}
        h={h}
        cornerRadius={cornerRadius}
        shadowEnabled={shadow.enabled}
        shadowColor={shadow.color}
        shadowBlur={shadow.blur}
        shadowOpacity={shadow.opacity}
        shadowOffsetX={shadow.offsetX}
        shadowOffsetY={shadow.offsetY}
      />
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
          opacity={style.opacity}
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
