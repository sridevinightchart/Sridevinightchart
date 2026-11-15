import ChartDataProvider from '@/components/ChartDataProvider';
import { chartDelivery } from '@/lib/chartAssets';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import resultExplanation from './sridevi-night-result-open-panna-jodi-close-panna.webp';
import chartReading from './sridevi-night-jodi-chart-how-to-read.webp';
import { currentResults } from '@/lib/currentResults';
import ResultCard from '@/components/ResultCard';
import { EDITORIAL_MODIFIED } from '@/lib/pages';
import ChartTabs from '@/components/ChartTabs';
import Faq, { type QA } from '@/components/Faq';
import JsonLd from '@/components/JsonLd';
import { buildLive } from '@/lib/live';
import { weeksForYear } from '@/lib/chartData';
import * as repo from '@/lib/repo';
import { ROUTES, SITE } from '@/lib/site';
import { minutesIST, parseDay, todayIST } from '@/lib/time';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export const metadata: Metadata = {
  other: { 'google-adsense-account': 'ca-pub-5366170232839580' },
  title: "Sridevi Night Chart: Today's Result, Jodi & Panel Chart",
  description:
    "Check the Sridevi Night matka chart for today's result, with the jodi chart and panel chart from 2019 to tonight.",
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    title: "Sridevi Night Chart: Today's Result, Jodi & Panel Chart",
    siteName: SITE.name,
    locale: 'en_IN',
    description: "Check the Sridevi Night matka chart for today's result, with the jodi chart and panel chart from 2019 to tonight.",
  },
  twitter: {
    card: 'summary_large_image',
    title: "Sridevi Night Chart: Today's Result, Jodi & Panel Chart",
    description: "Check the Sridevi Night matka chart for today's result, with the jodi chart and panel chart from 2019 to tonight.",
    images: ['/opengraph-image.png'],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
};

