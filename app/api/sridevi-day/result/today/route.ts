import { LIVE_CACHE_HEADERS } from '@/lib/resultPolicy';
import { NextResponse } from 'next/server';
import { currentMarketState } from '@/lib/currentResults';
import { buildDayLive, dayResults } from '@/lib/day';
export const dynamic = 'force-dynamic';
export async function GET() {
  const state = await currentMarketState('day', dayResults());
  return NextResponse.json({ ...buildDayLive(new Date(), state.records), sourceStatus: state.sourceStatus, sourceCheckedAt: state.checkedAt }, { headers: LIVE_CACHE_HEADERS });
}

export const runtime = 'nodejs';
export const maxDuration = 30;
