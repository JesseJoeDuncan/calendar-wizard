import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { cutoutFromSource } from "../lib/cutout.js";

export const cutoutRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

cutoutRouter.post("/from-url", async (req, res) => {
  const { url } = req.body as { url?: string };
  if (!url) {
    res.status(400).json({ error: "Missing url" });
    return;
  }
  try {
    const { cutoutPath } = await cutoutFromSource(url);
    res.json({ cutoutUrl: `/cache-images/${path.basename(cutoutPath)}` });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Cutout failed" });
  }
});

cutoutRouter.post("/from-upload", upload.single("image"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Missing image file" });
    return;
  }
  try {
    const { cutoutPath } = await cutoutFromSource(req.file.buffer);
    res.json({ cutoutUrl: `/cache-images/${path.basename(cutoutPath)}` });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Cutout failed" });
  }
});
