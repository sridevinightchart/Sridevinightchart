import fs from 'node:fs';
import path from 'node:path';
import { observeMarket, reconcileMarket, MARKETS, type Market } from '../lib/marketSources';
import type { Result } from '../lib/matka';
import { addDays, minutesIST, todayIST } from '../lib/time';

async function update(market: Market) {
  const file = market === 'night' ? 'data/results.json' : 'data/sridevi-day.json';
  const existing = JSON.parse(fs.readFileSync(file, 'utf8')) as Result[];
  const now = new Date();
  const minute = minutesIST(now), config = MARKETS[market];
  const expected = minute < config.start ? addDays(todayIST(now), -1) : todayIST(now);
  if (!process.argv.includes('--force') && (minute < config.start || minute > config.end) && existing.some((r) => r.date === expected && (r.status === 'closed' || r.status === 'holiday'))) {
    console.log(`${config.name}: ${expected} is complete; next publication window is not due.`);
    return;
  }
  const sources = await observeMarket(market, now);
  const rows = reconcileMarket(market, sources, existing, new Date());
  const changed = JSON.stringify(rows) !== JSON.stringify(existing);
  if (changed && !process.argv.includes('--dry')) {
    const temporary = path.resolve(`${file}.tmp`);
    fs.writeFileSync(temporary, JSON.stringify(rows, null, 2) + '\n');
    fs.renameSync(temporary, path.resolve(file));
  }
  console.log(`${MARKETS[market].name}: ${changed ? 'new source-agreed records validated' : 'saved records unchanged'}; latest completed date ${rows.filter(r => r.status === 'closed').at(-1)?.date ?? 'none'}.`);
}
async function main() {
  // A source outage in one market must not stop the other market from publishing.
  const markets: Market[] = ['day', 'night'];
  const results = await Promise.allSettled(markets.map(update));
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`${markets[index]} update failed: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
      process.exitCode = 1;
    }
  });
}
main();
