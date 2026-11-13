import fs from 'node:fs';
import type { Result } from '../lib/matka';
import { addDays, minutesIST, todayIST } from '../lib/time';
const dayOnly = process.argv.includes('--day');
const expected = dayOnly && minutesIST() >= 15 * 60 ? todayIST() : addDays(todayIST(), -1);
for (const market of dayOnly ? ['day'] : ['day', 'night']) {
  const file = market === 'night' ? 'data/results.json' : 'data/sridevi-day.json';
  const rows = JSON.parse(fs.readFileSync(file, 'utf8')) as Result[];
  const record = rows.find(row => row.date === expected);
  if (record?.status !== 'closed' && record?.status !== 'holiday') {
    console.error(market + ': no completed result or confirmed closure for ' + expected + '. Existing records retained; inspect source availability.');
    process.exitCode = 1;
  } else console.log(market + ': daily record verified for ' + expected + '.');
}
