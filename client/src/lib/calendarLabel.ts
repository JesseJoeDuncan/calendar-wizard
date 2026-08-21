import type { CalendarSummary } from "../types/calendar";

export function calendarLabel(s: Pick<CalendarSummary, "season" | "customSeasonLabel" | "customName" | "year">): string {
  if (s.customName) return s.customName;
  return `${s.season === "Custom" ? s.customSeasonLabel || "Custom" : s.season} ${s.year}`;
}

/** Appends a disambiguator (#N, by creation order) when multiple calendars share the same season+year label. */
export function dropdownLabel(s: CalendarSummary, all: CalendarSummary[]): string {
  const label = calendarLabel(s);
  const siblings = all.filter((x) => calendarLabel(x) === label).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  if (siblings.length <= 1) return label;
  const idx = siblings.findIndex((x) => x.id === s.id);
  return `${label} (#${idx + 1})`;
}
