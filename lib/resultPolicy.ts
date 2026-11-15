import type { LivePayload } from './live';

export const FAST_POLL_MS = 30_000;
export const IDLE_POLL_MS = 5 * 60_000;
export const COMPLETE_POLL_MS = 15 * 60_000;

/** Tick locally, but make network requests only when the result state requires it. */
export function pollDelay(data: LivePayload, date: string, minute: number, start: number, end: number): number {
  if (data.date !== date) return 0; // Wake immediately at the next IST day.
  if (data.today?.status === 'open') return FAST_POLL_MS; // Keep waiting for a delayed close.
  if (data.today?.status === 'closed' || data.today?.status === 'holiday') return COMPLETE_POLL_MS;
  if (data.yesterday?.status === 'open') return FAST_POLL_MS; // A close may arrive after midnight.
  return minute >= start && minute <= end ? FAST_POLL_MS : IDLE_POLL_MS;
}

// CDN caches the small public payload, not the multi-year source observation.
export const LIVE_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=0, must-revalidate',
  'Vercel-CDN-Cache-Control': 'max-age=10',
  'CDN-Cache-Control': 'no-store',
};
