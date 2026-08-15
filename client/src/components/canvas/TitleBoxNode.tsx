import { Group, Image as KonvaImage, Rect, Text } from "react-konva";
import type Konva from "konva";
import useImage from "use-image";
import type { BoxGeometry } from "../../lib/calendarGeometry";
import { formatDateBadge, formatRuntime } from "../../lib/format";
import type { BoxLayout, CornerWeight } from "../../lib/layoutEngine";
import { placeholderGradient } from "../../lib/placeholderPalette";
import { roundedRectPath } from "../../lib/roundedRectPath";
import { measureTextWidth } from "../../lib/textMeasure";
import type { CalendarSpacing, DropShadowSettings, Title } from "../../types/calendar";
import { proxiedImageUrl } from "../../lib/imageProxy";
import { BadgeNode } from "./BadgeNode";
import { MpaBadge } from "./MpaBadge";
import { RichWordText } from "./RichWordText";

interface Props {
  geometry: BoxGeometry;
  boxLayout: BoxLayout;
  title: Title;
  rowHeight: number;
  /** Reference height for date/month text sizing — constant across every card, regardless of that card's own height. */
  standardBoxH: number;
  radii: Pick<CalendarSpacing, "primaryRadius" | "secondaryRadius" | "tertiaryRadius">;
  dateSizing: Pick<CalendarSpacing, "dateNumberSizePct" | "dateMonthSizePct">;
  cardShadow: DropShadowSettings;
  selected: boolean;
  hovered: boolean;
  interactive: boolean;
  onSelect: () => void;
  onHover: (hovering: boolean) => void;
  onImageOffsetChange?: (titleId: string, offsetX: number, offsetY: number) => void;
  onImageScaleChange?: (titleId: string, scale: number) => void;
}

const MIN_IMAGE_SCALE = 0.1;
const MAX_IMAGE_SCALE = 8;

