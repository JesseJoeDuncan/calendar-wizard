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
import { RichWordText } from "./RichWordText";

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

  const [img] = useImage(title.image?.url || "", "anonymous");

  let drawImg: { drawX: number; drawY: number; drawW: number; drawH: number } | null = null;
  if (img) {
    const scale = title.image?.scale ?? 1;
    const cover = Math.max(w / img.width, h / img.height) * scale;
    const drawW = img.width * cover;
    const drawH = img.height * cover;
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
  const titleBlockH = Math.max(nameSize * 2.6, h * 0.32);

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
      {/* Base layer: flat placeholder, then the selected image on top, covering the box */}
      <Rect x={x} y={y} width={w} height={h} fillLinearGradientStartPoint={{ x: 0, y: 0 }} fillLinearGradientEndPoint={{ x: w, y: h }} fillLinearGradientColorStops={[0, gradA, 1, gradB]} />
      {drawImg && img && <KonvaImage image={img} x={drawImg.drawX} y={drawImg.drawY} width={drawImg.drawW} height={drawImg.drawH} />}

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

      {hovered && interactive && !selected && <Rect x={x} y={y} width={w} height={h} fill="#ffffff" opacity={0.12} />}

      {title.ratingVisible && <MpaBadge rating={title.mpaRating} x={x + w - 30} y={y + 8} opacity={title.ratingOpacity} />}

      {title.name && (
        <RichWordText
          text={title.name}
          x={x + 8}
          y={y + h - titleBlockH - 4}
          width={w - 16}
          height={titleBlockH}
          baseFontSize={nameSize}
          wordSizes={title.titleTextStyle.wordSizes}
          fontFamily="Futura Wizard"
          kerning={title.titleTextStyle.kerning}
          justify={title.titleTextStyle.justify}
          color="#ffffff"
          dropShadow={title.titleTextStyle.dropShadow}
          verticalAlign="bottom"
          uppercase
          offsetX={title.titleTextStyle.offsetX}
          offsetY={title.titleTextStyle.offsetY}
        />
      )}

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
