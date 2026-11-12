/**
 * Import jodi-only data scraped from sattamatkajodi.com.
 * - Maps the 320 weekly rows to real calendar dates starting Sep 7 2020.
 * - Skips dates that already have full pana data (keeps verified records).
 * - Skips the known 2020 Diwali closure (Oct 12 – Nov 22).
 * - Skips known annual holidays (Jan 26, Aug 15, Holi approx Mar).
 * - Inserts everything else as a jodi-only closed result.
 *
 * Run:  npx tsx scripts/import-jodi-web.ts
 */
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = path.resolve('./data/sridevi-night.db');
const HTML_PATH = path.resolve('./data/sridevi_raw.html');

if (!fs.existsSync(HTML_PATH)) {
  console.error('Missing data/sridevi_raw.html — run the fetch first:');
  console.error('  curl -sL -A "Mozilla/5.0" "https://www.sattamatkajodi.com/sridevi-night-chart" -o data/sridevi_raw.html');
  process.exit(1);
}

const html = fs.readFileSync(HTML_PATH, 'utf8');
const tds = [...html.matchAll(/<td[^>]*>\s*([0-9]+)\s*<\/td>/g)]
  .map(m => m[1].trim())
  .filter(v => /^\d{2}$/.test(v)); // only valid 2-digit jodis

console.log(`Parsed ${tds.length} jodi entries (${Math.floor(tds.length / 7)} full weeks)`);

// ── Date helpers ───────────────────────────────────────
function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Known definite no-result periods
const SKIP_RANGES: Array<[string, string]> = [
  ['2020-10-12', '2020-11-22'], // 2020 Diwali closure
];
const SKIP_DATES = new Set<string>();
// Republic Day, Independence Day each year
for (let y = 2019; y <= 2026; y++) {
  SKIP_DATES.add(`${y}-01-26`);
  SKIP_DATES.add(`${y}-08-15`);
}
// Add closure ranges
for (const [from, to] of SKIP_RANGES) {
  let d = from;
  while (d <= to) {
    SKIP_DATES.add(d);
    d = addDays(d, 1);
  }
}

// ── Database ───────────────────────────────────────────
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

const getStmt = db.prepare('SELECT status, open_pana, jodi FROM results WHERE date = ?');
const upsertStmt = db.prepare(`
  INSERT INTO results (date, open_pana, close_pana, jodi, status, updated_at)
  VALUES (?, NULL, NULL, ?, 'closed', ?)
  ON CONFLICT(date) DO UPDATE SET
    jodi = excluded.jodi,
    status = 'closed',
    updated_at = excluded.updated_at
  WHERE open_pana IS NULL  -- never overwrite records that already have pannas
`);

// ── Import ─────────────────────────────────────────────
const START_DATE = '2020-09-07'; // Row 1 = Mon Sep 7 2020
const now = new Date().toISOString();

let inserted = 0, skippedHasPana = 0, skippedHoliday = 0, skippedAlready = 0;

const run = db.transaction(() => {
  for (let i = 0; i < tds.length; i++) {
    const date = addDays(START_DATE, i);
    const jodi = tds[i];

    if (SKIP_DATES.has(date)) { skippedHoliday++; continue; }

    const existing = getStmt.get(date) as { status: string; open_pana: string | null; jodi: string | null } | undefined;

    if (existing?.open_pana) {
      // Has verified pana data — do not touch
      skippedHasPana++;
      continue;
    }
    if (existing?.jodi === jodi && existing?.status === 'closed') {
      skippedAlready++;
      continue;
    }

    upsertStmt.run(date, jodi, now);
    inserted++;
  }
});

run();

console.log(`\nDone:`);
console.log(`  Inserted / updated : ${inserted}`);
console.log(`  Skipped (has pannas): ${skippedHasPana}`);
console.log(`  Skipped (holiday)   : ${skippedHoliday}`);
console.log(`  Skipped (unchanged) : ${skippedAlready}`);

const stats = db.prepare(`
  SELECT substr(date,1,4) as yr,
    COUNT(*) as total,
    SUM(CASE WHEN status='closed' THEN 1 ELSE 0 END) as closed,
    SUM(CASE WHEN status='closed' AND open_pana IS NOT NULL THEN 1 ELSE 0 END) as with_pana
  FROM results GROUP BY yr ORDER BY yr
`).all() as Array<{ yr: string; total: number; closed: number; with_pana: number }>;

console.log('\nDatabase by year:');
stats.forEach(r =>
  console.log(`  ${r.yr}: ${r.closed} results (${r.with_pana} with pannas, ${r.closed - r.with_pana} jodi-only), ${r.total} total rows`)
);
