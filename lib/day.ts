import snapshot from '@/data/sridevi-day.json';
import { groupByWeek, weekYear, type Result } from './matka';
import { todayIST } from './time';
import { buildLive, type LivePayload } from './live';

// Isolated Day market snapshot. Never fall back to Night records.
export const DAY_FIRST_DATE = '2018-03-05';
// Page edition dates are separate from the dated result records.
export const DAY_PUBLISHED = '2026-11-26T02:59:26Z';
export const DAY_MODIFIED = DAY_PUBLISHED;
export function dayResults(): Result[] { return snapshot.map((row) => ({ ...row } as Result)); }
export function dayBlocks(today = todayIST(), records: Result[] = dayResults()) {
  const rows = records.filter((r) => r.date <= today);
  const weeks = groupByWeek(rows, today, DAY_FIRST_DATE, today);
  return Array.from(new Set(weeks.map((week) => weekYear(week.monday))))
    .sort((a, b) => b - a)
    .map((year) => ({ year, weeks: weeks.filter((week) => weekYear(week.monday) === year) }));
}
export function dayLastUpdated(): string | null { return dayResults().map((row) => row.updatedAt).sort().at(-1) ?? null; }
export function buildDayLive(now = new Date(), records: Result[] = dayResults()): LivePayload {
  return buildLive(now, records, dayLastUpdated());
}
