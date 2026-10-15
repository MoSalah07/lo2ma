/** A 24-hour "HH:mm" time, the format the API uses for break times and arrivals. */
export const TIME_24H = /^([01]\d|2[0-3]):([0-5]\d)$/;

function toMinutes(time: string): number {
  const match = TIME_24H.exec(time);
  if (!match) throw new RangeError(`Expected a 24-hour "HH:mm" time, got "${time}"`);
  return Number(match[1]) * 60 + Number(match[2]);
}

function fromMinutes(total: number): string {
  const wrapped = ((total % 1440) + 1440) % 1440;
  const hours = Math.floor(wrapped / 60);
  const minutes = wrapped % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Turns a 24-hour "HH:mm" time into the 12-hour form the designs use, without م/PM: "13:30" → "1:30".
 * Every time in the app is around lunch, so the suffix adds nothing.
 */
export function formatTime(time: string): string {
  const minutes = toMinutes(time);
  const hours = Math.floor(minutes / 60) % 12 || 12;
  return `${hours}:${String(minutes % 60).padStart(2, '0')}`;
}

/** "13:30" + -15 → "13:15". Wraps around midnight. */
export function addMinutes(time: string, minutes: number): string {
  return fromMinutes(toMinutes(time) + minutes);
}

/** Minutes from `from` to `to` on the same day: ("13:15", "13:30") → 15. */
export function minutesBetween(from: string, to: string): number {
  return toMinutes(to) - toMinutes(from);
}
