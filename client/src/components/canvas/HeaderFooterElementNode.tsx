import Konva from "konva";
import { useEffect, useRef } from "react";
import { Image as KonvaImage } from "react-konva";
import useImage from "use-image";

interface Props {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  listening?: boolean;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const n = parseInt(full, 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Renders a white-on-transparent mask PNG tinted to an arbitrary color via Konva's RGB filter.
 * Since the source is pure white wherever opaque, the filter's luminance-weighted output equals
 * the target color exactly, with the original alpha (including anti-aliased edges) preserved.
 */
export function HeaderFooterElementNode({ src, x, y, width, height, color, listening = false }: Props) {
  const [img] = useImage(src);
  const nodeRef = useRef<Konva.Image>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || !img) return;
    node.cache();
    node.filters([Konva.Filters.RGB]);
    const [r, g, b] = hexToRgb(color);
    node.red(r);
    node.green(g);
    node.blue(b);
    node.getLayer()?.batchDraw();
  }, [img, color, width, height]);

  if (!img) return null;
  return <KonvaImage ref={nodeRef} image={img} x={x} y={y} width={width} height={height} listening={listening} />;
}
