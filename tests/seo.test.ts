import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { INFO_PAGES, infoMetadata } from '../lib/pages';
import { legalContent } from '../lib/legalContent';
import HistoricalRecords from '../components/HistoricalRecords';
import { groupByWeek, type Result } from '../lib/matka';

describe('information page coverage', () => {
  it('gives every information page its own content, canonical and social metadata', () => {
    const titles = new Set();
    for (const slug of Object.keys(INFO_PAGES) as (keyof typeof INFO_PAGES)[]) {
      const metadata = infoMetadata(slug);
      expect(metadata.alternates?.canonical).toBe(`https://sridevinightchart.com/${slug}/`);
      expect(metadata.openGraph?.url).toBe(metadata.alternates?.canonical);
      expect(metadata.twitter?.title).toBe(metadata.title);
      expect(legalContent[slug].length).toBeGreaterThan(2);
      titles.add(metadata.title);
    }
    expect(titles.size).toBe(Object.keys(INFO_PAGES).length);
  });
});

describe('crawlable history', () => {
  it('renders old results in HTML with leading zeros and highlighted doubles', () => {
    const record: Result = { date: '2025-01-06', status: 'closed', openPana: '000', closePana: '000', jodi: '00', updatedAt: '' };
    const weeks = groupByWeek([record], '2025-01-08', '2025-01-06', '2025-01-12');
    const html = renderToStaticMarkup(createElement(HistoricalRecords, { blocks: [{ year: 2025, weeks }] }));
    expect(html).toContain('id="history-2025"');
    expect(html).toContain('id="h-2025-01-06">000 <b class="is-double">00</b> 000');
    expect(html).toContain('id="h-2025-01-09"></td>');
  });
});
