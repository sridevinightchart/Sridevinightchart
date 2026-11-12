import * as repo from './repo';
import { mergePublished } from './resultFeed';
import { agreedLiveResult, parseLiveHero, LIVE_WINDOW } from './liveSource';
import { minutesIST, todayIST } from './time';

export interface FetchResult { success: boolean; message: string; changed?: boolean; data?: { open: string; close: string; jodi: string }; }
export const APPROVED_RESULT_SOURCES = [
  'https://matka-tips.org/record-chart/sridevi-night-jodi',
  'https://khabar.bet/sridevi-night-matka-chart',
] as const;
export async function fetchAndSaveToday(dryRun = false): Promise<FetchResult> {
  const now = new Date(), date = todayIST(now), minute = minutesIST(now);
  if (minute < LIVE_WINDOW.start || minute > LIVE_WINDOW.end) return { success: true, changed: false, message: 'Outside 7:15–8:30 PM IST; retained last declared result.' };
  try {
    const heroes = await Promise.all(APPROVED_RESULT_SOURCES.map(async (url) => {
      const response = await fetch(url, { headers: { 'User-Agent': 'SrideviNightChart/1.0', 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(20_000), cache: 'no-store' });
      if (!response.ok) throw new Error(`${new URL(url).hostname}: HTTP ${response.status}. Existing records retained.`);
      return parseLiveHero(await response.text(), url);
    }));
    // Evaluate at completion too: a delayed request must not publish outside the window or across midnight.
    const checkedAt = new Date();
    if (todayIST(checkedAt) !== date) throw new Error('Calendar date changed during fetch; retry on the next scheduled run.');
    const existing = repo.getAll();
    const agreed = agreedLiveResult(heroes, existing, checkedAt);
    if (!agreed.record) return { success: true, changed: false, message: agreed.message };
    const merged = mergePublished(existing, [agreed.record], date);
    const changed = JSON.stringify(merged) !== JSON.stringify(existing);
    if (changed && !dryRun) repo.upsertMany(merged);
    return { success: true, changed, message: `${dryRun ? '[DRY RUN] ' : ''}${changed ? 'Validated new record.' : 'No record changes.'} ${agreed.message}` };
  } catch (error) {
    return { success: false, changed: false, message: error instanceof Error ? error.message : String(error) };
  }
}
