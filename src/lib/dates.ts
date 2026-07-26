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
