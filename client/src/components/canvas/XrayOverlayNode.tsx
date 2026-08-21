import { Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { computeImageDrawRect } from "../../lib/imageFit";
import { proxiedImageUrl } from "../../lib/imageProxy";
import type { BoxGeometry } from "../../lib/calendarGeometry";
import type { Title } from "../../types/calendar";

interface Props {
  title: Title;
  geometry: BoxGeometry;
}

/** Draws the selected title's image unclipped, at full opacity, over the rest of the (dimmed) scene — lets the user see the full extent of the image beyond the card's own bounds. */
export function XrayOverlayNode({ title, geometry }: Props) {
  const [img] = useImage(proxiedImageUrl(title.image?.url), "anonymous");
  if (!img || !title.image) return null;
  const { x, y, w, h } = geometry;
  const rect = computeImageDrawRect({
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
  });
  return (
    <KonvaImage
      image={img}
      x={rect.centerX}
      y={rect.centerY}
      width={rect.width}
      height={rect.height}
      offsetX={rect.offsetX}
      offsetY={rect.offsetY}
      rotation={rect.rotation}
      scaleX={rect.scaleX}
      scaleY={rect.scaleY}
      listening={false}
    />
  );
}
