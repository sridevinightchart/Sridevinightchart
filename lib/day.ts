import snapshot from '@/data/sridevi-day.json';
import { groupByWeek, weekYear, type Result } from './matka';
import { addDays, mondayOf, todayIST } from './time';
import type { LivePayload } from './live';

// Isolated Day market snapshot. Never fall back to Night records.
export const DAY_FIRST_DATE = '2018-03-05';
export const DAY_MODIFIED = '2026-11-13T20:00:00Z';
export function dayResults(): Result[] { return snapshot.map((row) => ({ ...row } as Result)); }
export function dayBlocks(today = todayIST()) {
  const rows = dayResults().filter((r) => r.date <= today);
  const weeks = groupByWeek(rows, today, DAY_FIRST_DATE, today);
  return Array.from(new Set(weeks.map((week) => weekYear(week.monday))))
    .sort((a, b) => b - a)
    .map((year) => ({ year, weeks: weeks.filter((week) => weekYear(week.monday) === year) }));
}
export function buildDayLive(now = new Date(), records: Result[] = dayResults()): LivePayload {
  const date = todayIST(now);
  const rows = records.filter((row) => row.date <= date).sort((a, b) => a.date.localeCompare(b.date));
  const byDate = new Map(rows.map((row) => [row.date, row]));
  return {
    version: rows.map((row) => row.updatedAt).sort().at(-1) ?? null,
    date, today: byDate.get(date) ?? null,
    latest: rows.filter((row) => row.status === 'closed').at(-1) ?? null,
    yesterday: byDate.get(addDays(date, -1)) ?? null,
    week: Array.from({ length: 7 }, (_, i) => {
      const day = addDays(mondayOf(date), i);
      return { date: day, result: byDate.get(day) ?? null };
    }),
  };
}
