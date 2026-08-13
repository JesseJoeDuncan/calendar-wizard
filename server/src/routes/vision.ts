import { Router } from "express";
import { pickBestImageForCutout } from "../lib/vision.js";

export const visionRouter = Router();

visionRouter.post("/rank-images", async (req, res) => {
  const { candidates, titleName } = req.body as { candidates?: { url: string }[]; titleName?: string };
  if (!candidates || candidates.length === 0 || !titleName) {
    res.status(400).json({ error: "Missing candidates or titleName" });
    return;
  }
  const result = await pickBestImageForCutout(candidates, titleName);
  res.json({ bestIndex: result?.bestIndex ?? null, reason: result?.reason ?? null });
});
