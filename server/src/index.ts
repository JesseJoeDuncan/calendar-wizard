import cors from "cors";
import "dotenv/config";
import express from "express";
import { calendarsRouter } from "./routes/calendars.js";
import { cutoutRouter } from "./routes/cutout.js";
import { imageProxyRouter } from "./routes/imageProxy.js";
import { imagesRouter, uploadsDir } from "./routes/images.js";
import { tmdbRouter } from "./routes/tmdb.js";
import { visionRouter } from "./routes/vision.js";
import { cutoutCacheDir } from "./lib/cutout.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/cache-images", express.static(cutoutCacheDir()));
app.use("/uploads", express.static(uploadsDir()));

app.use("/api/tmdb", tmdbRouter);
app.use("/api/cutout", cutoutRouter);
app.use("/api/images", imagesRouter);
app.use("/api/calendars", calendarsRouter);
app.use("/api/vision", visionRouter);
app.use("/api/image-proxy", imageProxyRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT) || 4310;
app.listen(port, () => {
  console.log(`Calendar Wizard server listening on http://localhost:${port}`);
});
