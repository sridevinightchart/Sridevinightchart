import { addDays, mondayOf, parseDay } from './time';

export type Status = 'pending' | 'open' | 'closed' | 'holiday';

export interface Result {
  date: string; // YYYY-MM-DD (IST)
  openPana: string | null;
  closePana: string | null;
  jodi: string | null;
  status: Status;
  updatedAt: string; // ISO timestamp
}

/** Ank (single digit) of a pana: digit sum mod 10. 238 → 3 */
export function ank(pana: string): number {
  return [...pana].reduce((sum, d) => sum + Number(d), 0) % 10;
}

/** Jodi from open and close pana. 238 + 490 → "33" */
export function jodiFrom(openPana: string, closePana: string): string {
  return `${ank(openPana)}${ank(closePana)}`;
}

/**
 * A valid pana has 3 digits in non-decreasing order, where 0 counts as 10.
 * 490, 238, 550, 100 are valid; 924 is not.
 */
export function isValidPana(pana: string): boolean {
  if (!/^\d{3}$/.test(pana)) return false;
  const v = [...pana].map((d) => (d === '0' ? 10 : Number(d)));
  return v[0] <= v[1] && v[1] <= v[2];
}

export function isDoubleJodi(jodi: string | null): boolean {
  return !!jodi && /^\d\d$/.test(jodi) && jodi[0] === jodi[1];
}

/** Derive status from what has been entered */
export function statusFrom(openPana: string | null, closePana: string | null, holiday: boolean): Status {
  if (holiday) return 'holiday';
  if (openPana && closePana) return 'closed';
  if (openPana) return 'open';
  return 'pending';
}

export interface Display {
  open: string;
  jodi: string;
  close: string;
  text: string;
}

/** Display parts. Closed: 238-33-490, open-only: 238-3*-***, otherwise ***-**-*** */
export function display(r: Result | null | undefined): Display {
  if (!r || r.status === 'pending' || r.status === 'holiday') {
    return { open: '***', jodi: '**', close: '***', text: '***-**-***' };
  }
  // Historical imports can contain a declared jodi without either pana.
  // Preserve the recorded digits, including leading zeros, without inventing panas.
  if (r.status === 'closed') {
    const open = r.openPana ?? '***';
    const close = r.closePana ?? '***';
    const jodi = r.jodi ?? (r.openPana && r.closePana ? jodiFrom(r.openPana, r.closePana) : '**');
    return { open, jodi, close, text: `${open}-${jodi}-${close}` };
  }
  if (!r.openPana) {
    return { open: '***', jodi: '**', close: '***', text: '***-**-***' };
  }
  if (r.status === 'open' || !r.closePana) {
    const j = `${ank(r.openPana)}*`;
    return { open: r.openPana, jodi: j, close: '***', text: `${r.openPana}-${j}-***` };
  }
  const j = r.jodi ?? jodiFrom(r.openPana, r.closePana);
  return { open: r.openPana, jodi: j, close: r.closePana, text: `${r.openPana}-${j}-${r.closePana}` };
}

export type CellKind = 'result' | 'open' | 'holiday' | 'missing' | 'future' | 'pending';

export interface DayCell {
  date: string;
  kind: CellKind;
  result: Result | null;
}

export interface Week {
  monday: string;
  sunday: string;
  days: DayCell[]; // always 7, Mon → Sun
}

function cellKind(result: Result | undefined, date: string, today: string): CellKind {
  if (date > today) return 'future';
  if (!result) return date === today ? 'pending' : 'missing';
  if (result.status === 'closed') return 'result';
  if (result.status === 'open') return 'open';
  if (result.status === 'holiday') return 'holiday';
  return date === today ? 'pending' : 'missing';
}

/**
 * Group results into Monday–Sunday weeks between `from` and `to` (inclusive, by week),
 * oldest first. Days without data are filled so the grid never has holes.
 */
export function groupByWeek(results: Result[], today: string, from?: string, to?: string): Week[] {
  if (!results.length && !from) return [];
  const byDate = new Map(results.map((r) => [r.date, r]));
  const sorted = results.map((r) => r.date).sort();
  const start = mondayOf(from ?? sorted[0]);
  const lastDay = to ?? (sorted[sorted.length - 1] > today ? sorted[sorted.length - 1] : today);
  const end = mondayOf(lastDay);
  const weeks: Week[] = [];
  for (let m = start; m <= end; m = addDays(m, 7)) {
    const days: DayCell[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(m, i);
      const r = byDate.get(date);
      days.push({ date, kind: cellKind(r, date, today), result: r ?? null });
    }
    weeks.push({ monday: m, sunday: addDays(m, 6), days });
  }
  return weeks;
}

/** Year a week belongs to for archive grouping: the year of its Thursday (ISO-style) */
export function weekYear(monday: string): number {
  return parseDay(addDays(monday, 3)).getUTCFullYear();
}
