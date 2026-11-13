import { NextResponse } from 'next/server';
import { currentMarketState } from '@/lib/currentResults';
import { buildDayLive, dayResults } from '@/lib/day';
export const dynamic = 'force-dynamic';
export async function GET() {
  const state = await currentMarketState('day', dayResults());
  return NextResponse.json({ ...buildDayLive(new Date(), state.records), sourceStatus: state.sourceStatus, sourceCheckedAt: state.checkedAt }, { headers: { 'Cache-Control': 'no-store' } });
}

export const runtime = 'nodejs';
export const maxDuration = 30;
