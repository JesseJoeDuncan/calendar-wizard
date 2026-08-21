export interface ImageDrawRect {
  /** Center point (stage coordinates) — the node's Konva x/y, paired with offsetX/offsetY below so rotation happens around the image's own center. */
  centerX: number;
  centerY: number;
  /** Local (pre-rotation) draw size. */
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

interface ComputeImageDrawRectArgs {
  boxX: number;
  boxY: number;
  boxW: number;
  boxH: number;
  imgW: number;
  imgH: number;
  scale: number;
  userOffsetX: number;
  userOffsetY: number;
  rotation: 0 | 90 | 180 | 270;
  flipHorizontal: boolean;
  flipVertical: boolean;
}

/**
 * Cover-fit an image over a box, accounting for a quarter-turn rotation and/or flip. At 90/270 the
 * rotated bounding box swaps width and height on screen, so the cover multiplier is computed
 * against the box's dimensions swapped too — otherwise a rotated image would leave gaps at the
 * box's edges instead of fully covering it, the same way the un-rotated case already does.
 */
export function computeImageDrawRect({ boxX, boxY, boxW, boxH, imgW, imgH, scale, userOffsetX, userOffsetY, rotation, flipHorizontal, flipVertical }: ComputeImageDrawRectArgs): ImageDrawRect {
  const rotated90 = rotation === 90 || rotation === 270;
  const targetW = rotated90 ? boxH : boxW;
  const targetH = rotated90 ? boxW : boxH;
  const cover = Math.max(targetW / imgW, targetH / imgH) * scale;
  const width = imgW * cover;
  const height = imgH * cover;
  return {
    centerX: boxX + boxW / 2 + userOffsetX,
    centerY: boxY + boxH / 2 + userOffsetY,
    width,
    height,
    offsetX: width / 2,
    offsetY: height / 2,
    rotation,
    scaleX: flipHorizontal ? -1 : 1,
    scaleY: flipVertical ? -1 : 1,
  };
}
