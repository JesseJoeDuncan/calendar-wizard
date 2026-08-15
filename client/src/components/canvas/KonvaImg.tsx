import { Image as KImage } from "react-konva";
import useImage from "use-image";
import { proxiedImageUrl } from "../../lib/imageProxy";

interface Props {
  src: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  /**
   * Alternative to x/y/width/height: fits the image within a maxSize×maxSize box, preserving its
   * natural aspect ratio, centered at (centerX, centerY). offsetX/offsetY (the rotation pivot) are
   * derived from the actual fitted size, not maxSize, so rotation stays centered on non-square art.
   */
  centerX?: number;
  centerY?: number;
  maxSize?: number;
  opacity?: number;
  listening?: boolean;
  rotation?: number;
  offsetX?: number;
  offsetY?: number;
  shadowEnabled?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOpacity?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
}

export function KonvaImg({ src, x, y, width, height, centerX, centerY, maxSize, opacity = 1, listening = false, rotation, offsetX, offsetY, ...shadow }: Props) {
  const [img] = useImage(proxiedImageUrl(src), "anonymous");
  if (!img) return null;

  let finalX = x;
  let finalY = y;
  let finalW = width;
  let finalH = height;
  let finalOffsetX = offsetX;
  let finalOffsetY = offsetY;
  if (maxSize !== undefined && centerX !== undefined && centerY !== undefined) {
    const aspect = img.width / img.height;
    finalW = aspect >= 1 ? maxSize : maxSize * aspect;
    finalH = aspect >= 1 ? maxSize / aspect : maxSize;
    finalX = centerX;
    finalY = centerY;
    finalOffsetX = finalW / 2;
    finalOffsetY = finalH / 2;
  }

  return (
    <KImage
      image={img}
      x={finalX}
      y={finalY}
      width={finalW}
      height={finalH}
      opacity={opacity}
      listening={listening}
      rotation={rotation}
      offsetX={finalOffsetX}
      offsetY={finalOffsetY}
      {...shadow}
    />
  );
}
