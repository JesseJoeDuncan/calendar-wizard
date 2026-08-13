import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { cutoutWithSam2 } from "./sam2.js";

const CACHE_DIR = path.resolve("data/cache/images");

async function ensureCacheDir() {
  await mkdir(CACHE_DIR, { recursive: true });
}

function hashKey(input: string): string {
  return createHash("sha1").update(input).digest("hex");
}

async function removeBgFromBuffer(buffer: Buffer): Promise<Buffer> {
  const apiKey = process.env.REMOVEBG_API_KEY;
  if (!apiKey) throw new Error("REMOVEBG_API_KEY is not set");

  const form = new FormData();
  form.append("size", "auto");
  form.append("image_file", new Blob([buffer]), "image.jpg");

  const res = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": apiKey },
    body: form as any,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`remove.bg failed: ${res.status} ${text}`);
  }
  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}

/** Cuts out the subject from a source image, caching the result on disk keyed by source. */
export async function cutoutFromSource(source: string | Buffer): Promise<{ cutoutPath: string; buffer: Buffer }> {
  await ensureCacheDir();

  const key =
    typeof source === "string" ? hashKey(source) : hashKey(source.toString("base64").slice(0, 5000));
  const filePath = path.join(CACHE_DIR, `${key}.png`);

  try {
    const cached = await readFile(filePath);
    return { cutoutPath: filePath, buffer: cached };
  } catch {
    // not cached yet
  }

  let inputBuffer: Buffer;
  if (typeof source === "string") {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`Failed to fetch source image: ${res.status}`);
    inputBuffer = Buffer.from(await res.arrayBuffer());
  } else {
    inputBuffer = source;
  }

  // Prefer SAM2 when configured; it no-ops (returns null) if unavailable or unconfident,
  // in which case we fall back to remove.bg. Pass the already-fetched buffer to avoid a second fetch.
  const cutoutBuffer = (await cutoutWithSam2(inputBuffer)) ?? (await removeBgFromBuffer(inputBuffer));
  await writeFile(filePath, cutoutBuffer);
  return { cutoutPath: filePath, buffer: cutoutBuffer };
}

export function cutoutCacheDir(): string {
  return CACHE_DIR;
}
