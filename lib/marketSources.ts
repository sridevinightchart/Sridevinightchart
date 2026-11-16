import type { Result } from './matka';
import { ank, isValidPana, jodiFrom } from './matka';
import { sourceRecord, mergePublished } from './resultFeed';
import { parseLiveHero, type HeroResult } from './liveSource';
import { addDays, minutesIST, todayIST } from './time';
import { MARKET_TIMINGS } from './marketTiming';

export type Market = 'night' | 'day';
export const MARKETS = {
  night: { name: 'Sridevi Night', start: MARKET_TIMINGS.night.openMinute, end: MARKET_TIMINGS.night.pollEndMinute, sources: [
    'https://matka-tips.org/record-chart/sridevi-night-jodi',
    'https://khabar.bet/sridevi-night-matka-chart',
  ] },
  day: { name: 'Sridevi Day', start: MARKET_TIMINGS.day.openMinute, end: MARKET_TIMINGS.day.pollEndMinute, sources: [
    'https://matka-tips.org/record-chart/sridevi-jodi',
    'https://sattamatkajodi.com/record/sridevi-satta-penal-chart.php',
  ] },
} as const;

export function stripUnsafeHtml(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
}

/** Only the named live block on an approved Day page; never ads or another market. */
export function parseDayHero(html: string, source: string): HeroResult | null {
  const body = stripUnsafeHtml(html);
  const host = new URL(source).hostname;
  const opening = [...body.matchAll(/<div\b[^>]*>/gi)].find((m) => host === 'matka-tips.org'
    ? (m[0].match(/\bclass=["']([^"']*)["']/i)?.[1].split(/\s+/).includes('live') ?? false)
    : host === 'sattamatkajodi.com' && /\bid=["']chart-top-result["']/i.test(m[0]));
  if (!opening || opening.index === undefined) return null;
  const rest = body.slice(opening.index);
  let depth = 0, end = -1;
  for (const tag of rest.matchAll(/<\/?div\b[^>]*>/gi)) {
    depth += tag[0].startsWith('</') ? -1 : 1;
    if (!depth) { end = tag.index! + tag[0].length; break; }
  }
  if (end < 0) return null;
  const hero = rest.slice(0, end);
  const plain = hero.replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#\d+;/g, ' ').replace(/\s+/g, ' ');
  const matches = [...plain.matchAll(/\bSRIDEVI(?:\s+DAY)?\s*(?:⏳\s*)?(\d{3})\s*[-–]\s*(\d{1,2}|\d\*)(?:\s*[-–]\s*(\d{3}|\*{3})?)?(?=\s|$)/gi)];
  if (matches.length !== 1) return null;
  const [, open, middle, suppliedClose] = matches[0];
  if (!suppliedClose && !/^\d\*?$/.test(middle)) return null;
  const close = suppliedClose ?? '***';
  const date = hero.match(/\b(?:data-date|datetime)=["'](\d{4}-\d{2}-\d{2})["']/i)?.[1];
  return { open, jodi: /^\d$/.test(middle) && close === '***' ? `${middle}*` : middle, close, ...(date ? { date } : {}) };
}

/** Explicit Monday–Sunday dates, including th cells and whole-day colspans. */
export function parseDatedPanels(html: string, now: string): Result[] {
  const records: Result[] = [];
  for (const row of stripUnsafeHtml(html).matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<t[dh]\b([^>]*)>([\s\S]*?)<\/t[dh]>/gi)];
    if (!cells.length) continue;
    const dates = [...cells[0][2].matchAll(/(\d{1,2})[/-](\d{1,2})[/-](\d{4}|\d{2})(?!\d)/g)].map((m) => `${m[3].length === 2 ? '20' + m[3] : m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`);
    if (dates.length !== 2 || dates.some((d) => Number.isNaN(Date.parse(d)) || new Date(d).toISOString().slice(0, 10) !== d)) continue;
    const [monday, sunday] = dates;
    if (new Date(monday).getUTCDay() !== 1 || addDays(monday, 6) !== sunday) continue;
    const values = cells.slice(1).flatMap((cell) => {
      const value = cell[2].replace(/<[^>]+>/g, '').replace(/&nbsp;|&#160;/gi, '').replace(/\s/g, '');
      const span = Number(cell[1].match(/colspan\s*=\s*["']?(\d+)/i)?.[1] ?? 1);
      if (span === 1 || (span === 2 && /^(?:\d{3}|\*{3})$/.test(value)) || (span === 3 && /^(?:\d{2}|\d\*)$/.test(value))) return [value];
      if ((span === 3 || span === 7) && /^(?:\*+|✪)?$/.test(value)) return ['***', '**', '***'];
      return ['INVALID'];
    });
    // Reject shortened rows instead of moving the following day's result left.
    if (values.length !== 21) continue;
    for (let day = 0; day < 7; day++) {
      const [open, middle, close] = values.slice(day * 3, day * 3 + 3);
      const jodi = /^\d$/.test(middle) && close === '***' ? `${middle}*` : middle;
      const record = sourceRecord(addDays(monday, day), open, jodi, close, now);
      if (record) records.push(record);
    }
  }
  return records;
}

export interface SourceObservation { source: string; hero: HeroResult | null; dated: Result[]; observedAt: string; }

/** Trim before writing the paid cache, rather than after reading all of history. */
export function compactObservations(sources: SourceObservation[], now = new Date()): SourceObservation[] {
  const date = todayIST(now), from = addDays(date, -2);
  return sources.map((source) => ({ ...source, dated: source.dated.filter((r) => r.date >= from && r.date <= date).map(({ date, openPana, jodi, closePana, status, updatedAt }) => ({ date, openPana, jodi, closePana, status, updatedAt })) }));
}

export function savedResultSufficient(market: Market, rows: Result[], now = new Date()): boolean {
  const date = todayIST(now);
  const complete = (r: Result | undefined) => !!r && (r.status === 'holiday' || (r.status === 'closed' && !!r.openPana && !!r.closePana && isValidPana(r.openPana) && isValidPana(r.closePana) && r.jodi === jodiFrom(r.openPana, r.closePana)));
  const current = rows.find((r) => r.date === date);
  if (complete(current)) return true;
  if (current?.status === 'open') return false;
  return minutesIST(now) < MARKETS[market].start && complete(rows.find((r) => r.date === addDays(date, -1)));
}
const same = (a: Result, b: Result) => a.openPana === b.openPana && a.closePana === b.closePana && a.jodi === b.jodi && a.status === b.status;

/** One source anchors a calendar date; the other must corroborate its numbers. */
export function reconcileMarket(market: Market, observations: SourceObservation[], existing: Result[], now = new Date()): Result[] {
  const config = MARKETS[market], date = todayIST(now), earliest = addDays(date, -2);
  if (observations.length !== 2 || observations.some((o, i) => o.source !== config.sources[i])) throw new Error('Both approved sources must be available in the correct market.');
  for (const observation of observations) {
    const hero = observation.hero;
    if (hero && !sourceRecord(hero.date ?? date, hero.open, hero.jodi, hero.close, now.toISOString())) throw new Error('Live source failed panna or jodi validation; saved records retained.');
  }
  const incoming: Result[] = [];
  for (const [index, observation] of observations.entries()) {
    const other = observations[1 - index];
    for (const candidate of observation.dated) {
      if (candidate.date < earliest || candidate.date > date) continue;
      const hero = other.hero;
      const corroborating = other.dated.filter((r) => r.date === candidate.date);
      // Conflicting dated records take precedence over an undated hero.
      const heroRecord = hero && (!hero.date || hero.date === candidate.date) ? sourceRecord(candidate.date, hero.open, hero.jodi, hero.close, now.toISOString()) : null;
      if (corroborating.length ? !corroborating.every((r) => same(r, candidate)) : !heroRecord || !same(candidate, heroRecord)) continue;
      incoming.push({ ...candidate, provenance: { dateBasis: 'dated-source-agreement', observedAt: now.toISOString(), sources: [...config.sources] } });
    }
  }
  const minute = minutesIST(now);
  const freshWindowObservations = observations.every((o) => {
    const observed = new Date(o.observedAt);
    return !Number.isNaN(observed.getTime()) && todayIST(observed) === date && minutesIST(observed) >= config.start && now.getTime() - observed.getTime() >= 0 && now.getTime() - observed.getTime() <= 120_000;
  });
  if (!incoming.some((r) => r.date === date) && freshWindowObservations && minute >= config.start && minute <= config.end) {
    const heroes = observations.map((o) => o.hero);
    if (heroes.every((h) => h && (!h.date || h.date === date))) {
      const [a, b] = heroes as HeroResult[];
      const first = sourceRecord(date, a.open, a.jodi, a.close, now.toISOString());
      const second = sourceRecord(date, b.open, b.jodi, b.close, now.toISOString());
      if (first && second && (first.openPana !== second.openPana || (first.closePana && second.closePana && first.closePana !== second.closePana))) throw new Error('Live sources disagree; saved records retained.');
      if (first && second && first.openPana === second.openPana && !(first.closePana && second.closePana && first.closePana !== second.closePana)) {
        const candidate = first.closePana && second.closePana ? first : sourceRecord(date, a.open, `${ank(a.open)}*`, '***', now.toISOString())!;
        const datedConflict = observations.flatMap((o) => o.dated).some((r) => r.date === date && (r.openPana !== candidate.openPana || (r.status === 'closed' && candidate.status === 'closed' && !same(r, candidate))));
        const baseline = mergePublished(existing, incoming, date);
        const prior = [...baseline].reverse().find((r) => r.date < date && r.status === 'closed' && r.openPana && r.closePana);
        const stale = !prior || (candidate.status === 'closed' ? same(candidate, { ...prior, date }) : candidate.openPana === prior.openPana);
        if (!stale && !datedConflict) incoming.push({ ...candidate, provenance: { dateBasis: 'owner-approved-publication-window', observedAt: now.toISOString(), sources: [...config.sources] } });
      }
    }
  }
  return mergePublished(existing, incoming, date);
}

async function sourceText(url: string, attempts = 2): Promise<string> {
  let failure: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'SrideviNightChart/1.0', 'Cache-Control': 'no-cache' }, cache: 'no-store', signal: AbortSignal.timeout(6000) });
      if (!response.ok) throw new Error(`${new URL(url).hostname}: HTTP ${response.status}`);
      const body = await response.text();
      if (body.length > 2_000_000) throw new Error('Unexpected source response size.');
      return body;
    } catch (error) { failure = error; }
  }
  throw failure;
}

export async function observeMarket(market: Market, now = new Date()): Promise<SourceObservation[]> {
  const observations = await Promise.all(MARKETS[market].sources.map(async (source) => {
    const body = await sourceText(source);
    const title = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '';
    if (!/sridevi/i.test(title) || (market === 'day' && /night|morning/i.test(title))) throw new Error('Source market identity could not be verified.');
    const hero = market === 'night' ? parseLiveHero(body, source) : parseDayHero(body, source);
    let dated = parseDatedPanels(body, now.toISOString());
    if (market === 'night' && new URL(source).hostname === 'khabar.bet') {
      // This is the same page's current-year AJAX panel, bound to its SRIDEVI NIGHT game ID.
      if (!/SRIDEVI\s+NIGHT/i.test(stripUnsafeHtml(body)) || !/id:\s*['"]731['"]/.test(body)) throw new Error('Night source identity changed.');
      const year = todayIST(now).slice(0, 4);
      try {
        const fragment = await sourceText(`https://khabar.bet/ajax/mumbai-panel-chart.php?id=731&freq=daily&years=${year}&accmin=2022&accmax=${year}`, 1);
        dated = [...dated, ...parseDatedPanels(fragment, now.toISOString())];
      } catch (error) {
        if (!hero) throw error;
        console.warn('Night dated panel unavailable; retaining validated live-hero checks.');
      }
    }
    if (!hero && !dated.length) throw new Error(`${new URL(source).hostname}: neither a live result nor dated panels could be read.`);
    return { source, hero, dated, observedAt: now.toISOString() };
  }));
  return compactObservations(observations, now);
}
