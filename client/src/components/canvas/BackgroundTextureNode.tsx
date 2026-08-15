import { useMemo } from "react";
import { Rect } from "react-konva";
import { getTextureTile } from "../../lib/textureTiles";
import type { BackgroundTexture } from "../../types/calendar";

interface Props {
  texture: BackgroundTexture;
  width: number;
  height: number;
}

/** Overlays a subtly repeating pattern on top of the background fill, sitting under the cards/header/footer. */
export function BackgroundTextureNode({ texture, width, height }: Props) {
  const tile = useMemo(() => (texture.style === "none" ? null : getTextureTile(texture.style)), [texture.style]);
  if (!tile || texture.opacity <= 0) return null;
  // Konva's own type defs only list HTMLImageElement here, but at runtime it just forwards to
  // CanvasRenderingContext2D.createPattern, which accepts any CanvasImageSource including a canvas.
  return <Rect x={0} y={0} width={width} height={height} fillPatternImage={tile as unknown as HTMLImageElement} fillPatternRepeat="repeat" opacity={texture.opacity} listening={false} />;
}
