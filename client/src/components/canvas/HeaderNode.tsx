import { Image as KonvaImage, Rect, Text } from "react-konva";
import useImage from "use-image";
import { proxiedImageUrl } from "../../lib/imageProxy";
import type { Calendar } from "../../types/calendar";

interface Props {
  calendar: Calendar;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function HeaderNode({ calendar, x, y, w, h }: Props) {
  const { venue, theme, season, customSeasonLabel, year } = calendar;
  const [logo] = useImage(proxiedImageUrl(venue.logoUrl), "anonymous");

  const badgeH = h * 0.4;
  const logoH = badgeH * 0.62;
  const logoW = logo ? (logo.width / logo.height) * logoH : logoH;
  const badgeW = logoW + badgeH * 0.5;
  const badgeY = y + h * 0.52 - badgeH / 2;

  const seasonLabel = (season === "Custom" ? customSeasonLabel || "SEASON" : season).toUpperCase();
  const yearLabel = String(year);

  const seasonFontSize = h * 0.24;
  const yearFontSize = h * 0.3;
  const seasonWidth = seasonLabel.length * seasonFontSize * 0.56;
  const yearWidth = yearLabel.length * yearFontSize * 0.5;
  const gap = 14;
  const blockWidth = badgeW + 18 + seasonWidth + gap + yearWidth;
  const blockStartX = x + (w - blockWidth) / 2;

  const seasonX = blockStartX + badgeW + 18;
  const yearX = seasonX + seasonWidth + gap;
  const textBaselineY = y + h * 0.5;

  return (
    <>
      <Text
        x={x}
        y={y + h * 0.15}
        width={w}
        align="center"
        text={venue.kicker}
        fontFamily="Futura Wizard"
        fontStyle="bold"
        fontSize={h * 0.09}
        letterSpacing={2.4}
        fill="#ffffff"
        opacity={0.92}
      />

      <Rect x={blockStartX} y={badgeY} width={badgeW} height={badgeH} cornerRadius={6} fill="#fdf8ee" shadowColor="black" shadowBlur={4} shadowOpacity={0.2} />
      {logo && <KonvaImage image={logo} x={blockStartX + (badgeW - logoW) / 2} y={badgeY + (badgeH - logoH) / 2} width={logoW} height={logoH} />}

      {/* Layered/outlined retro wordmark: pale shadow copy behind, outlined main text in front */}
      <Text x={seasonX + 4} y={textBaselineY - seasonFontSize / 2 + 3} text={seasonLabel} fontFamily="Market Deco" fontSize={seasonFontSize} fill="#f6d989" />
      <Text
        x={seasonX}
        y={textBaselineY - seasonFontSize / 2}
        text={seasonLabel}
        fontFamily="Market Deco"
        fontSize={seasonFontSize}
        fill="#ffffff"
        stroke={theme.seasonTextColor}
        strokeWidth={1.5}
      />

      <Text x={yearX + 3} y={textBaselineY - yearFontSize / 2 + 3} text={yearLabel} fontFamily="Futura Wizard Condensed" fontStyle="bold" fontSize={yearFontSize} fill="#f6d989" opacity={0.8} />
      <Text
        x={yearX}
        y={textBaselineY - yearFontSize / 2}
        text={yearLabel}
        fontFamily="Futura Wizard Condensed"
        fontStyle="bold"
        fontSize={yearFontSize}
        fill={theme.seasonTextColor}
      />
    </>
  );
}
