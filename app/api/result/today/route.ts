import { NextResponse } from 'next/server';
import { buildLive } from '@/lib/live';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET() {
  return NextResponse.json(buildLive(), { headers: { 'Cache-Control': 'no-store' } });
}
