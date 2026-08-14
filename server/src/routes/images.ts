import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import multer from "multer";

const UPLOAD_DIR = path.resolve("data/uploads");
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

export const imagesRouter = Router();

imagesRouter.post("/upload", upload.single("image"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Missing image file" });
    return;
  }
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(req.file.originalname) || ".jpg";
  const name = `${createHash("sha1").update(req.file.buffer).digest("hex")}${ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), req.file.buffer);
  res.json({ url: `/uploads/${name}` });
});

export function uploadsDir(): string {
  return UPLOAD_DIR;
}
