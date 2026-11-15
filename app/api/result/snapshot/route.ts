import { NextResponse } from 'next/server';
import * as repo from '@/lib/repo';
import { dayLastUpdated } from '@/lib/day';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// No currentResults/unstable_cache calls: this verifies only committed history.
export function GET() {
  return NextResponse.json({ night: repo.lastUpdated(), day: dayLastUpdated() }, { headers: { 'Cache-Control': 'no-store' } });
}
