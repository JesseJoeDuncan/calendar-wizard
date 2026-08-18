import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
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
import { basicAuth } from "./lib/basicAuth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(basicAuth);
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

// In dev, Vite serves the client on its own port and proxies /api to this server. In a deployed
// build there's no Vite dev server, so this process also serves the client's static build (when
// present) and falls back to index.html for any non-API route, letting React Router handle it.
const clientDist = path.resolve(__dirname, "../../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

const port = Number(process.env.PORT) || 4310;
app.listen(port, () => {
  console.log(`Calendar Wizard server listening on http://localhost:${port}`);
});
