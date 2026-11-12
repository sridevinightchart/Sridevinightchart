/**
 * Generates a CSV template for historical data entry.
 * Outputs one row per day from 2019-12-30 to the day before existing data,
 * with *** for unknown results so the chart shows honest gaps.
 *
 * Run:  npx tsx scripts/generate-historical-csv.ts
 * This creates data/sridevi-night-historical.csv
 * Edit that file to fill in the actual results, then run:
 *   npx tsx scripts/import.ts data/sridevi-night-historical.csv
 */
import fs from 'node:fs';
import path from 'node:path';

const START = '2019-12-30';
const END   = '2026-07-26'; // day before existing CSV starts

function addDays(date: string, n: number): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Known Republic Day / Independence Day / Holi holidays (approximate)
const HOLIDAYS = new Set([
  // Republic Day
  '2020-01-26','2021-01-26','2022-01-26','2023-01-26','2024-01-26','2025-01-26','2026-01-26',
  // Independence Day
  '2020-08-15','2021-08-15','2022-08-15','2023-08-15','2024-08-15','2025-08-15',
  // The Diwali/autumn 2020 gap: 12 Oct – 22 Nov 2020
  ...Array.from({ length: 42 }, (_, i) => addDays('2020-10-12', i)),
]);

const lines: string[] = ['date,open_pana,jodi,close_pana'];
let d = START;
while (d <= END) {
  if (HOLIDAYS.has(d)) {
    lines.push(`${d},***,**,***`);
  } else {
    // unknown — mark as holiday so it imports as stars in the chart
    lines.push(`${d},***,**,***`);
  }
  d = addDays(d, 1);
}

const out = path.resolve('data/sridevi-night-historical-template.csv');
fs.writeFileSync(out, lines.join('\n') + '\n');
console.log(`Written ${lines.length - 1} rows to ${out}`);
console.log('Edit that file to replace *** lines with real results,');
console.log('then run: npx tsx scripts/import.ts data/sridevi-night-historical-template.csv');
