import { NextResponse } from 'next/server';
import { buildDayLive } from '@/lib/day';
export const dynamic = 'force-dynamic';
export function GET() {
  return NextResponse.json(buildDayLive(), { headers: { 'Cache-Control': 'no-store' } });
}