export function TitleBoxNode({
  geometry,
  boxLayout,
  title,
  rowHeight,
  standardBoxH,
  radii,
  dateSizing,
  cardShadow,
  selected,
  hovered,
  interactive,
  onSelect,
  onHover,
  onImageOffsetChange,
  onImageScaleChange,
}: Props) {
  const { x, y, w, h } = geometry;
  const RADIUS_PX: Record<CornerWeight, number> = { most: radii.primaryRadius, some: radii.secondaryRadius, least: radii.tertiaryRadius };
  const cornerRadii: [number, number, number, number] = [
    RADIUS_PX[boxLayout.rounding.tl],
    RADIUS_PX[boxLayout.rounding.tr],
    RADIUS_PX[boxLayout.rounding.br],
    RADIUS_PX[boxLayout.rounding.bl],
  ];
  const [gradA, gradB] = placeholderGradient(title.id);

  const [img] = useImage(proxiedImageUrl(title.image?.url), "anonymous");

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

  function handleImageDragMove(e: Konva.KonvaEventObject<DragEvent>) {
    if (!drawImg || !onImageOffsetChange) return;
    const node = e.target;
    const baseX = x + (w - drawImg.drawW) / 2;
    const baseY = y + (h - drawImg.drawH) / 2;
    onImageOffsetChange(title.id, node.x() - baseX, node.y() - baseY);
  }

  // In details mode, scrolling over the selected card's image scales it instead of zooming the
  // canvas — cancelBubble stops the same wheel event from also reaching the Stage's zoom handler.
  function handleImageWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    if (!onImageScaleChange) return;
    e.evt.preventDefault();
    e.cancelBubble = true;
    const current = title.image?.scale ?? 1;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const next = Math.min(MAX_IMAGE_SCALE, Math.max(MIN_IMAGE_SCALE, current * (1 + direction * 0.08)));
    onImageScaleChange(title.id, next);
  }

  const { mo, dy } = formatDateBadge(title.date);
  const runtimeLabel = formatRuntime(title.runtimeMinutes);
  const nameSize = title.titleTextStyle.fontSize || 15;
  const lineSpacing = title.titleTextStyle.lineSpacing || 1.08;
  const lineCount = (title.titleTextStyle.manualLineBreaks?.length ?? 0) + 1;
  const titleBlockH = nameSize * lineSpacing * lineCount + nameSize * 0.3;
  // Default position: text bottom sits 5% of row height above the card bottom, so every box in a
  // row that shares the same height (series members together, non-members together) lines up.
  const bottomGap = rowHeight * 0.05;

  // Date/month sizing is fixed to a percentage of the standard card height (not this card's own
  // width or height), so it's identical everywhere; the month is centered over the day number.
  const dayFontSize = standardBoxH * dateSizing.dateNumberSizePct;
  const monthFontSize = standardBoxH * dateSizing.dateMonthSizePct;
  const dateMarginX = 8;
  const dateMarginY = 6;
  const dayWidth = measureTextWidth(dy, dayFontSize, "Market Deco", "bold");
  const monthWidth = measureTextWidth(mo, monthFontSize, "Market Deco", "bold");
  const dayX = x + dateMarginX + (title.dateOffsetX ?? 0);
  const monthX = dayX + (dayWidth - monthWidth) / 2;
  const monthY = y + dateMarginY + (title.dateOffsetY ?? 0);
  const dayY = monthY + monthFontSize - 4;

  // Runtime and rating both sit near the bottom-right corner, rotated a quarter turn so they read
  // bottom-to-top; the rating badge anchors closest to the corner and the runtime text stacks
  // just above it along the same edge.
  const cornerMargin = 10;
  const ratingSize = 22 * title.ratingStyle.scale;
  const ratingCenterX = x + w - cornerMargin - ratingSize / 2 + title.ratingStyle.offsetX;
  const ratingCenterY = y + h - cornerMargin - ratingSize / 2 + title.ratingStyle.offsetY;
  const runtimeFontSize = 8.5 * title.runtimeStyle.scale;
  const runtimeX = x + w - cornerMargin + title.runtimeStyle.offsetX;
  const runtimeY = y + h - cornerMargin - ratingSize - 6 + title.runtimeStyle.offsetY;

  return (
    <>
      {/* Shadow caster: a plain rect matching the card's own corners, drawn behind the clipped
          content below so its shadow shows outside the card while the content itself covers it. */}
      <Rect
        x={x}
        y={y}
        width={w}
        height={h}
        cornerRadius={cornerRadii}
        fill="#000000"
        listening={false}
        shadowEnabled={cardShadow.enabled}
        shadowColor={cardShadow.color}
        shadowBlur={cardShadow.blur}
        shadowOpacity={cardShadow.opacity}
        shadowOffsetX={cardShadow.offsetX}
        shadowOffsetY={cardShadow.offsetY}
      />
      <Group
        x={0}
        y={0}
        clipFunc={(ctx) => roundedRectPath(ctx, x, y, w, h, cornerRadii)}
        onClick={interactive ? onSelect : undefined}
        onTap={interactive ? onSelect : undefined}
        onMouseEnter={interactive ? () => onHover(true) : undefined}
        onMouseLeave={interactive ? () => onHover(false) : undefined}
        onWheel={selected && interactive ? handleImageWheel : undefined}
      >
        {/* Base layer: flat placeholder, then the selected image on top, covering the box */}
        <Rect x={x} y={y} width={w} height={h} fillLinearGradientStartPoint={{ x: 0, y: 0 }} fillLinearGradientEndPoint={{ x: w, y: h }} fillLinearGradientColorStops={[0, gradA, 1, gradB]} />
        {drawImg && img && (
          <KonvaImage
            image={img}
            x={drawImg.drawX}
            y={drawImg.drawY}
            width={drawImg.drawW}
            height={drawImg.drawH}
            draggable={selected && interactive}
            onDragMove={handleImageDragMove}
          />
        )}

        <Text
          x={monthX}
          y={monthY}
          text={mo}
          fontFamily="Market Deco"
          fontStyle="bold"
          fontSize={monthFontSize}
          fill="#ffffff"
          letterSpacing={1.2}
          shadowColor="black"
          shadowBlur={4}
          shadowOpacity={0.6}
        />
        <Text x={dayX} y={dayY} text={dy} fontFamily="Market Deco" fontStyle="bold" fontSize={dayFontSize} fill="#ffffff" shadowColor="black" shadowBlur={6} shadowOpacity={0.65} />

        {hovered && interactive && !selected && <Rect x={x} y={y} width={w} height={h} fill="#ffffff" opacity={0.12} />}

        {title.ratingVisible && (
          <MpaBadge
            rating={title.mpaRating}
            centerX={ratingCenterX}
            centerY={ratingCenterY}
            size={ratingSize}
            rotation={-90}
            opacity={title.ratingStyle.opacity}
            dropShadow={title.ratingStyle.dropShadow}
            dropShadowOpacity={title.ratingStyle.dropShadowOpacity}
          />
        )}

        {title.name && (
          <RichWordText
            text={title.name}
            x={x + 8}
            y={y + h - titleBlockH - bottomGap}
            width={w - 16}
            height={titleBlockH}
            baseFontSize={nameSize}
            wordSizes={title.titleTextStyle.wordSizes}
            manualLineBreaks={title.titleTextStyle.manualLineBreaks}
            fontFamily="Futura Wizard Condensed"
            kerning={title.titleTextStyle.kerning}
            lineHeightMultiplier={lineSpacing}
            justify={title.titleTextStyle.justify}
            color="#ffffff"
            dropShadow={title.titleTextStyle.dropShadow}
            verticalAlign="bottom"
            uppercase
            offsetX={title.titleTextStyle.offsetX}
            offsetY={title.titleTextStyle.offsetY}
          />
        )}

        {runtimeLabel && (
          <Text
            x={runtimeX}
            y={runtimeY}
            text={runtimeLabel}
            rotation={-90}
            fontFamily="Futura Wizard"
            fontSize={runtimeFontSize}
            fill="#ffffff"
            opacity={title.runtimeStyle.opacity}
            shadowEnabled={title.runtimeStyle.dropShadow}
            shadowColor="black"
            shadowBlur={3}
            shadowOpacity={title.runtimeStyle.dropShadowOpacity}
          />
        )}

        {title.badges.map((badge, i) => (
          <BadgeNode key={badge.id} badge={badge} boxX={x} boxY={y} boxW={w} boxH={h} stackIndex={i} />
        ))}
      </Group>
    </>
  );
}
