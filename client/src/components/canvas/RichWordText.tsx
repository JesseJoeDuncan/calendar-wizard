import { useMemo } from "react";
import { Text } from "react-konva";
import { measureTextWidth } from "../../lib/textMeasure";

export interface RichWordTextProps {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  baseFontSize: number;
  wordSizes?: number[];
  fontFamily: string;
  fontStyle?: string;
  kerning: number;
  justify: "left" | "center" | "right";
  color: string;
  dropShadow?: boolean;
  verticalAlign?: "top" | "middle" | "bottom";
  uppercase?: boolean;
  offsetX?: number;
  offsetY?: number;
  lineHeightMultiplier?: number;
}

interface PlacedWord {
  key: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
}

/**
 * Lays out text word-by-word so each word can carry its own font size, wrapping lines to fit
 * `width` and justifying/anchoring the resulting block within the given box. Konva's built-in
 * Text node has no notion of mixed sizes within one block, so each word renders as its own
 * Text node at a pre-measured position instead of relying on native wrapping.
 */
export function RichWordText({
  text,
  x,
  y,
  width,
  height,
  baseFontSize,
  wordSizes,
  fontFamily,
  fontStyle = "bold",
  kerning,
  justify,
  color,
  dropShadow = false,
  verticalAlign = "bottom",
  uppercase = false,
  offsetX = 0,
  offsetY = 0,
  lineHeightMultiplier = 1.08,
}: RichWordTextProps) {
  const placed = useMemo<PlacedWord[]>(() => {
    const rawWords = text.split(/\s+/).filter(Boolean);
    if (rawWords.length === 0) return [];
    const display = uppercase ? rawWords.map((w) => w.toUpperCase()) : rawWords;
    const sizes = display.map((_, i) => wordSizes?.[i] ?? baseFontSize);
    const spaceWidths = sizes.map((size) => measureTextWidth(" ", size, fontFamily, fontStyle) + kerning);
    const wordWidths = display.map((w, i) => measureTextWidth(w, sizes[i], fontFamily, fontStyle) + kerning * Math.max(0, w.length - 1));

    // Greedy line wrap
    interface Line {
      words: { text: string; width: number; size: number }[];
      width: number;
      maxSize: number;
    }
    const lines: Line[] = [];
    let current: Line = { words: [], width: 0, maxSize: 0 };
    for (let i = 0; i < display.length; i++) {
      const w = wordWidths[i];
      const addWidth = current.words.length === 0 ? w : current.width + spaceWidths[i - 1] + w;
      if (current.words.length > 0 && addWidth > width) {
        lines.push(current);
        current = { words: [], width: 0, maxSize: 0 };
      }
      const newWidth = current.words.length === 0 ? w : current.width + spaceWidths[i] + w;
      current.words.push({ text: display[i], width: w, size: sizes[i] });
      current.width = newWidth;
      current.maxSize = Math.max(current.maxSize, sizes[i]);
    }
    if (current.words.length > 0) lines.push(current);

    const lineHeights = lines.map((l) => l.maxSize * lineHeightMultiplier);
    const totalHeight = lineHeights.reduce((a, b) => a + b, 0);

    let startY: number;
    if (verticalAlign === "top") startY = y;
    else if (verticalAlign === "middle") startY = y + (height - totalHeight) / 2;
    else startY = y + height - totalHeight;
    startY += offsetY;

    const result: PlacedWord[] = [];
    let cursorY = startY;
    lines.forEach((line, li) => {
      let lineX: number;
      if (justify === "center") lineX = x + (width - line.width) / 2;
      else if (justify === "right") lineX = x + width - line.width;
      else lineX = x;
      lineX += offsetX;

      let cursorX = lineX;
      line.words.forEach((w, wi) => {
        result.push({ key: `${li}-${wi}`, text: w.text, x: cursorX, y: cursorY, fontSize: w.size });
        cursorX += w.width + measureTextWidth(" ", w.size, fontFamily, fontStyle) + kerning;
      });
      cursorY += lineHeights[li];
    });

    return result;
  }, [text, JSON.stringify(wordSizes), baseFontSize, fontFamily, fontStyle, kerning, justify, uppercase, width, height, x, y, offsetX, offsetY, lineHeightMultiplier]);

  return (
    <>
      {placed.map((w) => (
        <Text
          key={w.key}
          x={w.x}
          y={w.y}
          text={w.text}
          fontFamily={fontFamily}
          fontStyle={fontStyle}
          fontSize={w.fontSize}
          letterSpacing={kerning}
          fill={color}
          shadowColor="black"
          shadowBlur={dropShadow ? 5 : 0}
          shadowOpacity={dropShadow ? 0.7 : 0}
        />
      ))}
    </>
  );
}
