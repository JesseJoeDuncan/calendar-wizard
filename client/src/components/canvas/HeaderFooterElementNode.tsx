import Konva from "konva";
import { useEffect, useRef } from "react";
import { Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { buildEchoLayers } from "../../lib/echoEffect";
import type { EchoLayerStyle } from "../../types/calendar";

interface Props {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  /** The element's own size multiplier — scales the echo offset distance to match, same as SeasonTitleNode. */
  scale?: number;
  /** When set, renders with the same extruded/echoed look as the season title (see echoEffect.ts). */
  echo?: EchoLayerStyle;
  listening?: boolean;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const n = parseInt(full, 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

interface TintedCopyProps {
  img: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  listening: boolean;
}

/**
 * Renders a white-on-transparent mask PNG tinted to an arbitrary color via Konva's RGB filter.
 * Since the source is pure white wherever opaque, the filter's luminance-weighted output equals
 * the target color exactly, with the original alpha (including anti-aliased edges) preserved.
 */
function TintedCopy({ img, x, y, width, height, color, listening }: TintedCopyProps) {
  const nodeRef = useRef<Konva.Image>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    node.cache();
    node.filters([Konva.Filters.RGB]);
    const [r, g, b] = hexToRgb(color);
    node.red(r);
    node.green(g);
    node.blue(b);
    node.getLayer()?.batchDraw();
  }, [img, color, width, height, x, y]);

  return <KonvaImage ref={nodeRef} image={img} x={x} y={y} width={width} height={height} listening={listening} />;
}

export function HeaderFooterElementNode({ src, x, y, width, height, color, scale = 1, echo, listening = false }: Props) {
  const [img] = useImage(src);
  if (!img) return null;

  if (!echo) {
    return <TintedCopy img={img} x={x} y={y} width={width} height={height} color={color} listening={listening} />;
  }

  const layers = buildEchoLayers({ front: color, echo1: echo.echo1Color, echo2: echo.echo2Color, echo3: echo.echo3Color }, scale, echo.echoSpread);
  return (
    <>
      {layers.map((l) => (
        <TintedCopy key={l.key} img={img} x={x + l.dx} y={y + l.dy} width={width} height={height} color={l.color} listening={listening} />
      ))}
    </>
  );
}
