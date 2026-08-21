import { Group, Image as KonvaImage, Rect, Text } from "react-konva";
import type Konva from "konva";
import useImage from "use-image";
import type { BoxGeometry } from "../../lib/calendarGeometry";
import { formatDateBadge, formatRuntime } from "../../lib/format";
import { computeImageDrawRect } from "../../lib/imageFit";
import type { BoxLayout, CornerWeight } from "../../lib/layoutEngine";
import { placeholderGradient } from "../../lib/placeholderPalette";
import { roundedRectPath } from "../../lib/roundedRectPath";
import { measureTextWidth } from "../../lib/textMeasure";
import type { CalendarSpacing, CardTextDefaults, DropShadowSettings, Title } from "../../types/calendar";
import { proxiedImageUrl } from "../../lib/imageProxy";
import { BadgeNode } from "./BadgeNode";
import { CustomElementNode } from "./CustomElementNode";
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
  dateSizing: Pick<CalendarSpacing, "dateNumberSizePct" | "dateMonthSizePct" | "dateMonthGap">;
  cardShadow: DropShadowSettings;
  cardText: CardTextDefaults;
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
  cardText,
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

  const drawImg =
    img && title.image
      ? computeImageDrawRect({
          boxX: x,
          boxY: y,
          boxW: w,
          boxH: h,
          imgW: img.width,
          imgH: img.height,
          scale: title.image.scale,
          userOffsetX: title.image.offsetX,
          userOffsetY: title.image.offsetY,
          rotation: title.image.rotation,
          flipHorizontal: title.image.flipHorizontal,
          flipVertical: title.image.flipVertical,
        })
      : null;

  function handleImageDragMove(e: Konva.KonvaEventObject<DragEvent>) {
    if (!onImageOffsetChange) return;
    const node = e.target;
    const boxCenterX = x + w / 2;
    const boxCenterY = y + h / 2;
    onImageOffsetChange(title.id, node.x() - boxCenterX, node.y() - boxCenterY);
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
  // Default position: text bottom sits bottomGapPct of row height above the card bottom, so every
  // box in a row that shares the same height (series members together, non-members together) lines up.
  const bottomGap = rowHeight * cardText.title.bottomGapPct;

  // Date/month sizing is fixed to a percentage of the standard card height (not this card's own
  // width or height), so it's identical everywhere; the month is centered over the day number.
  const dayFontSize = standardBoxH * dateSizing.dateNumberSizePct;
  const monthFontSize = standardBoxH * dateSizing.dateMonthSizePct;
  const dateMarginX = cardText.date.marginX;
  const dateMarginY = cardText.date.marginY;
  const dayWidth = measureTextWidth(dy, dayFontSize, cardText.date.fontFamily, "bold");
  const monthWidth = measureTextWidth(mo, monthFontSize, cardText.date.fontFamily, "bold");
  const dayX = x + dateMarginX + (title.dateOffsetX ?? 0);
  const monthX = dayX + (dayWidth - monthWidth) / 2;
  const monthY = y + dateMarginY + (title.dateOffsetY ?? 0);
  const dayY = monthY + monthFontSize + dateSizing.dateMonthGap;

  // Runtime and rating both sit near the bottom-right corner, rotated a quarter turn so they read
  // bottom-to-top; the rating badge anchors closest to the corner and the runtime text stacks just
  // above it along the same edge. Base sizes are tuned so the two read at a similar line-height by
  // default. Rating additionally supports a per-rating size multiplier and can lock its horizontal
  // center to the runtime text's anchor line instead of using its own corner margin.
  const ratingMultiplier = cardText.rating.sizeByRating[title.mpaRating] ?? 1;
  const ratingSize = cardText.rating.baseSize * ratingMultiplier * title.ratingStyle.scale;
  const runtimeFontSize = cardText.runtime.baseSize * title.runtimeStyle.scale;
  const runtimeX = x + w - cardText.runtime.marginX + title.runtimeStyle.offsetX;
  const runtimeY = y + h - cardText.runtime.marginY - ratingSize - 6 + title.runtimeStyle.offsetY;
  const ratingCenterX = (cardText.rating.snapToRuntimeX ? runtimeX : x + w - cardText.runtime.marginX) - ratingSize / 2 + title.ratingStyle.offsetX;
  const ratingCenterY = y + h - cardText.runtime.marginY - ratingSize / 2 + title.ratingStyle.offsetY;

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
        {drawImg && img && title.imageVisible && (
          <KonvaImage
            image={img}
            x={drawImg.centerX}
            y={drawImg.centerY}
            width={drawImg.width}
            height={drawImg.height}
            offsetX={drawImg.offsetX}
            offsetY={drawImg.offsetY}
            rotation={drawImg.rotation}
            scaleX={drawImg.scaleX}
            scaleY={drawImg.scaleY}
            draggable={selected && interactive}
            onDragMove={handleImageDragMove}
          />
        )}

        {title.dateVisible && (
          <>
            <Text
              x={monthX}
              y={monthY}
              text={mo}
              fontFamily={cardText.date.fontFamily}
              fontStyle="bold"
              fontSize={monthFontSize}
              fill={cardText.date.color}
              letterSpacing={cardText.date.monthKerning}
              opacity={title.dateStyle.opacity}
              shadowColor={cardText.date.dropShadowColor}
              shadowBlur={cardText.date.dropShadowBlur}
              shadowOpacity={title.dateStyle.dropShadowOpacity}
            />
            <Text
              x={dayX}
              y={dayY}
              text={dy}
              fontFamily={cardText.date.fontFamily}
              fontStyle="bold"
              fontSize={dayFontSize}
              fill={cardText.date.color}
              letterSpacing={title.dateStyle.numberKerning}
              opacity={title.dateStyle.opacity}
              shadowColor={cardText.date.dropShadowColor}
              shadowBlur={cardText.date.dropShadowBlur}
              shadowOpacity={title.dateStyle.dropShadowOpacity}
            />
          </>
        )}

        {hovered && interactive && !selected && <Rect x={x} y={y} width={w} height={h} fill="#ffffff" opacity={0.12} />}

        {title.ratingVisible && (
          <MpaBadge
            rating={title.mpaRating}
            centerX={ratingCenterX}
            centerY={ratingCenterY}
            size={ratingSize}
            rotation={-90}
            opacity={title.ratingStyle.opacity}
            color={cardText.rating.color}
            dropShadow={title.ratingStyle.dropShadow}
            dropShadowColor={cardText.rating.dropShadowColor}
            dropShadowBlur={cardText.rating.dropShadowBlur}
            dropShadowOpacity={title.ratingStyle.dropShadowOpacity}
          />
        )}

        {title.name && title.titleVisible && (
          <RichWordText
            text={title.name}
            x={x + cardText.title.marginX}
            y={y + h - titleBlockH - bottomGap}
            width={w - cardText.title.marginX * 2}
            height={titleBlockH}
            baseFontSize={nameSize}
            wordSizes={title.titleTextStyle.wordSizes}
            manualLineBreaks={title.titleTextStyle.manualLineBreaks}
            fontFamily={cardText.title.fontFamily}
            kerning={title.titleTextStyle.kerning}
            lineHeightMultiplier={lineSpacing}
            justify={title.titleTextStyle.justify}
            color={cardText.title.color}
            dropShadow={title.titleTextStyle.dropShadow}
            dropShadowColor={cardText.title.dropShadowColor}
            dropShadowBlur={cardText.title.dropShadowBlur}
            verticalAlign="bottom"
            uppercase
            offsetX={title.titleTextStyle.offsetX}
            offsetY={title.titleTextStyle.offsetY}
          />
        )}

        {runtimeLabel && title.runtimeVisible && (
          <Text
            x={runtimeX}
            y={runtimeY}
            text={runtimeLabel}
            rotation={-90}
            fontFamily={cardText.runtime.fontFamily}
            fontSize={runtimeFontSize}
            fill={cardText.runtime.color}
            letterSpacing={cardText.runtime.kerning}
            opacity={title.runtimeStyle.opacity}
            shadowColor={cardText.runtime.dropShadowColor}
            shadowBlur={cardText.runtime.dropShadowBlur}
            shadowOpacity={title.runtimeStyle.dropShadowOpacity}
          />
        )}

        {title.badges.map((badge, i) => (
          <BadgeNode key={badge.id} badge={badge} boxX={x} boxY={y} boxW={w} boxH={h} stackIndex={i} />
        ))}

        {title.customElements.map((el) => (
          <CustomElementNode key={el.id} element={el} anchorX={x + w / 2} anchorY={y + h / 2} />
        ))}
      </Group>
    </>
  );
}
