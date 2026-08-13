import { Group, Image as KonvaImage, Rect, Text } from "react-konva";
import useImage from "use-image";
import type { BoxGeometry } from "../../lib/calendarGeometry";
import { formatDateBadge, formatRuntime } from "../../lib/format";
import type { BoxLayout, CornerWeight } from "../../lib/layoutEngine";
import { placeholderGradient } from "../../lib/placeholderPalette";
import { roundedRectPath } from "../../lib/roundedRectPath";
import type { Title } from "../../types/calendar";
import { BadgeNode } from "./BadgeNode";
import { MpaBadge } from "./MpaBadge";

/** Corner radius as a fraction of box width, per adjacency weight. */
const RADIUS_FRACTION: Record<CornerWeight, number> = { most: 0.13, some: 0.045, least: 0.01 };

interface Props {
  geometry: BoxGeometry;
  boxLayout: BoxLayout;
  title: Title;
  selected: boolean;
  hovered: boolean;
  interactive: boolean;
  onSelect: () => void;
  onHover: (hovering: boolean) => void;
}

export function TitleBoxNode({ geometry, boxLayout, title, selected, hovered, interactive, onSelect, onHover }: Props) {
  const { x, y, w, h } = geometry;
  const radii: [number, number, number, number] = [
    RADIUS_FRACTION[boxLayout.rounding.tl] * w,
    RADIUS_FRACTION[boxLayout.rounding.tr] * w,
    RADIUS_FRACTION[boxLayout.rounding.br] * w,
    RADIUS_FRACTION[boxLayout.rounding.bl] * w,
  ];
  const [gradA, gradB] = placeholderGradient(title.id);

  const [baseImg] = useImage(title.image?.url || "", "anonymous");
  const [cutoutImg] = useImage(title.image?.cutoutUrl || "", "anonymous");
  const dimSource = baseImg || cutoutImg;

  let drawImg: { drawX: number; drawY: number; drawW: number; drawH: number } | null = null;
  if (dimSource) {
    const scale = title.image?.scale ?? 1;
    const cover = Math.max(w / dimSource.width, h / dimSource.height) * scale;
    const drawW = dimSource.width * cover;
    const drawH = dimSource.height * cover;
    drawImg = {
      drawW,
      drawH,
      drawX: x + (w - drawW) / 2 + (title.image?.offsetX ?? 0),
      drawY: y + (h - drawH) / 2 + (title.image?.offsetY ?? 0),
    };
  }

  const { mo, dy } = formatDateBadge(title.date);
  const runtimeLabel = formatRuntime(title.runtimeMinutes);
  const nameSize = title.titleTextStyle.fontSize;

  return (
    <Group
      x={0}
      y={0}
      clipFunc={(ctx) => roundedRectPath(ctx, x, y, w, h, radii)}
      onClick={interactive ? onSelect : undefined}
      onTap={interactive ? onSelect : undefined}
      onMouseEnter={interactive ? () => onHover(true) : undefined}
      onMouseLeave={interactive ? () => onHover(false) : undefined}
    >
      {/* Base layer: flat placeholder, then the full source still underneath everything */}
      <Rect x={x} y={y} width={w} height={h} fillLinearGradientStartPoint={{ x: 0, y: 0 }} fillLinearGradientEndPoint={{ x: w, y: h }} fillLinearGradientColorStops={[0, gradA, 1, gradB]} />
      {drawImg && baseImg && <KonvaImage image={baseImg} x={drawImg.drawX} y={drawImg.drawY} width={drawImg.drawW} height={drawImg.drawH} />}

      {/* Date badge sits between the background photo and the cutout subject, so the subject can overlap it */}
      <Text
        x={x + 8 + (title.dateOffsetX ?? 0)}
        y={y + 6 + (title.dateOffsetY ?? 0)}
        text={mo}
        fontFamily="Futura Wizard"
        fontStyle="bold"
        fontSize={Math.max(10, w * 0.075)}
        fill="#ffffff"
        letterSpacing={1.2}
        shadowColor="black"
        shadowBlur={4}
        shadowOpacity={0.6}
      />
      <Text
        x={x + 6 + (title.dateOffsetX ?? 0)}
        y={y + 6 + Math.max(10, w * 0.075) + 1 + (title.dateOffsetY ?? 0)}
        text={dy}
        fontFamily="Futura Wizard Condensed"
        fontStyle="bold"
        fontSize={Math.max(20, w * 0.24)}
        fill="#ffffff"
        shadowColor="black"
        shadowBlur={6}
        shadowOpacity={0.65}
      />

      {/* Cutout subject: same registration as the base photo, layered on top of the date */}
      {drawImg && cutoutImg && <KonvaImage image={cutoutImg} x={drawImg.drawX} y={drawImg.drawY} width={drawImg.drawW} height={drawImg.drawH} />}

      {hovered && interactive && !selected && <Rect x={x} y={y} width={w} height={h} fill="#ffffff" opacity={0.12} />}

      {title.ratingVisible && <MpaBadge rating={title.mpaRating} x={x + w - 30} y={y + 8} opacity={title.ratingOpacity} />}

      {/* Title text */}
      <Text
        x={x + 8}
        y={y + h - nameSize * 2.3}
        width={w - 16}
        text={title.name.toUpperCase()}
        fontFamily="Futura Wizard"
        fontStyle="bold"
        fontSize={nameSize}
        letterSpacing={title.titleTextStyle.kerning}
        align={title.titleTextStyle.justify}
        fill="#ffffff"
        shadowColor="black"
        shadowBlur={title.titleTextStyle.dropShadow ? 5 : 0}
        shadowOpacity={title.titleTextStyle.dropShadow ? 0.7 : 0}
        lineHeight={1.05}
      />

      {/* Runtime, rotated to run top-to-bottom along the right edge */}
      {runtimeLabel && (
        <Text
          x={x + w - 5}
          y={y + 10}
          text={runtimeLabel}
          rotation={90}
          fontFamily="Futura Wizard"
          fontSize={8.5}
          fill="#ffffff"
          opacity={title.runtimeOpacity}
          shadowColor="black"
          shadowBlur={3}
          shadowOpacity={0.5}
        />
      )}

      {title.badges.map((badge, i) => (
        <BadgeNode key={badge.id} badge={badge} boxX={x} boxY={y} boxW={w} boxH={h} stackIndex={i} />
      ))}
    </Group>
  );
}
