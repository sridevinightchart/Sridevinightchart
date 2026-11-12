'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LivePayload } from '@/lib/live';
import { display, isDoubleJodi } from '@/lib/matka';
import { SITE } from '@/lib/site';
import { labelShort, minutesIST, timeLabelIST, todayIST, WEEKDAYS } from '@/lib/time';

function statusOf(data: LivePayload, nowMin: number): string {
  const s = data.today?.status;
  if (s === 'closed') return 'Result declared';
  if (s === 'open') return 'Open declared — waiting for close';
  if (s === 'holiday') return 'No result today';
  if (nowMin < SITE.openMinute) return 'Awaiting open result';
  return 'Waiting for result…';
}

export default function ResultCard({
  initial,
  initialMinutes,
  title = 'Sridevi Night result today',
}: {
  initial: LivePayload;
  initialMinutes: number;
  title?: string;
}) {
  const [data, setData] = useState(initial);
  const [nowMin, setNowMin] = useState(initialMinutes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const snapshot = useRef(`${initial.date}:${initial.version ?? ''}`);
  const lastPoll = useRef(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/result/today/', { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      const next = await res.json() as LivePayload;
      setData(next);
      const version = `${next.date}:${next.version ?? ''}`;
      if (snapshot.current !== version) {
        snapshot.current = version;
        router.refresh();
      }
    } catch {
      setError('Could not refresh. Check your connection and try again.');
    } finally {
      setLoading(false);
      setNowMin(minutesIST());
      lastPoll.current = Date.now();
    }
  }, [router]);

  useEffect(() => {
    if (todayIST() !== initial.date) refresh();
    setNowMin(minutesIST());
    const inWindow = () => {
      const m = minutesIST();
      return m >= SITE.pollStartMinute && m <= SITE.pollEndMinute;
    };
    const tick = () => {
      setNowMin(minutesIST());
      if (document.visibilityState === 'visible' && (inWindow() || Date.now() - lastPoll.current >= 120_000)) refresh();
    };
    const id = window.setInterval(tick, 30_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [initial.date, refresh]);

  const declared = data.today?.status === 'closed' || data.today?.status === 'open';
  const shown = declared ? data.today : (data.latest ?? (data.yesterday?.status === 'closed' ? data.yesterday : null));
  const previous = !!shown && shown.date !== data.date;
  const d = display(shown);
  const y = display(data.yesterday);
  const status = statusOf(data, nowMin);

  return (
    <figure className="flex flex-col gap-3.5" aria-live="polite">
      {/* Gold result card */}
      <div
        className="relative rounded-md p-3.5"
        style={{ background: 'rgb(var(--accent))', color: 'rgb(var(--accent-ink))' }}
      >
        {/* Corner dots */}
        <span aria-hidden="true" className="absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-full" style={{ background: 'rgb(var(--accent-ink) / 0.8)' }} />
        <span aria-hidden="true" className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full" style={{ background: 'rgb(var(--accent-ink) / 0.8)' }} />
        <span aria-hidden="true" className="absolute bottom-1.5 left-1.5 h-1.5 w-1.5 rounded-full" style={{ background: 'rgb(var(--accent-ink) / 0.8)' }} />
        <span aria-hidden="true" className="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full" style={{ background: 'rgb(var(--accent-ink) / 0.8)' }} />

        {/* Double-border inner box */}
        <div
          key={d.text}
          className="reveal rounded-sm px-5 py-5 sm:px-7 sm:py-6"
          style={{
            border: '2px solid rgb(var(--accent-ink))',
            outline: '1px solid rgb(var(--accent-ink))',
            outlineOffset: '-8px',
          }}
        >
          {/* Top: label + date */}
          <div className="flex items-center justify-between gap-3 text-[13px] font-semibold tracking-wide">
            <span>{previous ? 'Last declared result' : declared ? 'Latest result' : title}</span>
            <span className="num">{labelShort(shown?.date ?? data.date)}</span>
          </div>

          {/* Main: open pana | huge jodi | close pana */}
          <div className="flex items-center justify-center gap-5 py-1 sm:gap-6">
            {/* Open pana digits */}
            <span
              className="disp num flex flex-col items-center font-extrabold leading-none"
              style={{ fontSize: 'clamp(28px, 5vw, 44px)' }}
              aria-label={`Open: ${d.open}`}
            >
              {[...d.open].map((ch, i) => <span key={i}>{ch}</span>)}
            </span>

            {/* Jodi — the centrepiece */}
            <span
              className={`disp num font-black leading-none tracking-tight ${isDoubleJodi(d.jodi) ? 'is-double' : ''}`}
              style={{ fontSize: 'clamp(100px, 16vw, 210px)', lineHeight: 0.82 }}
              aria-label={`Jodi: ${d.jodi}`}
            >
              {d.jodi}
            </span>

            {/* Close pana digits */}
            <span
              className="disp num flex flex-col items-center font-extrabold leading-none"
              style={{ fontSize: 'clamp(28px, 5vw, 44px)' }}
              aria-label={`Close: ${d.close}`}
            >
              {[...d.close].map((ch, i) => <span key={i}>{ch}</span>)}
            </span>
          </div>

          {/* Bottom: open / jodi / close labels */}
          <div
            className="num flex justify-between pt-2.5 text-[13px] font-medium"
            style={{ borderTop: '1px solid rgb(var(--accent-ink) / 0.35)' }}
          >
            <span>Open {d.open}</span>
            <span>Jodi {d.jodi}</span>
            <span>Close {d.close}</span>
          </div>
        </div>
      </div>

      {/* Week strip */}
      <figcaption>
        <p className="mb-2 text-[13px]" style={{ color: 'rgb(var(--muted))' }}>
          Yesterday: <span className="num font-semibold" style={{ color: 'rgb(var(--text))' }}>{y.text}</span>
          {' · '}
          <span style={{ color: 'rgb(var(--accent-text))' }}>{status}</span>
        </p>
        <ol className="grid grid-cols-7 gap-1.5" aria-label="This week's jodi results">
          {data.week.map((w, i) => {
            const isToday = w.date === data.date;
            const future = w.date > data.date;
            const wd = display(w.result);
            const has = w.result?.status === 'closed' || w.result?.status === 'open';
            const color = future
              ? 'rgb(var(--text) / 0.3)'
              : has
              ? isDoubleJodi(wd.jodi)
                ? 'rgb(var(--highlight))'
                : 'rgb(var(--text))'
              : 'rgb(var(--text) / 0.35)';
            return (
              <li
                key={w.date}
                className="flex flex-col items-center rounded-sm py-2"
                style={{
                  border: `1px solid ${isToday ? 'rgb(var(--accent))' : 'rgb(var(--text) / 0.14)'}`,
                  background: isToday ? 'rgb(var(--accent) / 0.1)' : 'transparent',
                }}
              >
                <span className="text-[11px]" style={{ color: 'rgb(var(--muted))' }}>{WEEKDAYS[i]}</span>
                <span className="disp num font-extrabold leading-tight" style={{ fontSize: '24px', color }}>
                  {future ? '' : wd.jodi}
                </span>
              </li>
            );
          })}
        </ol>

        {/* Refresh + updated */}
        <div className="mt-2 flex items-center justify-between gap-3 text-[12px]" style={{ color: 'rgb(var(--muted))' }}>
          <span>
            {shown?.updatedAt
              ? <>Updated <span className="num">{timeLabelIST(shown.updatedAt)}</span></>
              : null}
          </span>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="rounded-sm px-2.5 py-0.5 text-[12px] font-medium disabled:opacity-50"
            style={{
              border: '1px solid rgb(var(--text) / 0.25)',
              color: 'rgb(var(--text))',
              background: 'transparent',
            }}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        {error && <p role="alert" className="mt-1 text-[12px]" style={{ color: 'rgb(var(--highlight))' }}>{error}</p>}
      </figcaption>
    </figure>
  );
}
