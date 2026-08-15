import { Router } from "express";
import { getMovieDetail, getRandomMovies, searchMovies } from "../lib/tmdb.js";

export const tmdbRouter = Router();

tmdbRouter.get("/random", async (req, res) => {
  const count = Math.min(20, Math.max(1, Number(req.query.count) || 12));
  try {
    const results = await getRandomMovies(count);
    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "TMDB random fetch failed" });
  }
});

tmdbRouter.get("/search", async (req, res) => {
  const query = String(req.query.q || "").trim();
  if (query.length < 2) {
    res.json({ results: [] });
    return;
  }
  try {
    const results = await searchMovies(query);
    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "TMDB search failed" });
  }
});

tmdbRouter.get("/movie/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid movie id" });
    return;
  }
  try {
    const detail = await getMovieDetail(id);
    res.json(detail);
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "TMDB movie lookup failed" });
  }
});
