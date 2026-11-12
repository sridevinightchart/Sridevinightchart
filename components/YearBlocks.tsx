import Link from 'next/link';
import { JodiChart, PanelChart } from './Charts';
import type { Week } from '@/lib/matka';
import { ROUTES } from '@/lib/site';

interface Props {
  type: 'jodi' | 'panel';
  blocks: { year: number; weeks: Week[] }[];
  today: string;
  /** Older years that are not rendered here, linked instead */
  olderYears?: number[];
}

export default function YearBlocks({ type, blocks, today, olderYears = [] }: Props) {
  const Chart = type === 'jodi' ? JodiChart : PanelChart;
  const label = type === 'jodi' ? 'Jodi' : 'Panel';
  return (
    <div className="space-y-10">
      {blocks.map((b, i) => (
        <section key={b.year} data-year={b.year} aria-labelledby={`${type}-${b.year}`} className={i < blocks.length - 1 ? 'lazy-block' : ''}>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h3 id={`${type}-${b.year}`} className="text-lg font-semibold tracking-tight">
              Sridevi Night {label} Chart <span className="num">{b.year}</span>
            </h3>
            <Link href={ROUTES.year(b.year)} className="shrink-0 whitespace-nowrap text-[13px] text-muted hover:text-fg">
              {b.year} archive
            </Link>
          </div>
          <Chart weeks={b.weeks} today={today} caption={`Sridevi Night ${label.toLowerCase()} chart ${b.year}, week by week, Monday to Sunday`} />
        </section>
      ))}
      {olderYears.length > 0 && (
        <div className="card p-4 sm:p-5">
          <p className="text-sm font-semibold">Older {label.toLowerCase()} records</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {olderYears
              .slice()
              .reverse()
              .map((y) => (
                <li key={y}>
                  <Link href={ROUTES.year(y)} className="num inline-block rounded-full border border-line px-3.5 py-1.5 text-sm hover:border-muted">
                    {y}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
