import { Router } from "express";

export const imageProxyRouter = Router();

const ALLOWED_HOSTS = new Set(["image.tmdb.org"]);

imageProxyRouter.get("/", async (req, res) => {
  const url = req.query.url;
  if (typeof url !== "string") {
    res.status(400).json({ error: "Missing url" });
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    res.status(400).json({ error: "Invalid url" });
    return;
  }
  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    res.status(400).json({ error: "Host not allowed" });
    return;
  }

  try {
    const upstream = await fetch(parsed.toString());
    if (!upstream.ok) {
      res.status(upstream.status).end();
      return;
    }
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch (err) {
    console.error("Image proxy failed", err);
    res.status(502).end();
  }
});
