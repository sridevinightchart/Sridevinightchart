import ChartDataProvider from '@/components/ChartDataProvider';
import { chartDelivery } from '@/lib/chartAssets';
﻿import Link from 'next/link';
import Image from 'next/image';
import chartComparison from '../sridevi-panel-chart-vs-jodi-chart.webp';
import chartHistory from '../sridevi-day-chart-history.webp';
import { currentResults } from '@/lib/currentResults';
import ResultCard from '@/components/ResultCard';
import ChartTabs from '@/components/ChartTabs';
import Faq, { type QA } from '@/components/Faq';
import JsonLd from '@/components/JsonLd';
import { buildDayLive, dayBlocks, dayResults, DAY_MODIFIED } from '@/lib/day';
import { dayMetadata, DAY_TITLE, DAY_DESCRIPTION } from '@/lib/daySeo';
import { abs } from '@/lib/site';
import { minutesIST, todayIST } from '@/lib/time';
import { MARKET_TIMINGS } from '@/lib/marketTiming';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const metadata = dayMetadata;
const faq: QA[] = [
  { q: 'Is the Sridevi chart the same as the Sridevi Day chart?', a: 'Yes. Sridevi and Sridevi Day are two names for the same day market. Sridevi Night is a different market, and it has its own chart.' },
  { q: 'What time does the Sridevi open and close come?', a: `The open comes at ${MARKET_TIMINGS.day.openTime} IST and the close at ${MARKET_TIMINGS.day.closeTime} IST. You'll see both here shortly after they're declared.` },
  { q: 'Are patti, pana and panel three different things?', a: "None. All three words mean the three-digit number. A day's result has two: one from the open and one from the close." },
  { q: 'Is there a Sridevi result on Sundays?', a: 'Yes. A result comes every day of the week, and Sunday is no exception. The market takes just three days off in a year: Republic Day (26 January), Holi and Independence Day (15 August). Look for stars on those dates.' },
  { q: 'Is there a Sridevi old chart from 1996 or 2000?', a: 'We looked and couldn’t find one we could trust. The oldest Sridevi result we can prove is from 5 March 2018, so that’s where our chart begins. Anything older would be a guess, and we don’t put guesses in the record.' },
  { q: 'Can the Sridevi chart tell tomorrow’s result?', a: "No. Yesterday's number has no say in today's. This page keeps the record only, with no tips and no guessing." },
];
function Section({ id, title, wide = false, children }: { id: string; title: string; wide?: boolean; children: React.ReactNode }) {
  return <section id={id} aria-labelledby={`${id}-h`} className={`mx-auto mt-14 px-6 sm:mt-16 ${wide ? 'max-w-site' : 'reading-section max-w-[880px]'}`}>
    <h2 id={`${id}-h`} className="disp text-[34px] sm:text-[42px] font-extrabold leading-tight">{title}</h2>
    {children}
  </section>;
}
export default async function SrideviDayPage() {
  const records = await currentResults('day', dayResults());
  const today = todayIST();
  const blocks = dayBlocks(today, records);
  const url = abs('/sridevi-chart/');
  const pageUpdated = [DAY_MODIFIED, ...dayResults().map((r) => r.updatedAt)].sort().at(-1)!;
  const chartPlan = chartDelivery('day', blocks, today);
  return <ChartDataProvider initialBlocks={chartPlan.initialBlocks} archives={chartPlan.archives}>
    <JsonLd data={{ '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: DAY_TITLE, description: DAY_DESCRIPTION, inLanguage: 'en-IN', isPartOf: { '@id': abs('/#website') }, dateModified: pageUpdated, mainEntity: { '@id': `${url}#article` } },
      { '@type': 'Article', '@id': `${url}#article`, headline: 'Sridevi Chart', description: DAY_DESCRIPTION, inLanguage: 'en-IN', mainEntityOfPage: { '@id': `${url}#webpage` }, image: abs('/sridevi-day-opengraph.png'), dateModified: pageUpdated, about: { '@type': 'Thing', name: 'Sridevi Day results, panel chart and jodi chart' }, hasPart: ['Sridevi Day Result Today', 'Sridevi Panel Chart', 'Sridevi Jodi Chart', 'History of Sridevi Day Chart', 'Sridevi Chart FAQs'].map((name) => ({ '@type': 'WebPageElement', name })) },
    ] }} />
    <div className="mx-auto max-w-site px-6 pt-7 sm:pt-12 lg:pt-16">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 lg:items-start">
        <div>
          <h1 className="disp font-black tracking-tight" style={{ fontSize: 'clamp(56px, 6.5vw, 96px)', lineHeight: .92 }}>Sridevi Chart</h1>
          <p className="mt-6 text-[18px] leading-relaxed text-soft">No more opening one page for the jodi and another for the patti. This Sridevi chart keeps today’s Sridevi Day result, the full panel chart and the jodi chart together, with a date on every week from 2018 to today.</p>
        </div>
        <section id="result-today" aria-labelledby="result-today-h">
          <h2 id="result-today-h" className="disp text-[32px] font-extrabold leading-tight mb-4">Sridevi Day Result Today</h2>
          <ResultCard initial={buildDayLive(new Date(), records)} initialMinutes={minutesIST()} title="Sridevi Day result today" endpoint="/api/sridevi-day/result/today/" market="day" />
        </section>
      </div>
    </div>
    <Section id="panel-chart" title="Sridevi Panel Chart" wide>
      <div className="prose-site mt-4 mb-5 text-[16px]">
        <p>The Sridevi panel chart shows the full result for every day: the open patti on the left, the jodi in the middle and the close patti on the right. Patti, pana and panel all mean the same three digits, so this is also the Sridevi chart with patti.</p>
        <p>Each row is one week, Monday to Sunday, with its dates on the left. Tap a year to open that year’s Sridevi day panel chart.</p>
      </div>
      <ChartTabs type="panel" today={today} market="Sridevi Day" distinguishMissing />
      <p className="mt-4 text-[14px] leading-7 text-muted">A red jodi has two same digits, like 99. Stars mean no result came that day. A dash (—) means the historical entry is awaiting verification.</p>
    </Section>
    <Section id="jodi-chart" title="Sridevi Jodi Chart" wide>
      <div className="prose-site mt-4 mb-5 text-[16px]">
        <p>In the Sridevi jodi chart, each day has one box with just two digits: that day’s jodi. The first digit comes from the open patti and the second from the close patti.</p>
        <p>With the pattis left out, many more weeks fit on one screen. Use this chart to look across weeks fast, and the panel chart when you need the pattis too.</p>
      </div>
      <ChartTabs type="jodi" today={today} market="Sridevi Day" distinguishMissing />
      <Image src={chartComparison} alt="Sridevi panel chart and Sridevi jodi chart" sizes="(max-width: 880px) calc(100vw - 48px), 832px" className="mx-auto mt-8 h-auto w-full max-w-[832px] rounded-lg" />
    </Section>
    <Section id="history" title="History of Sridevi Day Chart">
      <div className="prose-site mt-4 text-[16px]">
        <p>Sridevi is a Satta Matka market that runs more than once a day. This page is the day market, which most people call Sridevi or Sridevi Day. Sridevi Morning and Sridevi <Link href="/">Night</Link> are separate markets with their own results, and a result from one never appears in the other’s chart.</p>
        <p>Our Sridevi matka chart starts on Monday, 5 March 2018. From that day to today, it holds more than 3,000 results. The longest break came in 2020: from 12 October to 22 November, six weeks in a row, no result was declared. Apart from that, the market closes three times a year, on Republic Day (26 January), Holi and Independence Day (15 August). On the days the market stays closed, the chart shows stars. We never fill a closed day with a number.</p>
        <Image src={chartHistory} alt="History of the Sridevi Day chart" sizes="(max-width: 880px) calc(100vw - 48px), 832px" className="my-8 h-auto w-full rounded-lg" />
        <p>Every result is checked before it goes on the chart. The three digits of each patti must be in order, the jodi must match both pattis, and the result must be the same on more than one source. If you find a wrong number, send us the date from the <Link href="/contact/">Contact</Link> page and we will check it the same day.</p>
      </div>
    </Section>
    <Section id="faq" title="Sridevi Chart FAQs">
      <div className="mt-5 mb-16"><Faq items={faq} pagePath="/sridevi-chart/" /></div>
    </Section>
  </ChartDataProvider>;
}
