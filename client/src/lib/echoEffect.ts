// Shared by everything that renders the extruded/echoed block-shape look (season title text, QR
// code image): each echo layer is ECHO_COPIES flat-colored copies, each nudged one fixed step
// further back than the last. Tuned so the full 3-layer stack reaches back only ~1/3 of the front
// shape's height, not a long trailing smear.
export const ECHO_STEP_X = 0.55;
export const ECHO_STEP_Y = -1.1;
export const ECHO_COPIES = 6;

export interface EchoLayerColors {
  front: string;
  echo1: string;
  echo2: string;
  echo3: string;
}

export interface EchoLayer {
  key: number;
  color: string;
  dx: number;
  dy: number;
}

/**
 * Builds the back-to-front layer list for the echo effect: 3 echo bands (ECHO_COPIES copies each)
 * plus the front layer last (drawn on top). `scale` is the shape's own size multiplier and `spread`
 * is the user-adjustable echo-spread multiplier — both scale the per-copy offset distance.
 */
export function buildEchoLayers(colors: EchoLayerColors, scale: number, spread: number): EchoLayer[] {
  const layers: { key: number; color: string }[] = [];
  for (let k = ECHO_COPIES * 3; k >= ECHO_COPIES * 2 + 1; k--) layers.push({ key: k, color: colors.echo3 });
  for (let k = ECHO_COPIES * 2; k >= ECHO_COPIES + 1; k--) layers.push({ key: k, color: colors.echo2 });
  for (let k = ECHO_COPIES; k >= 1; k--) layers.push({ key: k, color: colors.echo1 });
  layers.push({ key: 0, color: colors.front });

  const factor = scale * spread;
  return layers.map((l) => ({ ...l, dx: l.key * ECHO_STEP_X * factor, dy: l.key * ECHO_STEP_Y * factor }));
}
