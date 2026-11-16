import { createHash } from 'node:crypto';
import type { ChartBlock } from './chartTypes';
import { mondayOf } from './time';
import { weekYear } from './matka';

/** Charts need result values, not server-side verification metadata. */
function displayWeeks(block: ChartBlock) {
  return block.weeks.map((week) => ({ ...week, days: week.days.map((day) => ({ ...day,
    result: day.result ? { date: day.result.date, openPana: day.result.openPana, jodi: day.result.jodi, closePana: day.result.closePana, status: day.result.status, updatedAt: '' } : null,
  })) }));
}

/** Display data only: source provenance and observation timestamps aren't chart content. */
export function archiveFile(market: 'night' | 'day', block: ChartBlock) {
  const weeks = displayWeeks(block).map((week) => ({ ...week, days: week.days.map((day) => ({ ...day,
    // Archived years are always in the past when loaded. Keep their content hash
    // independent of the build date, including across the January ISO-week boundary.
    kind: day.kind === 'future' || day.kind === 'pending' ? 'missing' : day.kind,
  })) }));
  const body = JSON.stringify({ year: block.year, weeks });
  const hash = createHash('sha256').update(body).digest('hex').slice(0, 16);
  return { body, url: `/chart-data/${market}-${block.year}-${hash}.json` };
}

/** Only the current calendar/ISO years need live data in the initial page response. */
export function chartDelivery(market: 'night' | 'day', blocks: ChartBlock[], today: string) {
  const liveYears = new Set([Number(today.slice(0, 4)), weekYear(mondayOf(today))]);
  const initialBlocks = blocks.filter((block) => liveYears.has(block.year))
    .map((block) => ({ ...block, weeks: displayWeeks(block) }));
  return {
    initialBlocks,
    archives: blocks.filter((block) => !liveYears.has(block.year)).map((block) => ({ year: block.year, url: archiveFile(market, block).url })),
  };
}
