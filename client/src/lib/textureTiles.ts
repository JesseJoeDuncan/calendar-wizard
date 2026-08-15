import type { BackgroundTextureStyle } from "../types/calendar";

const TILE_SIZE = 160;
const tileCache = new Map<BackgroundTextureStyle, HTMLCanvasElement>();

function makeCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  return { canvas, ctx };
}

/** Simple deterministic PRNG so a tile looks the same every time it's (re)generated in a session. */
function makeRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return (s % 10000) / 10000;
  };
}

function generatePaper(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas();
  const rand = makeRand(42);
  for (let i = 0; i < 2200; i++) {
    const x = rand() * TILE_SIZE;
    const y = rand() * TILE_SIZE;
    const r = 0.4 + rand() * 0.9;
    const dark = rand() < 0.5;
    const alpha = 0.05 + rand() * 0.12;
    ctx.fillStyle = dark ? `rgba(60,50,40,${alpha})` : `rgba(255,250,240,${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 40; i++) {
    const x = rand() * TILE_SIZE;
    const y = rand() * TILE_SIZE;
    const len = 4 + rand() * 10;
    const angle = rand() * Math.PI;
    ctx.strokeStyle = `rgba(90,75,60,${0.03 + rand() * 0.05})`;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }
  return canvas;
}

function generateLinen(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas();
  ctx.strokeStyle = "rgba(50,40,30,0.08)";
  ctx.lineWidth = 0.7;
  const step = 5;
  for (let i = -TILE_SIZE; i < TILE_SIZE * 2; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + TILE_SIZE, TILE_SIZE);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i, TILE_SIZE);
    ctx.lineTo(i + TILE_SIZE, 0);
    ctx.stroke();
  }
  return canvas;
}

function generateDots(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas();
  const spacing = 16;
  ctx.fillStyle = "rgba(40,35,30,0.14)";
  for (let y = spacing / 2; y < TILE_SIZE; y += spacing) {
    for (let x = spacing / 2; x < TILE_SIZE; x += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return canvas;
}

function generateGrid(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas();
  ctx.strokeStyle = "rgba(40,35,30,0.10)";
  ctx.lineWidth = 1;
  const spacing = 20;
  for (let x = 0; x <= TILE_SIZE; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, TILE_SIZE);
    ctx.stroke();
  }
  for (let y = 0; y <= TILE_SIZE; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(TILE_SIZE, y + 0.5);
    ctx.stroke();
  }
  return canvas;
}

const GENERATORS: Record<Exclude<BackgroundTextureStyle, "none">, () => HTMLCanvasElement> = {
  paper: generatePaper,
  linen: generateLinen,
  dots: generateDots,
  grid: generateGrid,
};

export const TEXTURE_STYLE_OPTIONS: { value: BackgroundTextureStyle; label: string }[] = [
  { value: "none", label: "None" },
  { value: "paper", label: "Paper" },
  { value: "linen", label: "Linen" },
  { value: "dots", label: "Dots" },
  { value: "grid", label: "Grid" },
];

export function getTextureTile(style: Exclude<BackgroundTextureStyle, "none">): HTMLCanvasElement {
  const cached = tileCache.get(style);
  if (cached) return cached;
  const tile = GENERATORS[style]();
  tileCache.set(style, tile);
  return tile;
}
