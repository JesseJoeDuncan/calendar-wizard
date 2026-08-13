import sharp from "sharp";

/** meta/sam-2 on Replicate — automatic (grid-based) segmentation, no point/box prompting available. */
const SAM2_VERSION = "fe97b453a6455861e3bac769b441ca1f1086110da7466dbb65cf1eecfd60dc83";

interface Sam2Output {
  combined_mask: string;
  individual_masks: string[];
}

interface ReplicatePrediction {
  status: string;
  output: Sam2Output | null;
  urls: { get: string };
}

async function createPrediction(imageInput: string): Promise<Sam2Output | null> {
  const token = process.env.REPLICATE_API_KEY;
  if (!token) return null;

  const res = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "wait=60",
    },
    body: JSON.stringify({ version: SAM2_VERSION, input: { image: imageInput } }),
  });
  if (!res.ok) throw new Error(`Replicate request failed: ${res.status} ${await res.text().catch(() => "")}`);

  let prediction = (await res.json()) as ReplicatePrediction;
  const deadline = Date.now() + 90_000;
  while (prediction.status !== "succeeded" && prediction.status !== "failed" && prediction.status !== "canceled" && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(prediction.urls.get, { headers: { Authorization: `Bearer ${token}` } });
    prediction = (await pollRes.json()) as ReplicatePrediction;
  }

  if (prediction.status !== "succeeded" || !prediction.output) return null;
  return prediction.output;
}

/**
 * SAM2's automatic mode returns one mask per detected object with no indication of which
 * is "the subject." Score each by frame coverage (too small = noise, too large = background)
 * and border contact (background regions usually touch the frame edge; a subject usually doesn't).
 */
async function pickSubjectMask(maskUrls: string[]): Promise<Buffer | null> {
  let best: { buffer: Buffer; score: number } | null = null;

  for (const url of maskUrls.slice(0, 40)) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const { data, info } = await sharp(buf).greyscale().raw().toBuffer({ resolveWithObject: true });
      const { width, height } = info;
      const total = width * height;

      let foreground = 0;
      let borderForeground = 0;
      let borderTotal = 0;
      for (let y = 0; y < height; y++) {
        const rowBase = y * width;
        const onEdgeRow = y === 0 || y === height - 1;
        for (let x = 0; x < width; x++) {
          const isFg = data[rowBase + x] > 128;
          if (isFg) foreground++;
          if (onEdgeRow || x === 0 || x === width - 1) {
            borderTotal++;
            if (isFg) borderForeground++;
          }
        }
      }

      const coverage = foreground / total;
      if (coverage < 0.02 || coverage > 0.85) continue; // noise speck or near-whole-frame background
      const borderRatio = borderTotal > 0 ? borderForeground / borderTotal : 0;
      const score = coverage * (1 - borderRatio);
      if (!best || score > best.score) best = { buffer: buf, score };
    } catch {
      // skip unreadable mask, try the next candidate
    }
  }

  return best?.buffer ?? null;
}

/** Applies a grayscale mask as the alpha channel of the source image, producing a transparent-background cutout. */
async function compositeMaskAsAlpha(sourceBuffer: Buffer, maskBuffer: Buffer): Promise<Buffer> {
  const { width, height } = await sharp(maskBuffer).metadata();
  if (!width || !height) throw new Error("Mask has no dimensions");

  const maskGrey = await sharp(maskBuffer).resize(width, height).greyscale().raw().toBuffer();
  const rgba = await sharp(sourceBuffer).resize(width, height, { fit: "fill" }).ensureAlpha().raw().toBuffer();

  for (let i = 0, p = 3; i < maskGrey.length; i++, p += 4) {
    rgba[p] = maskGrey[i];
  }

  return sharp(rgba, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

/**
 * Cuts out the main subject using SAM2's automatic segmentation + heuristic mask selection.
 * Returns null (never throws) if REPLICATE_API_KEY is unset or the pipeline can't find a
 * confident subject mask, so callers can fall back to remove.bg.
 */
export async function cutoutWithSam2(source: string | Buffer): Promise<Buffer | null> {
  if (!process.env.REPLICATE_API_KEY) return null;

  try {
    let originalBuffer: Buffer;
    let imageInput: string;
    if (typeof source === "string") {
      imageInput = source;
      const res = await fetch(source);
      if (!res.ok) throw new Error(`Failed to fetch source image: ${res.status}`);
      originalBuffer = Buffer.from(await res.arrayBuffer());
    } else {
      originalBuffer = source;
      imageInput = `data:image/jpeg;base64,${source.toString("base64")}`;
    }

    const output = await createPrediction(imageInput);
    if (!output?.individual_masks?.length) return null;

    const subjectMask = await pickSubjectMask(output.individual_masks);
    if (!subjectMask) return null;

    return await compositeMaskAsAlpha(originalBuffer, subjectMask);
  } catch (err) {
    console.error("SAM2 cutout failed, falling back to remove.bg", err);
    return null;
  }
}
