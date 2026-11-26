import { MARKET_TIMINGS } from './marketTiming';
import type { QA } from './faq';
import { parseDay } from './time';

export function nightFaqItems(firstDate: string | null): QA[] {
  const timing = MARKET_TIMINGS.night;
  const first = firstDate ? parseDay(firstDate).toLocaleDateString('en-GB', {
    timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric',
  }) : null;
  return [
    { q: 'When does the Sridevi Night result come out?',
      a: `The open comes at ${timing.openTime} IST and the close at ${timing.closeTime} IST. Updates appear after source agreement and validation. The result card refreshes automatically while you wait.` },
    { q: 'Does Sridevi Night run on Sundays and holidays?',
      a: 'The archive includes results for all seven days, including Sundays. Results may be unavailable on holidays or other dates. Stars indicate unavailable values; they do not independently prove that the market was closed.' },
    { q: 'How do I find the result for an old date?',
      a: "Tap the year in the year bar, find the row with that week's dates, then move across to the day. You can also type the date into the date search above the charts." },
    { q: "Is tonight's result added to the chart straight away?",
      a: "Today's result is the card at the top of the page, which changes during the evening as the open and close come out. The chart is the full record of every night before it. Once tonight's close is declared, it's added to the chart too." },
    { q: "Can old results predict tonight's result?",
      a: 'No. Every Sridevi Night result is separate from the ones before it. We keep the record and nothing more: no tips, no guesses, no "fix" numbers.' },
    { q: 'Is the Sridevi Night chart the same as the Sridevi chart?',
      a: `No. Sridevi Night is the evening market, drawn at ${timing.openTime} and ${timing.closeTime} IST. The plain "Sridevi" or "Sridevi Day" market is drawn earlier in the day and has its own chart. This page is the night one.` },
    { q: 'Is there an old Sridevi Night chart from 1996 or 2000?',
      a: `We do not have verified records from those years. ${first ? `Our dated archive starts on ${first}.` : 'Our archive contains dated records.'} We do not publish older numbers that we cannot verify.` },
  ];
}
