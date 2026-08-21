import { Image as KonvaImage, Text } from "react-konva";
import useImage from "use-image";
import { measureTextWidth } from "../../lib/textMeasure";
import type { CustomElementStyle } from "../../types/calendar";

interface Props {
  element: CustomElementStyle;
  /** Center point this element's offset/scale are relative to — the header/footer's default spawn point, or a card's center. */
  anchorX: number;
  anchorY: number;
}

/**
 * Renders one freeform user-added text or image layer, used both per-title (Title.customElements)
 * and in the header/footer (CalendarHeaderFooter.customElements). Always centered on anchor+offset
 * so resizing (scale) doesn't visibly drift the element's position.
 */
export function CustomElementNode({ element, anchorX, anchorY }: Props) {
  if (!element.visible) return null;
  const x = anchorX + element.offsetX;
  const y = anchorY + element.offsetY;

  if (element.kind === "text") {
    const fontFamily = element.fontFamily ?? "Futura Wizard";
    const fontSize = (element.fontSize ?? 16) * element.scale;
    const text = element.text ?? "";
    const width = measureTextWidth(text, fontSize, fontFamily, "normal");
    return (
      <Text
        x={x}
        y={y}
        text={text}
        fontFamily={fontFamily}
        fontSize={fontSize}
        fill={element.color ?? "#000000"}
        letterSpacing={element.kerning ?? 0}
        offsetX={width / 2}
        offsetY={fontSize / 2}
        listening={false}
      />
    );
  }

  return <CustomImageElement element={element} x={x} y={y} />;
}

function CustomImageElement({ element, x, y }: { element: CustomElementStyle; x: number; y: number }) {
  const [img] = useImage(element.imageUrl ?? "");
  if (!img) return null;
  const width = img.width * element.scale;
  const height = img.height * element.scale;
  return <KonvaImage image={img} x={x} y={y} width={width} height={height} offsetX={width / 2} offsetY={height / 2} listening={false} />;
}
