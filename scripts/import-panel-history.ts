/** Import dated panel archive snapshots; validate first and preserve existing full results. */
import fs from 'node:fs';
import path from 'node:path';
import { db } from '../lib/db';
import { isValidPana, jodiFrom, type Result } from '../lib/matka';
import * as repo from '../lib/repo';
import { todayIST } from '../lib/time';

async function main() {
  const dry = process.argv.includes('--dry');
  const files = fs.readdirSync('data').filter((name) => /^panel-source(?:-\d+)?\.html$/.test(name));
  if (!files.length) throw new Error('No panel-source HTML snapshots in data/');
  const records = new Map<string, Result>();
  let correctedJodis = 0;
  const rejected: string[] = [];
  for (const file of files) {
    const html = fs.readFileSync(path.join('data', file), 'utf8');
    for (const cell of html.matchAll(/<td\b[^>]*aria-label="(\d{4}-\d{2}-\d{2}): Published"[^>]*>([\s\S]*?)<\/td>/g)) {
      const date = cell[1];
      const numbers = cell[2].match(/<span>(\d{3})<\/span>\s*<strong>(\d{2})<\/strong>\s*<span>(\d{3})<\/span>/);
      if (!numbers || date > todayIST()) continue;
      const [, openPana, jodi, closePana] = numbers;
      if (!isValidPana(openPana) || !isValidPana(closePana) || jodiFrom(openPana, closePana) !== jodi) {
        rejected.push(`${file}: ${date} ${openPana}-${jodi}-${closePana}`);
        continue;
      }
      const existing = repo.getByDate(date);
      if (existing?.openPana || existing?.closePana) continue;
      if (existing?.jodi && existing.jodi !== jodi) correctedJodis++;
      const record = { date, openPana, jodi, closePana, status: 'closed' as const, updatedAt: new Date().toISOString() };
      const previous = records.get(date);
      if (previous && (previous.openPana !== openPana || previous.closePana !== closePana)) {
        throw new Error(`Conflicting source records for ${date}`);
      }
      records.set(date, record);
    }
  }
  console.log(`${records.size} validated full records; ${correctedJodis} jodi-only values corrected from dated panels.`);
  console.log(`${rejected.length} invalid source records rejected.`);
  if (rejected.length && !dry) fs.writeFileSync('data/panel-import-rejected.txt', rejected.join('\n') + '\n');
  if (dry || !records.size) return;
  const backup = path.resolve('data', `before-panel-import-${Date.now()}.db`);
  await db().backup(backup);
  repo.upsertMany([...records.values()]);
  console.log(`Saved records. Database backup: ${backup}`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
