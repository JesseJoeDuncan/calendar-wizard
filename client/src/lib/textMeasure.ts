let ctx: CanvasRenderingContext2D | null = null;

function getCtx(): CanvasRenderingContext2D {
  if (!ctx) {
    ctx = document.createElement("canvas").getContext("2d");
  }
  return ctx!;
}

export function measureTextWidth(text: string, fontSizePx: number, fontFamily: string, fontStyle = "bold"): number {
  const c = getCtx();
  c.font = `${fontStyle} ${fontSizePx}px "${fontFamily}"`;
  return c.measureText(text).width;
}
