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
  return <Rect x={0} y={0} width={width} height={height} fillPatternImage={tile} fillPatternRepeat="repeat" opacity={texture.opacity} listening={false} />;
}
