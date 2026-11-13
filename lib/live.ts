import { createHash } from 'node:crypto';
import type { Result } from './matka';
import * as repo from './repo';
import { addDays, mondayOf, todayIST } from './time';

export interface LivePayload {
  version?: string | null;
  snapshotVersion?: string | null;
  date: string; // today (IST)
  today: Result | null;
  latest?: Result | null; // Latest completed result, never later than today's IST date.
  yesterday: Result | null;
  week: { date: string; result: Result | null }[]; // Mon → Sun of the current week
}

export function buildLive(now: Date = new Date(), records: Result[] = repo.getAll(), snapshotVersion = repo.lastUpdated()): LivePayload {
  const date = todayIST(now);
  const monday = mondayOf(date);
  const sunday = addDays(monday, 6);
  const rows = records.filter((r) => r.date >= addDays(monday, -1) && r.date <= sunday && r.date <= date);
  const by = new Map(rows.map((r) => [r.date, r]));
  return {
    version: resultsVersion(records),
    snapshotVersion,
    date,
    today: by.get(date) ?? null,
    latest: [...records].sort((a, b) => b.date.localeCompare(a.date)).find((r) => r.date <= date && r.status === 'closed' && /^\d{2}$/.test(r.jodi ?? '')) ?? null,
    yesterday: records.find((r) => r.date === addDays(date, -1)) ?? null,
    week: Array.from({ length: 7 }, (_, i) => {
      const d = addDays(monday, i);
      return { date: d, result: by.get(d) ?? null };
    }),
  };
}

/** Stable across identical source polls; observation timestamps do not change the UI version. */
export function resultsVersion(rows: Result[]): string {
  return createHash('sha256').update(JSON.stringify(rows.map((r) => [r.date, r.status, r.openPana, r.jodi, r.closePana]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))))).digest('hex');
}
