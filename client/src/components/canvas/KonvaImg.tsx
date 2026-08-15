import { Image as KImage } from "react-konva";
import useImage from "use-image";
import { proxiedImageUrl } from "../../lib/imageProxy";

interface Props {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
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

export function KonvaImg({ src, x, y, width, height, opacity = 1, listening = false, rotation, offsetX, offsetY, ...shadow }: Props) {
  const [img] = useImage(proxiedImageUrl(src), "anonymous");
  if (!img) return null;
  return (
    <KImage
      image={img}
      x={x}
      y={y}
      width={width}
      height={height}
      opacity={opacity}
      listening={listening}
      rotation={rotation}
      offsetX={offsetX}
      offsetY={offsetY}
      {...shadow}
    />
  );
}
