import { api } from "./api";

/** Duplicates any calendar by id (not just the one currently loaded in memory) — fetches its full record, then saves a copy under a new id. Returns the new id. */
export async function duplicateCalendarById(id: string): Promise<string> {
  const full = await api.getCalendar(id);
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();
  await api.saveCalendar({ ...full, id: newId, createdAt: now, updatedAt: now });
  return newId;
}

/** Sets (or clears, if blank) a calendar's display-name override by id. */
export async function renameCalendarById(id: string, customName: string): Promise<void> {
  const full = await api.getCalendar(id);
  await api.saveCalendar({ ...full, customName: customName.trim() || undefined });
}
