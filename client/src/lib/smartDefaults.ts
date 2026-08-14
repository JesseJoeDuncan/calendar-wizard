import type { Season } from "../types/calendar";

function formatISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Every Sunday falling within the given 0-indexed months of `year`. */
function sundaysInMonths(year: number, months: number[]): string[] {
  const dates: string[] = [];
  for (const month of months) {
    const d = new Date(year, month, 1);
    while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
    while (d.getMonth() === month) {
      dates.push(formatISODate(d));
      d.setDate(d.getDate() + 7);
    }
  }
  return dates;
}

export interface SmartStartDefaults {
  season: Season;
  year: number;
  dates: string[];
}

/**
 * Q1 (Jan-Mar) -> Spring this year, screening Apr-Jun this year.
 * Q2 (Apr-Jun) -> Summer this year, screening Jul-Sep this year.
 * Q3 (Jul-Sep) -> Fall this year, screening Oct-Dec this year.
 * Q4 (Oct-Dec) -> Winter next year, screening Jan-Mar next year.
 */
export function computeSmartStartDefaults(today: Date): SmartStartDefaults {
  const month = today.getMonth();
  const year = today.getFullYear();
  if (month <= 2) return { season: "Spring", year, dates: sundaysInMonths(year, [3, 4, 5]) };
  if (month <= 5) return { season: "Summer", year, dates: sundaysInMonths(year, [6, 7, 8]) };
  if (month <= 8) return { season: "Fall", year, dates: sundaysInMonths(year, [9, 10, 11]) };
  return { season: "Winter", year: year + 1, dates: sundaysInMonths(year + 1, [0, 1, 2]) };
}
