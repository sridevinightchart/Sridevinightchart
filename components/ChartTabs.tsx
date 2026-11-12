'use client';

import { useEffect, useState } from 'react';
import { JodiChart, PanelChart } from './Charts';
import type { Week } from '@/lib/matka';

interface Block { year: number; weeks: Week[] }

export default function ChartTabs({
  type,
  blocks,
  today,
  archiveYears = [],
}: {
  type: 'jodi' | 'panel';
  blocks: Block[];  // sorted newest-year-first
  today: string;
  archiveYears?: number[];
}) {
  const Chart = type === 'jodi' ? JodiChart : PanelChart;
  const years = blocks.map((b) => b.year);
  const [active, setActive] = useState<number | 'all'>(years[0] ?? 'all');
  const [findMessage, setFindMessage] = useState('');

  function findDate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const date = String(new FormData(event.currentTarget).get('date') ?? '');
    const year = Number(date.slice(0, 4));
    if (!years.includes(year) && archiveYears.includes(year)) {
      const archive = document.getElementById(`history-${year}`) as HTMLDetailsElement | null;
      if (archive) archive.open = true;
      const cell = document.getElementById(`h-${date}`);
      if (cell) { cell.scrollIntoView({ behavior: 'smooth', block: 'center' }); cell.classList.remove('is-flash'); void cell.offsetWidth; cell.classList.add('is-flash'); setFindMessage(''); return; }
    }
    if (!blocks.some((block) => block.weeks.some((week) => week.days.some((day) => day.date === date)))) {
      setFindMessage('No chart record is available for that date.');
      return;
    }
    setFindMessage('');
    setActive(years.includes(year) ? year : 'all');
    requestAnimationFrame(() => {
      const cell = document.getElementById(`${type === 'jodi' ? 'j' : 'p'}-${date}`);
      cell?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      cell?.classList.remove('is-flash');
      if (cell) { void cell.offsetWidth; cell.classList.add('is-flash'); }
    });
  }

  useEffect(() => {
    const selectHash = (hash: string) => {
      const match = hash.match(new RegExp(`^#${type}-year-(\\d{4})$`));
      if (match && blocks.some((b) => b.year === Number(match[1]))) setActive(Number(match[1]));
    };
    const openArchive = (hash: string) => {
      const match = hash.match(/^#history-(\d{4})$/);
      if (!match) return;
      const archive = document.getElementById(hash.slice(1)) as HTMLDetailsElement | null;
      if (archive) archive.open = true;
    };
    const onHash = () => { selectHash(window.location.hash); openArchive(window.location.hash); };
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element).closest('a');
      if (link) { const hash = new URL(link.href, window.location.href).hash; selectHash(hash); openArchive(hash); }
    };
    onHash();
    window.addEventListener('hashchange', onHash);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('hashchange', onHash);
      document.removeEventListener('click', onClick);
    };
  }, [blocks, type]);

  function tabCls(on: boolean) {
    return [
      'disp rounded-sm px-3.5 py-1.5 text-[14px] font-bold border transition-colors',
      on
        ? 'bg-accent border-accent text-accent-ink'
        : 'border-line text-muted hover:border-fg/30 hover:text-fg',
    ].join(' ');
  }

  const activeBlock = active !== 'all' ? blocks.find((b) => b.year === active) : null;

  return (
    <div>
      {/* ── Tab bar ── */}
      <nav
        className="mb-5 flex flex-wrap items-center gap-1.5"
        aria-label="Select year or all"
      >
        {years.map((y) => (
          <button
            key={y}
            id={`${type}-year-${y}`}
            type="button"
            onClick={() => setActive(y)}
            aria-pressed={active === y}
            className={tabCls(active === y)}
          >
            {y}
          </button>
        ))}
        {archiveYears.filter((year) => !years.includes(year)).map((year) => <a key={year} href={`/#history-${year}`} className={tabCls(false)}>{year}</a>)}

        <span aria-hidden="true" className="mx-1 select-none text-muted">|</span>

        <button
          type="button"
          onClick={() => setActive('all')}
          aria-pressed={active === 'all'}
          className={tabCls(active === 'all')}
        >
          All
        </button>
      </nav>
      <form onSubmit={findDate} className="mb-4 flex flex-wrap items-center gap-2">
        <label htmlFor={`${type}-find-date`} className="text-sm text-muted">Find a date</label>
        <input id={`${type}-find-date`} name="date" type="date" required max={today} className="num rounded border border-line bg-surface px-3 py-2 text-sm" />
        <button type="submit" className="rounded border border-line px-4 py-2 text-sm font-semibold hover:bg-bg2">Find result</button>
        {findMessage && <p role="status" className="w-full text-sm text-muted">{findMessage}</p>}
      </form>

      {/* ── Single-year view ── */}
      {active !== 'all' && activeBlock && (
        <Chart
          weeks={activeBlock.weeks}
          today={today}
          caption={`Sridevi Night ${type} chart ${active}, week by week`}
        />
      )}

      {/* ── All-years view: stacked seamlessly, no headings ── */}
      {active === 'all' && (
        <div className="chart-seamless">
          {blocks.map((block, i) => (
            <div
              key={block.year}
              /* lazy-load every year except the first (already in viewport) */
              className={i > 0 ? 'lazy-block' : undefined}
            >
              <Chart
                weeks={block.weeks}
                today={today}
                caption={`Sridevi Night ${type} chart ${block.year}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
