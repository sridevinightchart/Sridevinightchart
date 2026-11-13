import { unstable_cache } from 'next/cache';
import { observeMarket, reconcileMarket, type Market } from './marketSources';
import type { Result } from './matka';
import { todayIST } from './time';

// Shared server-side cache, not a database or a write to Vercel's filesystem.
// Including the IST date prevents yesterday's undated hero crossing midnight.
const observations = unstable_cache(async (market: Market, _date: string) => {
  return observeMarket(market);
}, ['verified-market-sources-v1'], { revalidate: 30 });

export async function currentMarketState(market: Market, saved: Result[]) {
  try {
    const now = new Date();
    const sources = await observations(market, todayIST(now));
    return { records: reconcileMarket(market, sources, saved, new Date()), sourceStatus: 'checked' as const, checkedAt: sources.map((s) => s.observedAt).sort()[0] };
  } catch (error) {
    console.error(`${market} live check failed; saved records retained:`, error instanceof Error ? error.message : 'Unknown error');
    return { records: saved, sourceStatus: 'unavailable' as const, checkedAt: new Date().toISOString() };
  }
}

export async function currentResults(market: Market, saved: Result[]): Promise<Result[]> {
  return (await currentMarketState(market, saved)).records;
}
