import { LIVE_CACHE_HEADERS } from '@/lib/resultPolicy';
import { NextResponse } from 'next/server';
import { currentMarketState } from '@/lib/currentResults';
import * as repo from '@/lib/repo';
import { buildLive } from '@/lib/live';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const state = await currentMarketState('night', repo.getAll());
  return NextResponse.json({ ...buildLive(new Date(), state.records), sourceStatus: state.sourceStatus, sourceCheckedAt: state.checkedAt }, { headers: LIVE_CACHE_HEADERS });
}

export const maxDuration = 30;
