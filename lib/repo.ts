// Vercel reads the committed snapshot; the scheduled updater writes it in GitHub.
import fs from 'node:fs';
import path from 'node:path';
import snapshot from '../data/results.json';
import type { Result } from './matka';

let current = snapshot as Result[];
export function getAll(): Result[] {
  const rows = process.env.RESULTS_PATH ? JSON.parse(fs.readFileSync(process.env.RESULTS_PATH, 'utf8')) as Result[] : current;
  return rows.map((row) => ({ ...row })).sort((a, b) => a.date.localeCompare(b.date));
}
export function getRange(from: string, to: string): Result[] { return getAll().filter((r) => r.date >= from && r.date <= to); }
export function getByDate(date: string): Result | null { return getAll().find((r) => r.date === date) ?? null; }
export function recent(limit: number): Result[] { return getAll().reverse().slice(0, limit); }
function save(rows: Result[]): void {
  if (process.env.VERCEL) throw new Error('Vercel is read-only: publish results with the scheduled GitHub updater.');
  const target = path.resolve(process.env.RESULTS_PATH || 'data/results.json');
  const temporary = `${target}.tmp`;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(temporary, JSON.stringify(rows, null, 2) + '\n');
  fs.renameSync(temporary, target);
  current = rows;
}
export function upsertMany(rows: Result[]): void {
  const byDate = new Map(getAll().map((r) => [r.date, r]));
  for (const row of rows) byDate.set(row.date, row);
  save([...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)));
}
export function upsert(row: Result): void { upsertMany([row]); }
export function remove(date: string): void { save(getAll().filter((r) => r.date !== date)); }
export function lastUpdated(): string | null { return getAll().reduce<string | null>((latest, r) => !latest || r.updatedAt > latest ? r.updatedAt : latest, null); }
export interface YearSummary { year: number; results: number; first: string; last: string; }
export function years(): YearSummary[] {
  const groups = new Map<number, YearSummary>();
  for (const r of getAll()) {
    const year = Number(r.date.slice(0, 4));
    const group = groups.get(year) ?? { year, results: 0, first: r.date, last: r.date };
    group.last = r.date;
    if (r.status === 'closed') group.results++;
    groups.set(year, group);
  }
  return [...groups.values()].sort((a, b) => a.year - b.year);
}
export function firstDate(): string | null { return getAll()[0]?.date ?? null; }
