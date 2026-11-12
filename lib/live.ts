import type { Result } from './matka';
import * as repo from './repo';
import { addDays, mondayOf, todayIST } from './time';

export interface LivePayload {
  version?: string | null;
  date: string; // today (IST)
  today: Result | null;
  latest?: Result | null; // Latest completed result, never later than today's IST date.
  yesterday: Result | null;
  week: { date: string; result: Result | null }[]; // Mon → Sun of the current week
}

export function buildLive(now: Date = new Date()): LivePayload {
  const date = todayIST(now);
  const monday = mondayOf(date);
  const sunday = addDays(monday, 6);
  const rows = repo.getRange(addDays(monday, -1), sunday);
  const by = new Map(rows.map((r) => [r.date, r]));
  return {
    version: repo.lastUpdated(),
    date,
    today: by.get(date) ?? null,
    latest: repo.getAll().reverse().find((r) => r.date <= date && r.status === 'closed' && /^\d{2}$/.test(r.jodi ?? '')) ?? null,
    yesterday: repo.getByDate(addDays(date, -1)),
    week: Array.from({ length: 7 }, (_, i) => {
      const d = addDays(monday, i);
      return { date: d, result: by.get(d) ?? null };
    }),
  };
}
