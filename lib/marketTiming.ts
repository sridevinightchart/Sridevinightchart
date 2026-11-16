// All minutes are after midnight in India Standard Time.
function clock(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  return `${hour % 12 || 12}:${String(minutes % 60).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
}
function timing(openMinute: number, closeMinute: number, pollEndMinute: number) {
  return { openMinute, closeMinute, openTime: clock(openMinute), closeTime: clock(closeMinute),
    pollStartMinute: openMinute - 10, pollEndMinute };
}
export const MARKET_TIMINGS = {
  day: timing(11 * 60 + 35, 12 * 60 + 35, 15 * 60),
  night: timing(19 * 60 + 15, 20 * 60 + 15, 24 * 60 - 1),
} as const;
export type MarketTiming = typeof MARKET_TIMINGS.day;
