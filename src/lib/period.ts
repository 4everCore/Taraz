export type PeriodKey = "today" | "7d" | "this_month" | "last_month" | "this_year" | "custom";

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  today: "امروز",
  "7d": "هفت روز اخیر",
  this_month: "ماه جاری",
  last_month: "ماه قبل",
  this_year: "سال جاری",
  custom: "بازه دلخواه",
};

function getOffsetMinutes(timeZone: string, date: Date): number {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" });
    const parts = dtf.formatToParts(date);
    const offsetPart = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT+0";
    const match = offsetPart.match(/GMT([+-])(\d+)(?::(\d+))?/);
    if (!match) return 0;
    const sign = match[1] === "-" ? -1 : 1;
    const hours = parseInt(match[2], 10);
    const minutes = match[3] ? parseInt(match[3], 10) : 0;
    return sign * (hours * 60 + minutes);
  } catch {
    return 0;
  }
}

function zonedDateParts(timeZone: string, date: Date) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const year = Number(parts.find((p) => p.type === "year")?.value ?? "1970");
  const month = Number(parts.find((p) => p.type === "month")?.value ?? "1");
  const day = Number(parts.find((p) => p.type === "day")?.value ?? "1");
  return { year, month, day };
}

export function startOfDayInZone(timeZone: string, year: number, month: number, day: number): Date {
  const candidateUtc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const offsetMinutes = getOffsetMinutes(timeZone, candidateUtc);
  return new Date(candidateUtc.getTime() - offsetMinutes * 60000);
}

export function endOfDayInZone(timeZone: string, year: number, month: number, day: number): Date {
  const start = startOfDayInZone(timeZone, year, month, day);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

export function parseDateOnly(value: string): { year: number; month: number; day: number } {
  const [year, month, day] = value.split("-").map((part) => Number(part));
  return { year, month, day };
}

export function addDaysToDateOnly(parts: { year: number; month: number; day: number }, days: number) {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

export function getPeriodRange(
  period: PeriodKey,
  timeZone: string,
  customStart?: string | null,
  customEnd?: string | null,
): { start: Date; end: Date } {
  const now = new Date();
  const today = zonedDateParts(timeZone, now);

  if (period === "today") {
    return {
      start: startOfDayInZone(timeZone, today.year, today.month, today.day),
      end: endOfDayInZone(timeZone, today.year, today.month, today.day),
    };
  }

  if (period === "7d") {
    const start = addDaysToDateOnly(today, -6);
    return {
      start: startOfDayInZone(timeZone, start.year, start.month, start.day),
      end: endOfDayInZone(timeZone, today.year, today.month, today.day),
    };
  }

  if (period === "this_month") {
    const start = startOfDayInZone(timeZone, today.year, today.month, 1);
    const nextMonth = today.month === 12 ? { year: today.year + 1, month: 1 } : { year: today.year, month: today.month + 1 };
    const end = new Date(startOfDayInZone(timeZone, nextMonth.year, nextMonth.month, 1).getTime() - 1);
    return { start, end };
  }

  if (period === "last_month") {
    const lastMonth = today.month === 1 ? { year: today.year - 1, month: 12 } : { year: today.year, month: today.month - 1 };
    const start = startOfDayInZone(timeZone, lastMonth.year, lastMonth.month, 1);
    const end = new Date(startOfDayInZone(timeZone, today.year, today.month, 1).getTime() - 1);
    return { start, end };
  }

  if (period === "this_year") {
    const start = startOfDayInZone(timeZone, today.year, 1, 1);
    const end = new Date(startOfDayInZone(timeZone, today.year + 1, 1, 1).getTime() - 1);
    return { start, end };
  }

  if (customStart && customEnd) {
    const startParts = parseDateOnly(customStart);
    const endParts = parseDateOnly(customEnd);
    return {
      start: startOfDayInZone(timeZone, startParts.year, startParts.month, startParts.day),
      end: endOfDayInZone(timeZone, endParts.year, endParts.month, endParts.day),
    };
  }

  return {
    start: startOfDayInZone(timeZone, today.year, today.month, 1),
    end: endOfDayInZone(timeZone, today.year, today.month, today.day),
  };
}
