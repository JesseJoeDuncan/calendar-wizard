const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function formatDateBadge(iso: string): { mo: string; dy: string } {
  if (!iso) return { mo: "—", dy: "--" };
  const [, m, d] = iso.split("-").map(Number);
  return { mo: MONTHS[(m ?? 1) - 1] ?? "—", dy: String(d ?? "").padStart(2, "0") };
}

export function formatRuntime(minutes?: number): string {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}hr ${m}min` : `${m}min`;
}

export function sortByDate<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
