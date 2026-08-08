/**
 * The backend (MySQL, dateStrings:true) returns datetimes as
 * "YYYY-MM-DD HH:MM:SS" with no timezone marker. The server always
 * stores/compares these as UTC (see the backend's toMysqlDatetime()), so
 * a marker-less string here means UTC — but a plain `new Date(string)`
 * in the browser treats a marker-less "YYYY-MM-DD HH:MM:SS" string as
 * LOCAL time (a legacy, non-standard but widely-supported parsing
 * behavior), which would silently shift every displayed time by the
 * admin's own UTC offset. This appends 'Z' explicitly unless the string
 * already carries a zone marker, matching the equivalent fix already
 * applied on the Flutter mobile app side (see EventModel.parseServerDateTime).
 */
export function parseServerDate(value: string): Date {
  const hasZoneMarker = value.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(value);
  return new Date(hasZoneMarker ? value : `${value}Z`);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Formats a Date's UTC components as MySQL's own DATETIME literal
 * syntax ("YYYY-MM-DD HH:MM:SS") — what the backend's date-range filters
 * expect (see admin.service.js). */
function toMysqlUtcDatetime(date: Date): string {
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
  );
}

/**
 * Converts a DateRangeFilter's plain "YYYY-MM-DD" (dateFrom/dateTo) —
 * always the admin's own browser-local calendar date, since that's all a
 * bare `<input type="date">` can express — into the precise UTC instants
 * the backend should actually filter created_at/start_time against.
 *
 * Why this matters: created_at/start_time are stored as naive UTC
 * datetimes with no zone marker (same as parseServerDate above assumes).
 * Sending the bare date string straight through and comparing it against
 * that column directly (the previous behavior) works, but silently uses
 * MySQL's own notion of "midnight" for that date — i.e. UTC midnight —
 * not the admin's local midnight. For an admin ahead of UTC (anywhere in
 * Europe, including Albania), that shifts the effective range earlier
 * than what the date picker visually promised: picking "today" could
 * exclude the last few hours of today's real submissions (they're
 * already "tomorrow" in UTC) or, at the other end, silently include a
 * few hours that are still "yesterday" locally. That mismatch between
 * what's filtered and what's *displayed* (parseServerDate always shows
 * the admin their own local time) is what actually read as "the date
 * range doesn't work accurately."
 *
 * `dateTo` becomes the exclusive upper bound (local midnight of the day
 * *after* the picked end date, converted to UTC) — the backend now does
 * a plain `< dateTo` rather than its old `< DATE_ADD(dateTo, INTERVAL 1
 * DAY)` trick, since that exclusivity is computed here instead.
 */
export function localDateRangeToUtcBounds(
  dateFrom: string,
  dateTo: string,
): { dateFrom?: string; dateTo?: string } {
  const result: { dateFrom?: string; dateTo?: string } = {};

  if (dateFrom) {
    const [y, m, d] = dateFrom.split('-').map(Number);
    result.dateFrom = toMysqlUtcDatetime(new Date(y, m - 1, d, 0, 0, 0));
  }
  if (dateTo) {
    const [y, m, d] = dateTo.split('-').map(Number);
    result.dateTo = toMysqlUtcDatetime(new Date(y, m - 1, d + 1, 0, 0, 0));
  }

  return result;
}
