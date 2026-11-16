import type { LivePayload } from './live';
import { MARKET_TIMINGS, type MarketTiming } from './marketTiming';

export function resultStatus(data: LivePayload, date: string, minute: number, timing: MarketTiming = MARKET_TIMINGS.night): string {
  const status = data.date === date && data.today?.date === date ? data.today.status : undefined;
  if (status === 'closed') return 'Result declared';
  if (status === 'holiday') return 'No result today';
  if (status === 'open') return minute < timing.closeMinute
    ? `Open is out · close at ${timing.closeTime} IST`
    : 'Open is out · waiting for close';
  if (minute < timing.openMinute) return `Today's result opens at ${timing.openTime} IST`;
  return "Waiting for today's open result";
}
