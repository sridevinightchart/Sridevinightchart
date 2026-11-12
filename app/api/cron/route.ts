/**
 * GET/POST /api/cron
 *
 * Called by an external scheduler (Windows Task Scheduler, Vercel Cron, cron-job.org, etc.)
 * Protected by CRON_SECRET so random requests can't trigger it.
 *
 * Usage:
 *   curl "http://localhost:3000/api/cron?secret=YOUR_SECRET"
 *
 * Vercel cron (vercel.json):
 *   { "crons": [{ "path": "/api/cron?secret=YOUR_SECRET", "schedule": "45 14 * * *" }] }
 *   (14:45 UTC = 20:15 IST — 15 min after Sridevi Night closes)
 */
import { NextRequest, NextResponse } from 'next/server';
import { fetchAndSaveToday } from '@/lib/auto-fetch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function ok(msg: string, data?: object) {
  return NextResponse.json({ ok: true, message: msg, ...data }, { status: 200 });
}
function err(msg: string, status = 400) {
  return NextResponse.json({ ok: false, message: msg }, { status });
}

async function handle(req: NextRequest) {
  if (process.env.VERCEL) return err('Results are published by the scheduled GitHub workflow; this deployment is read-only.', 409);
  const secret = process.env.CRON_SECRET;
  if (!secret) return err('CRON_SECRET not set in environment.', 500);

  const provided =
    req.nextUrl.searchParams.get('secret') ??
    req.headers.get('x-cron-secret') ??
    '';

  if (provided !== secret) return err('Unauthorized.', 401);

  const dry = req.nextUrl.searchParams.get('dry') === '1';
  const result = await fetchAndSaveToday(dry);

  return result.success
    ? ok(result.message, { changed: result.changed ?? false })
    : err(result.message, 502);
}

export { handle as GET, handle as POST };
