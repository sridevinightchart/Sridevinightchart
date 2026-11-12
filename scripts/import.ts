/**
 * Import Sridevi Night results from data/sridevi-night.csv (or a path given as the first argument).
 *
 * CSV columns: date,open_pana,jodi,close_pana
 *   date: YYYY-MM-DD or DD-MM-YYYY
 *   holidays: ***,**,***
 *
 * Every row is validated. Invalid rows and jodi mismatches are reported and NOT imported.
 * Run:  npm run import            (import)
 *       npm run import -- --dry   (validate only)
 */
import fs from 'node:fs';
import path from 'node:path';
import { isValidPana, jodiFrom, type Result } from '../lib/matka';
import * as repo from '../lib/repo';

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const file = path.resolve(args.find((a) => !a.startsWith('--')) ?? 'data/sridevi-night.csv');

function normDate(s: string): string | null {
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{2})[-/.](\d{2})[-/.](\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}

const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const header = lines[0].toLowerCase().startsWith('date') ? lines.shift() : null;
if (!header) console.warn('No header row found, treating the first line as data.');

const ok: Result[] = [];
const problems: string[] = [];
const seen = new Set<string>();
const now = new Date().toISOString();

lines.forEach((line, i) => {
  const n = i + (header ? 2 : 1);
  const [rawDate, open, jodi, close] = line.split(',').map((c) => c.trim());
  const date = normDate(rawDate ?? '');
  if (!date) return problems.push(`line ${n}: bad date "${rawDate}"`);
  if (seen.has(date)) return problems.push(`line ${n}: duplicate date ${date}`);
  seen.add(date);

  if (/^\*+$/.test(open ?? '') && /^\*+$/.test(close ?? '')) {
    ok.push({ date, openPana: null, closePana: null, jodi: null, status: 'holiday', updatedAt: now });
    return;
  }
  if (!isValidPana(open ?? '')) return problems.push(`line ${n}: ${date} invalid open pana "${open}"`);
  if (!isValidPana(close ?? '')) return problems.push(`line ${n}: ${date} invalid close pana "${close}"`);
  const calc = jodiFrom(open, close);
  if (jodi && jodi !== calc) return problems.push(`line ${n}: ${date} jodi "${jodi}" does not match panas ${open}/${close} (should be ${calc})`);
  ok.push({ date, openPana: open, closePana: close, jodi: calc, status: 'closed', updatedAt: now });
});

console.log(`\nFile: ${file}`);
console.log(`Valid rows:   ${ok.length}`);
console.log(`Problem rows: ${problems.length}`);
if (problems.length) {
  console.log('\nFix these rows and run the import again:');
  problems.forEach((p) => console.log('  - ' + p));
}

if (dry) {
  console.log('\nDry run: nothing was written.');
} else {
  repo.upsertMany(ok);
  console.log(`\nImported ${ok.length} rows into the database.`);
}
process.exit(problems.length && !dry ? 1 : 0);
