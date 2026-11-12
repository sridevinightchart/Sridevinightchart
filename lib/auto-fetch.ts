import * as repo from './repo';
import { parseResultFeed, mergePublished } from './resultFeed';
import { addDays, todayIST } from './time';

export interface FetchResult { success: boolean; message: string; changed?: boolean; data?: { open: string; close: string; jodi: string }; }
export const APPROVED_RESULT_SOURCES = [
  'https://matka-tips.org/record-chart/sridevi-night-jodi',
  'https://khabar.bet/sridevi-night-matka-chart',
] as const;
export async function fetchAndSaveToday(dryRun = false): Promise<FetchResult> {
  const date = todayIST();
  // Only the two pages explicitly approved by the site owner. No silent fallback.
  const sources = [...APPROVED_RESULT_SOURCES];
  const incoming = [] as ReturnType<typeof parseResultFeed>;
  const errors: string[] = [];
  const responses = await Promise.allSettled(sources.map(async (url) => {
    const response = await fetch(url, { headers: { 'User-Agent': 'SrideviNightChart/1.0' }, signal: AbortSignal.timeout(20_000), cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const parsed = parseResultFeed(await response.text()).filter((r) => r.date >= addDays(date, -7) && r.date <= date);
    if (!parsed.length) throw new Error('No explicitly dated recent Sridevi Night record found; undated live numbers cannot be assigned to today');
    return parsed;
  }));
  responses.forEach((response, index) => {
    if (response.status === 'fulfilled') incoming.push(...response.value);
    else errors.push(`${new URL(sources[index]).hostname}: ${String(response.reason)}`);
  });
  if (!incoming.length) return { success: false, message: `No usable result feed. Existing records retained. ${errors.join('; ')}` };
  try {
    const existing = repo.getAll();
    const merged = mergePublished(existing, incoming, date);
    const changed = JSON.stringify(merged) !== JSON.stringify(existing);
    if (changed && !dryRun) repo.upsertMany(merged);
    const today = merged.find((r) => r.date === date);
    const status = today?.status === 'closed' ? 'Today’s close is available.' : today?.status === 'open' ? 'Today’s open is available; waiting for close.' : 'Today’s result is not published in the supported feeds yet.';
    return { success: true, changed, message: `${dryRun ? '[DRY RUN] ' : ''}${changed ? 'Validated new records.' : 'No record changes.'} ${status}${errors.length ? ' Some sources were unavailable.' : ''}` };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : String(error) };
  }
}
