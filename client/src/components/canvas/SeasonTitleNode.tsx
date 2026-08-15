import { Fragment } from "react";
import { Text } from "react-konva";
import { buildEchoLayers } from "../../lib/echoEffect";
import { measureTextWidth } from "../../lib/textMeasure";
import type { SeasonTitleStyle } from "../../types/calendar";

interface Props {
  /** Top-left of the bounding box before offsetX/offsetY/scale are applied. */
  x: number;
  y: number;
  seasonLabel: string;
  year: string;
  style: SeasonTitleStyle;
}

// The recipe is fixed by design, not user-adjustable: Futura Bold 45pt for the season name and
// Futura Medium 59pt for the year, both with tight tracking (in thousandths-of-an-em, the standard
// design-tool "tracking" unit — e.g. -80 at 45pt is -3.6pt of letter-spacing, not -80px).
const SEASON_FONT_SIZE = 45;
const SEASON_TRACKING = -80;
const YEAR_FONT_SIZE = 59;
const YEAR_TRACKING = -40;
const GAP = 14;

export function SeasonTitleNode({ x, y, seasonLabel, year, style }: Props) {
  if (!style.visible) return null;
  const scale = style.scale;

  const seasonFontSize = SEASON_FONT_SIZE * scale;
  const yearFontSize = YEAR_FONT_SIZE * scale;
  const seasonKerning = (SEASON_TRACKING / 1000) * seasonFontSize;
  const yearKerning = (YEAR_TRACKING / 1000) * yearFontSize;
  const seasonText = seasonLabel.toUpperCase();

  const seasonWidth = measureTextWidth(seasonText, seasonFontSize, "Futura Wizard", "700") + seasonKerning * Math.max(0, seasonText.length - 1);
  const gap = GAP * scale;

  const baseX = x + style.offsetX;
  const baseTopY = y + style.offsetY;
  // Both runs share a baseline; since this is all-caps + digits (no descenders), aligning bottoms
  // is an accurate stand-in for true baseline alignment.
  const seasonX = baseX;
  const seasonY = baseTopY + (yearFontSize - seasonFontSize);
  const yearX = baseX + seasonWidth + gap;
  const yearY = baseTopY;

  const layers = buildEchoLayers(
    { front: style.frontColor, echo1: style.echo1Color, echo2: style.echo2Color, echo3: style.echo3Color },
    scale,
    style.echoSpread
  );

  return (
    <>
      {layers.map(({ key, color, dx, dy }) => (
        <Fragment key={key}>
          <Text x={seasonX + dx} y={seasonY + dy} text={seasonText} fontFamily="Futura Wizard" fontStyle="700" fontSize={seasonFontSize} letterSpacing={seasonKerning} fill={color} listening={false} />
          <Text x={yearX + dx} y={yearY + dy} text={year} fontFamily="Futura Wizard" fontStyle="500" fontSize={yearFontSize} letterSpacing={yearKerning} fill={color} listening={false} />
        </Fragment>
      ))}
    </>
  );
}
