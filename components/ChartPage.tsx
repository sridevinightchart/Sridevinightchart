import Link from 'next/link';
import PageHead from './PageHead';
import ChartControls from './ChartControls';
import YearBlocks from './YearBlocks';
import { chartPageData } from '@/lib/chartPage';
import { ROUTES } from '@/lib/site';

export default function ChartPage({ type, intro }: { type: 'jodi' | 'panel'; intro: React.ReactNode }) {
  const { today, years, blocks, older, first, updated } = chartPageData();
  const label = type === 'jodi' ? 'Jodi' : 'Panel';
  const other = type === 'jodi' ? { href: ROUTES.panel, label: 'Panel chart' } : { href: ROUTES.jodi, label: 'Jodi chart' };
  const scope = `${type}-page`;
  return (
    <>
      <PageHead crumbs={[{ name: `${label} chart`, href: type === 'jodi' ? ROUTES.jodi : ROUTES.panel }]} title={`Sridevi Night ${label} Chart`} updated={updated}>
        {intro}
      </PageHead>

      <div className="mx-auto mt-6 flex max-w-site flex-wrap gap-2 px-4 text-sm">
        <Link href={ROUTES.today} className="rounded-full border border-line px-3.5 py-1.5 hover:border-muted">Today’s result</Link>
        <Link href={other.href} className="rounded-full border border-line px-3.5 py-1.5 hover:border-muted">{other.label}</Link>
      </div>

      <section id={scope} aria-label={`Sridevi Night ${label.toLowerCase()} chart records`} className="mx-auto mt-8 max-w-site px-4">
        <ChartControls scopeId={scope} years={years} minDate={first ?? undefined} maxDate={today} />
        {blocks.length ? (
          <YearBlocks type={type} blocks={blocks} today={today} olderYears={older} />
        ) : (
          <p className="card p-6 text-muted">No results have been added yet. Results appear here as soon as they are entered.</p>
        )}
      </section>
    </>
  );
}
