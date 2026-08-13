/** Draws a rect with independent per-corner radii [topLeft, topRight, bottomRight, bottomLeft] onto a canvas context. */
export function roundedRectPath(
  ctx: CanvasRenderingContext2D | any,
  x: number,
  y: number,
  w: number,
  h: number,
  radii: [number, number, number, number]
) {
  const [tl, tr, br, bl] = radii;
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.arcTo(x + w, y, x + w, y + tr, tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
  ctx.lineTo(x + bl, y + h);
  ctx.arcTo(x, y + h, x, y + h - bl, bl);
  ctx.lineTo(x, y + tl);
  ctx.arcTo(x, y, x + tl, y, tl);
  ctx.closePath();
}
