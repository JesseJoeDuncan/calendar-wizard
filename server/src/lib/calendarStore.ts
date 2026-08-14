import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Calendar } from "../types.js";

const DATA_DIR = path.resolve("data/calendars");

async function ensureDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

export async function listCalendars(): Promise<Pick<Calendar, "id" | "season" | "customSeasonLabel" | "year" | "updatedAt" | "createdAt">[]> {
  await ensureDir();
  const files = (await readdir(DATA_DIR)).filter((f) => f.endsWith(".json"));
  const summaries = await Promise.all(
    files.map(async (f) => {
      const raw = await readFile(path.join(DATA_DIR, f), "utf-8");
      const cal = JSON.parse(raw) as Calendar;
      return { id: cal.id, season: cal.season, customSeasonLabel: cal.customSeasonLabel, year: cal.year, updatedAt: cal.updatedAt, createdAt: cal.createdAt };
    })
  );
  return summaries.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function deleteCalendar(id: string): Promise<boolean> {
  await ensureDir();
  try {
    await unlink(path.join(DATA_DIR, `${id}.json`));
    return true;
  } catch {
    return false;
  }
}

export async function getCalendar(id: string): Promise<Calendar | null> {
  await ensureDir();
  try {
    const raw = await readFile(path.join(DATA_DIR, `${id}.json`), "utf-8");
    return JSON.parse(raw) as Calendar;
  } catch {
    return null;
  }
}

export async function saveCalendar(calendar: Calendar): Promise<void> {
  await ensureDir();
  calendar.updatedAt = new Date().toISOString();
  await writeFile(path.join(DATA_DIR, `${calendar.id}.json`), JSON.stringify(calendar, null, 2), "utf-8");
}
