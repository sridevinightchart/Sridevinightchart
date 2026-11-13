import fs from 'node:fs';
import { isValidPana, jodiFrom, type Result } from '../lib/matka';
for (const file of ['data/results.json', 'data/sridevi-day.json']) {
const rows: Result[] = JSON.parse(fs.readFileSync(file, 'utf8'));
const dates = new Set<string>();
for (const r of rows) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date) || Number.isNaN(Date.parse(r.date)) || new Date(r.date).toISOString().slice(0, 10) !== r.date || dates.has(r.date)) throw new Error(`Invalid or duplicate date: ${r.date}`);
  dates.add(r.date);
  if (!['pending', 'holiday', 'open', 'closed'].includes(r.status)) throw new Error(`Invalid status: ${r.date}`);
  if (Number.isNaN(Date.parse(r.updatedAt))) throw new Error(`Invalid timestamp: ${r.date}`);
  for (const pana of [r.openPana, r.closePana]) if (pana !== null && !isValidPana(pana)) throw new Error(`Invalid pana: ${r.date}`);
  if (r.status === 'closed' && !/^\d{2}$/.test(r.jodi ?? '')) throw new Error(`Missing jodi: ${r.date}`);
  if (r.status === 'open' && (!r.openPana || r.closePana)) throw new Error(`Invalid open result: ${r.date}`);
  if (r.openPana && r.closePana && r.jodi !== jodiFrom(r.openPana, r.closePana)) throw new Error(`Jodi mismatch: ${r.date}`);
}
console.log(`Validated ${rows.length} records in ${file}.`);
}
