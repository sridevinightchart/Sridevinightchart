'use client';

import { useEffect, useState } from 'react';
import { JodiChart, PanelChart } from './Charts';
import { weekYear } from '@/lib/matka';
import { mondayOf } from '@/lib/time';
import type { ChartAsset, ChartBlock } from '@/lib/chartTypes';
import { loadChartAsset } from '@/lib/loadChartAsset';
import { useChartData } from './ChartDataProvider';

type Block = ChartBlock;

export default function ChartTabs({
  type,
  blocks: providedBlocks,
  assets: providedAssets,
  today,
  archiveYears = [],
  market = 'Sridevi Night',
  distinguishMissing = false,
}: {
  type: 'jodi' | 'panel';
  blocks?: Block[];  // sorted newest-year-first
  assets?: ChartAsset[];
  today: string;
  archiveYears?: number[];
  market?: string;
  distinguishMissing?: boolean;
}) {
  const context = useChartData();
  const blocks = providedBlocks ?? context?.blocks ?? [];
  const assets = providedAssets ?? context?.archives ?? [];
  const Chart = type === 'jodi' ? JodiChart : PanelChart;
  const years = [...new Set([...blocks.map((b) => b.year), ...assets.map((b) => b.year)])].sort((a, b) => b - a);
  const [active, setActive] = useState<number | 'all'>(years[0] ?? 'all');
  const [findMessage, setFindMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [loaded, setLoaded] = useState<Record<string, Block>>({});
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [archiveError, setArchiveError] = useState('');
  const [retry, setRetry] = useState(0);
  const availableBlocks = years.flatMap((year) => {
    const block = blocks.find((b) => b.year === year) ?? loaded[assets.find((a) => a.year === year)?.url ?? ''];
    return block ? [block] : [];
  });

  async function ensureYear(year: number): Promise<Block | undefined> {
    const initial = blocks.find((b) => b.year === year);
    if (initial) return initial;
    const asset = assets.find((a) => a.year === year);
    if (!asset) return undefined;
    const block = loaded[asset.url] ?? await loadChartAsset(asset);
    setLoaded((previous) => ({ ...previous, [asset.url]: block }));
    return block;
  }

  useEffect(() => {
    const required = assets.filter((asset) => (active === 'all' || active === asset.year) && !loaded[asset.url]);
    if (!required.length) { setLoadingArchive(false); return; }
    let cancelled = false;
    setLoadingArchive(true);
    setArchiveError('');
    Promise.all(required.map(async (asset) => ({ asset, block: await loadChartAsset(asset) })))
      .then((results) => {
        if (!cancelled) setLoaded((previous) => ({ ...previous, ...Object.fromEntries(results.map(({ asset, block }) => [asset.url, block])) }));
      })
      .catch(() => { if (!cancelled) setArchiveError('Could not load the earlier results. Please try again.'); })
      .finally(() => { if (!cancelled) setLoadingArchive(false); });
    return () => { cancelled = true; };
  }, [active, assets, blocks, retry]);

  async function findDate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const date = String(new FormData(event.currentTarget).get('date') ?? '');
    const year = weekYear(mondayOf(date));
    if (!years.includes(year) && archiveYears.includes(year)) {
      const archive = document.getElementById(`history-${year}`) as HTMLDetailsElement | null;
      if (archive) archive.open = true;
      const cell = document.getElementById(`h-${date}`);
      if (cell) { cell.scrollIntoView({ behavior: 'smooth', block: 'center' }); cell.classList.remove('is-flash'); void cell.offsetWidth; cell.classList.add('is-flash'); setFindMessage(''); return; }
    }
    let block: Block | undefined;
    try { block = await ensureYear(year); }
    catch { setFindMessage('Could not load that year. Please try again.'); return; }
    if (!block?.weeks.some((week) => week.days.some((day) => day.date === date))) {
      setFindMessage('No chart record is available for that date.');
      return;
    }
    setFindMessage('');
    setActive(years.includes(year) ? year : 'all');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const cell = document.getElementById(`${type === 'jodi' ? 'j' : 'p'}-${date}`);
      cell?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      cell?.classList.remove('is-flash');
      if (cell) { void cell.offsetWidth; cell.classList.add('is-flash'); }
    }));
  }

  useEffect(() => {
    const selectHash = (hash: string) => {
      const match = hash.match(new RegExp(`^#${type}-year-(\\d{4})$`));
      if (match && years.includes(Number(match[1]))) setActive(Number(match[1]));
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
  }, [blocks, assets, type]);

  function tabCls(on: boolean) {
    return [
      'disp rounded-sm px-3.5 py-1.5 text-[14px] font-bold border transition-colors',
      on
        ? 'bg-accent border-accent text-accent-ink'
        : 'border-line text-muted hover:border-fg/30 hover:text-fg',
    ].join(' ');
  }

  const activeBlock = active !== 'all' ? availableBlocks.find((b) => b.year === active) : null;

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
      <form onSubmit={findDate} className="mb-5 grid w-full max-w-md grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <label htmlFor={`${type}-find-date`} className="col-span-2 text-[13px] font-medium text-muted">Find a date</label>
        <div className="relative flex h-11 min-w-0 items-center justify-between gap-2 rounded-lg border border-line bg-bg px-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25">
          <span aria-hidden="true" className={`truncate text-[14px] ${selectedDate ? 'num text-fg' : 'text-muted'}`}>
            {selectedDate ? selectedDate.split('-').reverse().join('/') : 'Choose date'}
          </span>
          <svg aria-hidden="true" className="pointer-events-none h-[18px] w-[18px] shrink-0 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></svg>
          <input id={`${type}-find-date`} name="date" type="date" required max={today} value={selectedDate}
            onChange={(event) => { setSelectedDate(event.target.value); setFindMessage(''); }}
            onClick={(event) => { try { event.currentTarget.showPicker?.(); } catch { /* Native picker remains available. */ } }}
            onInvalid={() => setFindMessage('Choose a date to find its result.')}
            aria-describedby={findMessage ? `${type}-date-message` : undefined}
            className="absolute inset-0 h-full w-full min-w-0 cursor-pointer text-base opacity-0" />
        </div>
        <button type="submit" className="h-11 shrink-0 rounded-lg border border-accent bg-accent px-3 text-[14px] font-semibold text-accent-ink transition-colors hover:bg-accent/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-4">Find result</button>
        {findMessage && <p id={`${type}-date-message`} role="status" className="col-span-2 text-[13px] text-muted">{findMessage}</p>}
      </form>

      {loadingArchive && <p role="status" className="mb-4 text-sm text-muted">Loading earlier results...</p>}
      {archiveError && <p role="alert" className="mb-4 text-sm text-muted">{archiveError} <button type="button" className="font-semibold text-accent-text underline" onClick={() => setRetry((value) => value + 1)}>Retry</button></p>}
      {/* ── Single-year view ── */}
      {active !== 'all' && activeBlock && (
        <Chart
          weeks={activeBlock.weeks}
          today={today}
          distinguishMissing={distinguishMissing}
          caption={`${market} ${type} chart ${active}, week by week`}
        />
      )}

      {/* ── All-years view: stacked seamlessly, no headings ── */}
      {active === 'all' && (
        <div className="chart-seamless">
          {availableBlocks.map((block, i) => (
            <div
              key={block.year}
              /* lazy-load every year except the first (already in viewport) */
              className={i > 0 ? 'lazy-block' : undefined}
            >
              <Chart
                weeks={block.weeks}
                today={today}
                distinguishMissing={distinguishMissing}
                caption={`${market} ${type} chart ${block.year}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
