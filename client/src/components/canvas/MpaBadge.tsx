import type { MpaRating } from "../../types/calendar";
import { KonvaImg } from "./KonvaImg";

const FILES: Record<MpaRating, string> = {
  G: "Rated_G.svg",
  PG: "Rated_PG.svg",
  "PG-13": "Rated_PG-13.svg",
  R: "Rated_R.svg",
  "NC-17": "Rated_NC-17.svg",
  NR: "Not_Rated.svg",
};

interface Props {
  rating: MpaRating;
  x: number;
  y: number;
  opacity: number;
}

export function MpaBadge({ rating, x, y, opacity }: Props) {
  return <KonvaImg src={`/assets/mpaa/${FILES[rating]}`} x={x} y={y} width={22} height={22} opacity={opacity} />;
}
