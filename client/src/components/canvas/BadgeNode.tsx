import { Group, Rect, Text } from "react-konva";
import type { Badge } from "../../types/calendar";

interface Props {
  badge: Badge;
  boxX: number;
  boxY: number;
  boxW: number;
  boxH: number;
  stackIndex: number;
}

const RED = "#c0392b";
const GOLD = "#d9a72a";

export function BadgeNode({ badge, boxX, boxY, boxW, boxH, stackIndex }: Props) {
  const style = badge.style ?? "tag";
  const text = badge.text.toUpperCase();

  if (style === "seal") {
    const r = Math.max(20, boxW * 0.16);
    const cx = boxX + boxW - r - 6;
    const cy = boxY + r + 8 + stackIndex * (r * 2 + 6);
    const words = text.split(" ");
    return (
      <Group>
        <Rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} cornerRadius={r} fill={GOLD} shadowColor="black" shadowBlur={4} shadowOpacity={0.4} />
        <Rect x={cx - r + 3} y={cy - r + 3} width={r * 2 - 6} height={r * 2 - 6} cornerRadius={r - 3} stroke="#fff8ef" strokeWidth={1} />
        <Text x={cx - r} y={cy - r * 0.55} width={r * 2} align="center" text={words[0] ?? ""} fontFamily="Futura Wizard" fontStyle="bold" fontSize={r * 0.42} fill="#3a2405" />
        <Text x={cx - r} y={cy + r * 0.05} width={r * 2} align="center" text={words.slice(1).join(" ")} fontFamily="Futura Wizard" fontSize={r * 0.2} fill="#3a2405" wrap="word" />
      </Group>
    );
  }

  if (style === "ribbon") {
    const w = Math.max(90, text.length * 7 + 20);
    return (
      <Group x={boxX + w * 0.32} y={boxY + 14 + stackIndex * 24} rotation={-40}>
        <Rect x={-w / 2} y={-9} width={w} height={18} fill={GOLD} shadowColor="black" shadowBlur={3} shadowOpacity={0.4} />
        <Text x={-w / 2} y={-5} width={w} align="center" text={text} fontFamily="Futura Wizard" fontStyle="bold" fontSize={8.5} fill="#3a2405" letterSpacing={0.5} />
      </Group>
    );
  }

  if (style === "banner") {
    const bw = boxW - 16;
    const by = boxY + boxH - 40 - stackIndex * 20;
    return (
      <Group x={boxX + 8} y={by}>
        <Rect x={0} y={0} width={bw} height={16} fill="#1a1a1a" />
        <Rect x={-6} y={0} width={6} height={16} fill="#1a1a1a" />
        <Rect x={bw} y={0} width={6} height={16} fill="#1a1a1a" />
        <Text x={0} y={3} width={bw} align="center" text={text} fontFamily="Futura Wizard" fontStyle="bold" fontSize={8.5} fill="#ffffff" letterSpacing={0.5} />
      </Group>
    );
  }

  // "tag" default
  const tw = Math.min(92, Math.max(56, text.length * 6.2));
  const tagX = boxX + boxW - tw - 8;
  const tagY = boxY + 8 + stackIndex * 20;
  return (
    <Group>
      <Rect x={tagX} y={tagY} width={tw} height={16} fill={RED} cornerRadius={3} shadowColor="black" shadowBlur={2} shadowOpacity={0.3} />
      <Text x={tagX} y={tagY + 3} width={tw} align="center" text={text} fontFamily="Futura Wizard" fontStyle="bold" fontSize={6.5} fill="#ffffff" />
    </Group>
  );
}
