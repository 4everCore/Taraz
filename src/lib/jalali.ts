import { toJalaali, toGregorian, jalaaliMonthLength } from "jalaali-js";

const PERSIAN_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const PERSIAN_WEEKDAYS = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];

export function gregorianToJalaliParts(date: Date) {
  const { jy, jm, jd } = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return { year: jy, month: jm, day: jd };
}

export function jalaliToGregorianDate(jy: number, jm: number, jd: number, hour = 0, minute = 0) {
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  return new Date(gy, gm - 1, gd, hour, minute, 0, 0);
}

export function formatJalaliDate(date: Date): string {
  const { year, month, day } = gregorianToJalaliParts(date);
  return `${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
}

export function formatJalaliDateLong(date: Date): string {
  const { year, month, day } = gregorianToJalaliParts(date);
  const weekday = PERSIAN_WEEKDAYS[date.getDay()];
  return `${weekday} ${day} ${PERSIAN_MONTHS[month - 1]} ${year}`;
}

export function formatJalaliDateTime(date: Date): string {
  const datePart = formatJalaliDate(date);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${datePart} - ${hours}:${minutes}`;
}

export function currentJalaliMonthRange(reference: Date): { start: Date; end: Date } {
  const { year, month } = gregorianToJalaliParts(reference);
  const start = jalaliToGregorianDate(year, month, 1);
  const length = jalaaliMonthLength(year, month);
  const end = jalaliToGregorianDate(year, month, length, 23, 59);
  return { start, end };
}

export { PERSIAN_MONTHS, PERSIAN_WEEKDAYS };
