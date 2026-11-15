import fs from 'node:fs';
import path from 'node:path';
import * as repo from '../lib/repo';
import { dayBlocks } from '../lib/day';
import { weeksForYear } from '../lib/chartData';
import { archiveFile } from '../lib/chartAssets';
import { todayIST } from '../lib/time';

const today = todayIST();
const groups = [
  { market: 'night' as const, blocks: repo.years().map(({ year }) => ({ year, weeks: weeksForYear(year, today) })) },
  { market: 'day' as const, blocks: dayBlocks(today) },
];
fs.mkdirSync(path.resolve('public/chart-data'), { recursive: true });
let count = 0;
for (const { market, blocks } of groups) for (const block of blocks) {
  const asset = archiveFile(market, block);
  fs.writeFileSync(path.resolve('public', asset.url.slice(1)), asset.body);
  count++;
}
console.log(`Generated ${count} static chart data files; no Runtime Cache required for historical year tabs.`);