/* ─── small helpers ───────────────────────────────── */
function Prose({ children }: { children: React.ReactNode }) {
  return <div className="prose-site mt-4 text-[16px]">{children}</div>;
}
function H3({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h3 id={id} className="disp text-[26px] font-extrabold leading-tight mt-10 mb-3">
      {children}
    </h3>
  );
}
function ArticleTable({ head, rows }: { head: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto mt-4 mb-2">
      <table className="w-full text-left text-[15px]" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid rgb(var(--text) / 0.18)' }}>
            {head.map((h) => (
              <th key={h} className="py-2.5 pr-8 text-[13px] font-semibold" style={{ color: 'rgb(var(--muted))' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgb(var(--text) / 0.08)' }}>
              {row.map((cell, j) => (
                <td key={j} className="py-2.5 pr-8">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Sec({ id, title, children }: { id: string; title: React.ReactNode; children: React.ReactNode }) {
  const wide = id === 'jodi-chart' || id === 'panel-chart';
  return (
    <section id={id} aria-labelledby={`${id}-h`} className={`mx-auto mt-14 px-6 sm:mt-16 ${wide ? 'max-w-site' : 'reading-section max-w-[880px]'}`}>
      <h2 id={`${id}-h`} className="disp text-[34px] sm:text-[42px] font-extrabold leading-tight">{title}</h2>
      {children}
    </section>
  );
}

/* ─── page ────────────────────────────────────────── */
export default async function HomePage() {
  const records = await currentResults('night', repo.getAll());
  const today = todayIST();
  const live = buildLive(new Date(), records);
  const years = repo.years();
  const first = repo.firstDate();
  const yearNums = Array.from(new Set([...years.map((y) => y.year), Number(today.slice(0, 4))]));
  // All years' data grouped — newest first so the most recent chart is at the top
  const allBlocks = yearNums
    .slice()
    .reverse()
    .map((year) => ({ year, weeks: weeksForYear(year, today, records) }))
    .filter((b) => b.weeks.length > 0);
  const pageUpdated = [repo.lastUpdated() ?? '', EDITORIAL_MODIFIED].sort().at(-1)!;
  const totalResults = years.reduce((sum, y) => sum + y.results, 0);
  const firstDateFormatted = first
    ? parseDay(first).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const faqItems: QA[] = [
    {
      q: 'When does the Sridevi Night result come out?',
      a: `The open comes at ${SITE.openTime} IST and the close at ${SITE.closeTime} IST. This page adds each one within minutes and refreshes by itself while you wait.`,
    },
    {
      q: 'Does Sridevi Night run on Sundays and holidays?',
      a: 'Yes, it runs all seven days, Sunday included. It closes on Republic Day (26 January), Holi and Independence Day (15 August), and those nights show stars in the chart.',
    },
    {
      q: 'How do I find the result for an old date?',
      a: 'Tap the year in the year bar, find the row with that week\'s dates, then move across to the day. You can also type the date into the date search above the charts.',
    },
    {
      q: "Is tonight's result added to the chart straight away?",
      a: "Today's result is the card at the top of the page, which changes during the evening as the open and close come out. The chart is the full record of every night before it. Once tonight's close is declared, it's added to the chart too.",
    },
    {
      q: "Can old results predict tonight's result?",
      a: "No. Every Sridevi Night result is separate from the ones before it. We keep the record and nothing more: no tips, no guesses, no \"fix\" numbers.",
    },
  ];

  const chartPlan = chartDelivery('night', allBlocks, today);
  return (
    <ChartDataProvider initialBlocks={chartPlan.initialBlocks} archives={chartPlan.archives}>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebPage', '@id': `${SITE.url}/#webpage`, url: `${SITE.url}/`,
            name: 'Sridevi Night Chart', inLanguage: 'en-IN',
            description: metadata.description,
            isPartOf: { '@id': `${SITE.url}/#website` },
            about: { '@type': 'Thing', name: 'Sridevi Night results and historical charts' },
            dateModified: pageUpdated,
            mainEntity: { '@id': `${SITE.url}/#article` },
            hasPart: { '@id': `${SITE.url}/#faq` },
          },
          {
            '@type': 'Article', '@id': `${SITE.url}/#article`,
            headline: 'Sridevi Night Chart', inLanguage: 'en-IN',
            mainEntityOfPage: { '@id': `${SITE.url}/#webpage` },
            image: `${SITE.url}/opengraph-image.png`,
            dateModified: pageUpdated,
            articleSection: ['Sridevi Night Result Today', 'Sridevi Night Jodi Chart', 'Sridevi Night Panel Chart', 'What is sridevi night chart?', 'How to Read the Sridevi Night Matka Chart', 'Sridevi Night Old Chart and Record', 'How We Collect and Check Every Result', 'Sridevi Night Chart FAQs'],
          },
        ],
      }} />
      {/* ══ HERO: H1 left · Result Today right ══════ */}
      <div className="mx-auto max-w-site px-6 pt-7 sm:pt-12 lg:pt-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 lg:items-start">
          {/* Left: H1 + description */}
          <div>
            <h1
              className="disp font-black leading-none tracking-tight"
              style={{ fontSize: 'clamp(56px, 6.5vw, 96px)', lineHeight: 0.92 }}
            >
              Sridevi Night Chart
            </h1>
            <p className="mt-6 text-[18px] leading-relaxed" style={{ color: 'rgb(var(--soft))' }}>
              Check the Sridevi Night chart for tonight&apos;s result and every past night&apos;s
              matka result. Follow the open and close as results are published.
            </p>
          </div>

          {/* Right: Result Today */}
          <div id="result-today">
            <h2
              id="result-today-h"
              className="disp text-[32px] font-extrabold leading-tight mb-4"
            >
              Sridevi Night Result Today
            </h2>
            <ResultCard initial={live} initialMinutes={minutesIST()} />
          </div>
        </div>
      </div>

      {/* ══ H2: Jodi Chart — ALL years ═══════════════ */}
      <Sec id="jodi-chart" title="Sridevi Night Jodi Chart">
        <Prose>
          <p>
            View the Sridevi Night jodi chart with every result from 2019 to tonight, week by week.
          </p>
        </Prose>
        <div className="mt-5">
          {allBlocks.length > 0 ? (
            <ChartTabs type="jodi" today={today} />
          ) : (
            <p className="card p-5 text-muted text-sm">
              No results yet — add data via the admin panel or CSV import.
            </p>
          )}
        </div>
      </Sec>

      {/* ══ H2: Panel Chart — ALL years ══════════════ */}
      <Sec id="panel-chart" title="Sridevi Night Panel Chart">
        <Prose>
          <p>
            Track every night&apos;s full result, open panna, jodi and close panna, in the Sridevi Night panel chart from 2019 to tonight.
          </p>
        </Prose>
        <div className="mt-5">
          {allBlocks.length > 0 ? (
            <ChartTabs type="panel" today={today} />
          ) : (
            <p className="card p-5 text-muted text-sm">
              No results yet — add data via the admin panel or CSV import.
            </p>
          )}
        </div>
      </Sec>

      {/* ══ H2: What is ... ══════════════════════════ */}
      <Sec id="what-is" title="What is sridevi night chart?">
        <Prose>
          <p>
            The <Link href="/" className="text-accent-text underline underline-offset-4">sridevi night chart</Link> is the record of every result declared in the Sridevi Night satta
            matka market, laid out week by week. Each night has one result with three parts: the open
            panna, the jodi, and the close panna.
          </p>
          <p>
            There are two Sridevi markets, <Link href="/sridevi-chart/">day</Link> and night, and their results are never the same. This
            chart covers only the night market, so a day result never ends up in it.
          </p>
          <p>
            In both, each row is one week from Monday to Sunday, with the
            dates on the left. To find a date, go to that week&apos;s row and across to the day. To
            follow one weekday, say every Friday, read down its column.
          </p>
        </Prose>
      </Sec>

      {/* ══ H2: How to Read ══════════════════════════ */}
      <Sec id="how-to-read" title="How to Read the Sridevi Night Matka Chart">
        <Prose>
          <p>
            Every box in this chart is built from just three numbers. Learn these three words and the
            whole chart opens up:
          </p>
        </Prose>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-[16px] font-semibold marker:text-accent-text" style={{ color: 'rgb(var(--text))' }}>
          <li>Open panna</li>
          <li>Jodi</li>
          <li>Close panna</li>
        </ul>

        <Prose><p>Below, each one is explained with a real result, so you can see exactly where it sits in a box.</p></Prose>

        <H3 id="open-close-jodi">Open Panna, Jodi and Close Panna</H3>
        <Prose>
          <p>
            Every Sridevi Night result has a total of three parts, written like{' '}
            <strong className="num">238-33-490</strong>.
          </p>
        </Prose>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-[15px] leading-relaxed marker:text-accent-text" style={{ color: 'rgb(var(--soft))' }}>
          <li><strong style={{ color: 'rgb(var(--text))' }}>Open panna (238):</strong> the first three digits of the result.</li>
          <li><strong style={{ color: 'rgb(var(--text))' }}>Close panna (490):</strong> the last three digits of the result.</li>
          <li><strong style={{ color: 'rgb(var(--text))' }}>Jodi (33):</strong> the two digits in the middle. It isn&apos;t drawn on its own; it comes from the two pannas.</li>
        </ul>
        <p className="mt-3 text-[15px]" style={{ color: 'rgb(var(--muted))' }}>
          Some platforms use panna as &quot;pana&quot; or &quot;patti&quot;. It means the same thing.
        </p>

        <H3 id="how-jodi-works">How the Jodi Comes from the Two Pannas</H3>
        <Prose>
          <p>The jodi takes one digit from each panna:</p>
        </Prose>
        <ol className="mt-3 list-decimal space-y-2 pl-6 text-[15px] leading-relaxed marker:font-semibold" style={{ color: 'rgb(var(--soft))' }}>
          <li>Add the open panna&apos;s digits: 2 + 3 + 8 = 13.</li>
          <li>Keep the last digit only: <strong style={{ color: 'rgb(var(--text))' }}>3</strong>.</li>
          <li>Do the same for the close panna: 4 + 9 + 0 = 13, so again <strong style={{ color: 'rgb(var(--text))' }}>3</strong>.</li>
          <li>Now write the open digit first and the close digit next to it, and you get <strong className="num" style={{ color: 'rgb(var(--text))' }}>33</strong>.</li>
        </ol>

        <Image
          src={resultExplanation}
          alt="Sridevi Night result showing how open panna 238 and close panna 490 produce jodi 33"
          sizes="(max-width: 880px) calc(100vw - 48px), 832px"
          className="my-7 h-auto w-full rounded-xl border border-line"
        />

        <Prose>
          <p>
            That&apos;s why, before the close comes out, a result shows as{' '}
            <span className="num font-medium">238-3*-***</span>. The first jodi digit is already
            known, and the second is still waiting.
          </p>
        </Prose>

        <H3 id="reading-by-week">Reading by Week and by Weekday</H3>
        <Prose>
          <p>
            Read a row from left to right to see one whole week, Monday to Sunday. Pick a day at the
            top, like Fri, and run your eye straight down. Each box you pass is the same weekday, one
            week earlier. For example, keep your eye on the Fri column and move down eight rows, and
            you&apos;ll see the last eight Friday results.
          </p>
        </Prose>

        <Image
          src={chartReading}
          alt="How to read the Sridevi Night jodi chart"
          sizes="(max-width: 880px) calc(100vw - 48px), 832px"
          className="my-7 h-auto w-full rounded-xl border border-line"
        />

        <H3 id="colours-stars">What the Colours, Stars and Circles Mean</H3>
        <ArticleTable
          head={['You see', 'It means']}
          rows={[
            ['Red jodi', 'Both digits are the same, like 11 or 77'],
            ['Circled box', 'Tonight'],
            ['Shaded row', 'The current week'],
            ['** or ***', 'No value is available; a missing panna may appear beside a recorded jodi'],
            ['238-3*-***', 'Open is out, close is still to come'],
            ['Empty box', "A night that hasn't come yet"],
          ]}
        />

        <H3 id="leading-zeros">Why Leading Zeros Matter</H3>
        <Prose>
          <p>
            Jodis from 00 to 09 always keep their zero. A jodi of 03 means the open digit was 0 and
            the close digit was 3. It isn&apos;t the number 3. Pannas can hold zeros too, like 120 or
            550. When you note down or compare a result, copy every zero exactly as shown.
          </p>
        </Prose>
      </Sec>

      {/* ══ H2: Old Chart / Record ════════════════════ */}
      <Sec id="old-chart" title="Sridevi Night Old Chart and Record">
        <Prose>
          <p>
            This page holds every Sridevi Night result we have on record:{' '}
            <strong>{totalResults.toLocaleString()} nights</strong>
            {firstDateFormatted ? `, from ${firstDateFormatted} up to last night` : ' up to last night'}.
            The archive has a six-week gap from 12 October to 22 November 2020.
            Missing values are shown as stars. A gap in our records does not independently confirm
            that the market was closed; some historical records contain only a jodi.
          </p>
        </Prose>

        {/* Year archive */}
        {years.length > 0 && (
          <ul className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {years
              .slice()
              .reverse()
              .map((y, i) => (
                <li key={y.year}>
                  <Link
                    href={ROUTES.year(y.year)}
                    className="disp num block text-center rounded-sm py-4 text-[36px] font-extrabold"
                    style={{
                      textDecoration: 'none',
                      ...(i === 0
                        ? { background: 'rgb(var(--accent))', color: 'rgb(var(--accent-ink))' }
                        : { border: '1px solid rgb(var(--text) / 0.18)', color: 'rgb(var(--text))' }),
                    }}
                  >
                    {y.year}
                  </Link>
                  <p className="text-center text-[12px] mt-1" style={{ color: 'rgb(var(--muted))' }}>
                    {y.results} results
                  </p>
                </li>
              ))}
          </ul>
        )}
      </Sec>

      {/* ══ H2: How We Collect ═══════════════════════ */}
      <Sec id="how-we-collect" title="How We Collect and Check Every Result">
        <Prose>
          <p>Each result goes through three checks before it reaches the chart:</p>
        </Prose>
        <ol className="mt-4 space-y-3 text-[15px]" style={{ color: 'rgb(var(--soft))' }}>
          <li className="flex gap-3">
            <span className="disp font-black text-[20px] shrink-0 w-7 leading-none mt-0.5" style={{ color: 'rgb(var(--accent))' }}>1</span>
            <span>
              <strong style={{ color: 'rgb(var(--text))' }}>Published sources.</strong> Records are imported from published archives or entered from a published result. Numerical checks do not independently establish authenticity.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="disp font-black text-[20px] shrink-0 w-7 leading-none mt-0.5" style={{ color: 'rgb(var(--accent))' }}>2</span>
            <span>
              <strong style={{ color: 'rgb(var(--text))' }}>A valid panna.</strong> Each panna&apos;s
              three digits must go up in order, with 0 counted as 10. So 238 and 490 pass, but 924
              doesn&apos;t.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="disp font-black text-[20px] shrink-0 w-7 leading-none mt-0.5" style={{ color: 'rgb(var(--accent))' }}>3</span>
            <span>
              <strong style={{ color: 'rgb(var(--text))' }}>A jodi that adds up.</strong> The jodi
              must come out of the two pannas. Records that fail this check are rejected for review.
            </span>
          </li>
        </ol>
        <Prose>
          <p>
            Spotted something wrong?{' '}
            <Link href="/contact/" className="text-accent-text underline underline-offset-3">
              Contact us
            </Link>{' '}
            with the date and a supporting source. Confirmed errors can be corrected after review.
          </p>
        </Prose>
      </Sec>

      {/* ══ H2: FAQ ══════════════════════════════════ */}
      <Sec id="faq" title="Sridevi Night Chart FAQs">
        <div className="mt-5">
          <Faq items={faqItems} />
        </div>
      </Sec>
    </ChartDataProvider>
  );
}
