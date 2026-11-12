'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/site';

interface Props {
  scopeId: string; // id of the element wrapping the chart(s)
  years: number[];
  minDate?: string;
  maxDate?: string;
  toggle?: boolean; // show the Jodi / Panel switch
  defaultView?: 'jodi' | 'panel';
}

function flash(el: Element) {
  el.classList.remove('is-flash');
  // restart the animation
  void (el as HTMLElement).offsetWidth;
  el.classList.add('is-flash');
  el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
}

export default function ChartControls({ scopeId, years, minDate, maxDate, toggle = false, defaultView = 'jodi' }: Props) {
  const router = useRouter();
  const [view, setView] = useState<'jodi' | 'panel'>(defaultView);
  const [msg, setMsg] = useState('');
  const dateRef = useRef<HTMLInputElement>(null);

  const scope = () => document.getElementById(scopeId);
  const visibleTables = () =>
    Array.from(scope()?.querySelectorAll<HTMLTableElement>('table.chart') ?? []).filter((t) => t.offsetParent !== null);

  // Highlight a cell linked from another page, e.g. /sridevi-night-chart/2026/#j-2026-03-04
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!/^[jp]-\d{4}-\d{2}-\d{2}$/.test(id)) return;
    if (toggle) setView(id.startsWith('p-') ? 'panel' : 'jodi');
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) flash(el);
    });
  }, [toggle]);

  useEffect(() => {
    const el = scope();
    if (el && toggle) el.dataset.view = view;
  }, [view, toggle]); // eslint-disable-line react-hooks/exhaustive-deps

  function jumpRow(which: 'first' | 'last') {
    const t = visibleTables();
    const table = which === 'first' ? t[0] : t[t.length - 1];
    const rows = table?.querySelectorAll('tbody tr');
    const row = rows && (which === 'first' ? rows[0] : rows[rows.length - 1]);
    row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function jumpYear(y: string) {
    if (!y) return;
    const block = scope()?.querySelector(`[data-year="${y}"]`);
    if (block) block.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else router.push(ROUTES.year(y));
  }

  function findDate(e: React.FormEvent) {
    e.preventDefault();
    const date = dateRef.current?.value;
    if (!date) return;
    setMsg('');
    for (const t of visibleTables()) {
      const cell = t.querySelector(`[data-date="${date}"]`);
      if (cell) return flash(cell);
    }
    const year = Number(date.slice(0, 4));
    if (years.includes(year)) {
      const prefix = view === 'panel' && toggle ? 'p' : 'j';
      router.push(`${ROUTES.year(year)}#${prefix}-${date}`);
    } else {
      setMsg('No result is recorded for that date.');
    }
  }

  const btn = 'rounded-full border border-line px-3 py-1.5 text-[13px] font-medium text-fg/80 hover:text-fg hover:border-muted';

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {toggle && (
        <div role="group" aria-label="Chart type" className="flex rounded-full border border-line bg-surface p-0.5">
          {(['jodi', 'panel'] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`rounded-full px-3.5 py-1 text-[13px] font-semibold ${
                view === v ? 'bg-accent text-accent-ink' : 'text-muted hover:text-fg'
              }`}
            >
              {v === 'jodi' ? 'Jodi' : 'Panel'}
            </button>
          ))}
        </div>
      )}

      {years.length > 1 && (
        <label className="flex items-center">
          <span className="sr-only">Jump to year</span>
          <select
            defaultValue=""
            onChange={(e) => jumpYear(e.target.value)}
            className={`${btn} num bg-surface pr-2`}
          >
            <option value="" disabled>Jump to year</option>
            {years.slice().reverse().map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
      )}

      <button type="button" className={btn} onClick={() => jumpRow('last')}>Go to latest</button>
      <button type="button" className={btn} onClick={() => jumpRow('first')}>Go to oldest</button>

      <form onSubmit={findDate} className="flex items-center gap-1.5 sm:ml-auto">
        <label htmlFor={`${scopeId}-date`} className="sr-only">Find a date</label>
        <input
          ref={dateRef}
          id={`${scopeId}-date`}
          type="date"
          min={minDate}
          max={maxDate}
          className="num h-[34px] rounded-full border border-line bg-surface px-3 text-[13px]"
        />
        <button type="submit" className={btn}>Find</button>
      </form>
      {msg && <p role="status" className="w-full text-[13px] text-muted">{msg}</p>}
    </div>
  );
}
