/**
 * Date formatting helpers. All stored dates are UTC midnight, so format
 * with timeZone: "UTC" — otherwise a UTC-midnight date displays as the
 * previous day in negative-offset timezones (e.g. US).
 */
const dayFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: "UTC",
  day: "2-digit",
  month: "short",
});

const fullFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: "UTC",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** "04 Oct" */
export function formatDay(date: Date | string): string {
  return dayFmt.format(new Date(date));
}

/** "04 Oct 2026" */
export function formatFull(date: Date | string): string {
  return fullFmt.format(new Date(date));
}

/** "04 Oct – 06 Oct 2026" (year shown once when in the same year) */
export function formatDateRange(start: Date | string, end: Date | string): string {
  const s = new Date(start);
  const e = new Date(end);
  if (s.getUTCFullYear() === e.getUTCFullYear()) {
    return `${dayFmt.format(s)} – ${fullFmt.format(e)}`;
  }
  return `${fullFmt.format(s)} – ${fullFmt.format(e)}`;
}
