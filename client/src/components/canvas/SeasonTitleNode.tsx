import { Fragment } from "react";
import { Text } from "react-konva";
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

// Each "echo" is several copies of the previous layer, nudged right/up from the last and merged
// into one flat-colored shape, then the whole thing repeats behind itself twice more. Since every
// copy within a layer shares one solid color, stacking same-colored copies looks identical to a
// true merged union — so this renders as 1 (front) + N+N+N (echoes) copies of the season+year
// lockup, back-to-front, without needing any actual path-boolean merge. Step size is tuned so all
// 3 echoes together reach back only about 1/3 of the year text's height, not a long trailing smear.
const ECHO_STEP_X = 0.55;
const ECHO_STEP_Y = -1.1;
const ECHO_COPIES = 6;

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

  const layers: { k: number; color: string }[] = [];
  for (let k = ECHO_COPIES * 3; k >= ECHO_COPIES * 2 + 1; k--) layers.push({ k, color: style.echo3Color });
  for (let k = ECHO_COPIES * 2; k >= ECHO_COPIES + 1; k--) layers.push({ k, color: style.echo2Color });
  for (let k = ECHO_COPIES; k >= 1; k--) layers.push({ k, color: style.echo1Color });
  layers.push({ k: 0, color: style.frontColor });

  return (
    <>
      {layers.map(({ k, color }) => {
        const dx = k * ECHO_STEP_X * scale;
        const dy = k * ECHO_STEP_Y * scale;
        return (
          <Fragment key={k}>
            <Text x={seasonX + dx} y={seasonY + dy} text={seasonText} fontFamily="Futura Wizard" fontStyle="700" fontSize={seasonFontSize} letterSpacing={seasonKerning} fill={color} listening={false} />
            <Text x={yearX + dx} y={yearY + dy} text={year} fontFamily="Futura Wizard" fontStyle="500" fontSize={yearFontSize} letterSpacing={yearKerning} fill={color} listening={false} />
          </Fragment>
        );
      })}
    </>
  );
}
