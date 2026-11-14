import { sourceRecord } from './resultFeed';
import type { Result } from './matka';
import { ank } from './matka';
import { minutesIST, todayIST } from './time';

// Keep checking until the end of the IST day so delayed jobs/late closes can catch up.
export const LIVE_WINDOW = { start: 19 * 60 + 15, end: 23 * 60 + 59 };
export interface HeroResult { open: string; jodi: string; close: string; date?: string; }

/** Read only the actual live hero, excluding adverts, chart history and scripts. */
export function parseLiveHero(html: string, source: string): HeroResult | null {
  const body = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  const host = new URL(source).hostname;
  const openings = [...body.matchAll(/<div\b[^>]*>/gi)];
  const opening = openings.find((match) => {
    if (host === 'khabar.bet') return /\bid\s*=\s*["']live-updates["']/i.test(match[0]);
    if (host !== 'matka-tips.org') return false;
    const classes = match[0].match(/\bclass\s*=\s*["']([^"']*)["']/i)?.[1].split(/\s+/) ?? [];
    return classes.includes('live');
  });
  if (!opening || opening.index === undefined) return null;
  const rest = body.slice(opening.index);
  let depth = 0, end = -1;
  for (const tag of rest.matchAll(/<\/?div\b[^>]*>/gi)) {
    depth += /^<\//.test(tag[0]) ? -1 : 1;
    if (!depth) { end = tag.index! + tag[0].length; break; }
  }
  if (end < 0) return null;
  const hero = rest.slice(0, end);
  const plain = hero.replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#\d+;/g, ' ').replace(/\s+/g, ' ');
  const matches = [...plain.matchAll(/\bSRIDEVI\s+NIGHT\s*(?:⏳\s*)?(\d{3})\s*[-–]\s*(\d{1,2}|\d\*)(?:\s*[-–]\s*(\d{3}|\*{3})?)?(?=\s|$)/gi)];
  if (matches.length !== 1) return null;
  const [, open, middle, suppliedClose] = matches[0];
  // Some live blocks show only "470-1" during open publication.
  if (!suppliedClose && !/^\d\*?$/.test(middle)) return null;
  const close = suppliedClose ?? '***';
  const jodi = /^\d$/.test(middle) && close === '***' ? `${middle}*` : middle;
  const date = hero.match(/\b(?:data-date|datetime)\s*=\s*["'](\d{4}-\d{2}-\d{2})["']/i)?.[1];
  return { open, jodi, close, ...(date ? { date } : {}) };
}

export function agreedLiveResult(heroes: (HeroResult | null)[], existing: Result[], now = new Date()): { record: Result | null; message: string } {
  const date = todayIST(now), minute = minutesIST(now);
  if (minute < LIVE_WINDOW.start || minute > LIVE_WINDOW.end) return { record: null, message: 'Outside the evening publication/retry window; no undated live number assigned to today.' };
  if (heroes.length !== 2 || heroes.some((hero) => !hero)) throw new Error('Both approved live heroes must be available. Existing result retained.');
  const [a, b] = heroes as HeroResult[];
  if ([a, b].some((hero) => hero.date && hero.date !== date)) throw new Error('Source hero has a different date; existing result retained.');
  const first = sourceRecord(date, a.open, a.jodi, a.close, now.toISOString());
  const second = sourceRecord(date, b.open, b.jodi, b.close, now.toISOString());
  if (!first || !second) throw new Error('Live hero failed panna or jodi validation.');
  if (first.openPana !== second.openPana) throw new Error('Live sources disagree on the open panna.');
  if (first.closePana && second.closePana && first.closePana !== second.closePana) throw new Error('Live sources disagree on the close panna.');
  // A completed close is published only once both sources show it. A shared open can publish earlier.
  const record = first.closePana && second.closePana ? first : sourceRecord(date, a.open, `${ank(a.open)}*`, '***', now.toISOString())!;
  const previous = [...existing].filter((r) => r.date < date && r.status === 'closed' && r.openPana && r.closePana).sort((x, y) => y.date.localeCompare(x.date))[0];
  if (!previous) throw new Error('No previous completed result to check for stale carry-over.');
  const samePrevious = record.status === 'closed'
    ? record.openPana === previous.openPana && record.closePana === previous.closePana
    : record.openPana === previous.openPana;
  if (samePrevious) return { record: null, message: 'Live numbers still match the prior result; waiting for a verifiable change.' };
  record.provenance = { dateBasis: 'owner-approved-publication-window', observedAt: now.toISOString(), sources: ['https://matka-tips.org/record-chart/sridevi-night-jodi', 'https://khabar.bet/sridevi-night-matka-chart'] };
  return { record, message: record.status === 'closed' ? 'Both live sources agree on the full result.' : 'Both live sources agree on the open; waiting for a matching close.' };
}
