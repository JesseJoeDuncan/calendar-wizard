import { randomUUID } from "node:crypto";
import { Router } from "express";
import { getCalendar, listCalendars, saveCalendar } from "../lib/calendarStore.js";
import { makeNewCalendar } from "../lib/defaults.js";
import type { Calendar } from "../types.js";

export const calendarsRouter = Router();

calendarsRouter.get("/", async (_req, res) => {
  const calendars = await listCalendars();
  res.json({ calendars });
});

calendarsRouter.get("/:id", async (req, res) => {
  const calendar = await getCalendar(req.params.id);
  if (!calendar) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(calendar);
});

calendarsRouter.post("/", async (req, res) => {
  const { season, year, customSeasonLabel } = req.body as { season: Calendar["season"]; year: number; customSeasonLabel?: string };
  const calendar = makeNewCalendar(randomUUID(), season, year, customSeasonLabel);
  await saveCalendar(calendar);
  res.status(201).json(calendar);
});

calendarsRouter.put("/:id", async (req, res) => {
  const incoming = req.body as Calendar;
  if (incoming.id !== req.params.id) {
    res.status(400).json({ error: "id mismatch" });
    return;
  }
  await saveCalendar(incoming);
  res.json(incoming);
});
