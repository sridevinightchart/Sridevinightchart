// All market time is India Standard Time, whatever timezone the server runs in.
export const TZ = 'Asia/Kolkata';

const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const hm = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });

/** Today's date in IST as YYYY-MM-DD */
export function todayIST(now: Date = new Date()): string {
  return ymd.format(now);
}

/** Minutes since midnight in IST */
export function minutesIST(now: Date = new Date()): number {
  const [h, m] = hm.format(now).split(':').map(Number);
  return (h % 24) * 60 + m;
}

/** Parse YYYY-MM-DD as a UTC-midnight Date (pure calendar arithmetic, no TZ drift) */
export function parseDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(day: string, n: number): string {
  const d = parseDay(day);
  d.setUTCDate(d.getUTCDate() + n);
  return formatDay(d);
}

/** Monday of the week containing `day` */
export function mondayOf(day: string): string {
  const d = parseDay(day);
  const dow = (d.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  return addDays(day, -dow);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAYS_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function weekdayIndex(day: string): number {
  return (parseDay(day).getUTCDay() + 6) % 7;
}

/** "Tue, 10 Nov 2026" */
export function labelShort(day: string): string {
  const d = parseDay(day);
  return `${WEEKDAYS[weekdayIndex(day)]}, ${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "Tuesday 10 November 2026" */
export function labelLong(day: string): string {
  const d = parseDay(day);
  return `${WEEKDAYS_LONG[weekdayIndex(day)]} ${d.getUTCDate()} ${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "09 Nov" */
export function labelDayMonth(day: string): string {
  const d = parseDay(day);
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS[d.getUTCMonth()]}`;
}

/** "09 Nov – 15 Nov 2026" */
export function weekLabel(monday: string): string {
  const sunday = addDays(monday, 6);
  return `${labelDayMonth(monday)} – ${labelDayMonth(sunday)} ${parseDay(sunday).getUTCFullYear()}`;
}

/** "8:17 PM IST" for an ISO timestamp */
export function timeLabelIST(iso: string): string {
  const t = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso));
  return `${t} IST`;
}

/** "10 Nov 2026, 8:17 PM IST" */
export function stampIST(iso: string): string {
  const day = ymd.format(new Date(iso));
  const d = parseDay(day);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${timeLabelIST(iso)}`;
}
