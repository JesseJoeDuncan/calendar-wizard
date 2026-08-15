import type { MpaRating } from "../../types/calendar";
import { KonvaImg } from "./KonvaImg";

const FILES: Record<MpaRating, string> = {
  G: "Rated_G.png",
  PG: "Rated_PG.png",
  "PG-13": "Rated_PG-13.png",
  R: "Rated_R.png",
  "NC-17": "Rated_NC-17.png",
  NR: "Not_Rated.png",
};

interface Props {
  rating: MpaRating;
  /** Center position — the badge rotates in place around its own center, not a corner. */
  centerX: number;
  centerY: number;
  size: number;
  rotation: number;
  opacity: number;
  color: string;
  dropShadow: boolean;
  dropShadowColor: string;
  dropShadowBlur: number;
  dropShadowOpacity: number;
}

export function MpaBadge({ rating, centerX, centerY, size, rotation, opacity, color, dropShadow, dropShadowColor, dropShadowBlur, dropShadowOpacity }: Props) {
  return (
    <KonvaImg
      src={`/assets/mpaa-white/${FILES[rating]}`}
      centerX={centerX}
      centerY={centerY}
      maxSize={size}
      rotation={rotation}
      opacity={opacity}
      tintColor={color}
      shadowEnabled={dropShadow}
      shadowColor={dropShadowColor}
      shadowBlur={dropShadowBlur}
      shadowOpacity={dropShadowOpacity}
    />
  );
}
