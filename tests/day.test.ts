import { describe, expect, it } from 'vitest';
import { buildDayLive, dayResults, dayBlocks } from '../lib/day';
import { dayMetadata } from '../lib/daySeo';
import { isValidPana, jodiFrom } from '../lib/matka';
import { buildLive } from '../lib/live';
import sitemap from '../app/sitemap';

describe('Sridevi Day market', () => {
  it('contains only unique, ordered, mathematically consistent dated records', () => {
    const rows = dayResults();
    expect(rows.filter(r => r.status === 'closed').length).toBeGreaterThan(3000);
    expect(rows[0].date).toBe('2018-03-05');
    expect(new Set(rows.map(r => r.date)).size).toBe(rows.length);
    expect(rows.map(r => r.date)).toEqual(rows.map(r => r.date).sort());
    for (const row of rows) {
      if (row.status !== 'closed') continue;
      expect(isValidPana(row.openPana!)).toBe(true);
      expect(isValidPana(row.closePana!)).toBe(true);
      expect(jodiFrom(row.openPana!, row.closePana!)).toBe(row.jodi);
    }
  });
  it('keeps Day results separate from Night and never relabels yesterday as today', () => {
    const now = new Date('2026-11-14T04:00:00Z');
    const day = buildDayLive(now, dayResults().filter(row => row.date <= '2026-11-13')); 
    expect(day.latest).toMatchObject({ date: '2026-11-13', jodi: '82', openPana: '288', closePana: '679' });
    expect(day.today).toBeNull();
    expect(buildLive(new Date('2026-11-13T18:00:00Z')).latest?.jodi).toBe('10');
    const historical = buildDayLive(new Date('2018-03-05T15:00:00Z'));
    expect(historical.latest?.date).toBe('2018-03-05');
    expect(historical.week.filter(d => d.date > historical.date).every(d => d.result === null)).toBe(true);
  });
  it('preserves the explicit six-week closure without invented values', () => {
    const closure = dayResults().filter(r => r.date >= '2020-10-12' && r.date <= '2020-11-22');
    expect(closure).toHaveLength(42);
    expect(closure.every(r => r.status === 'holiday' && r.jodi === null)).toBe(true);
  });
  it('covers every week from 2018 to today exactly once across year tabs', () => {
    const blocks = dayBlocks('2026-11-14');
    expect(blocks.map(b => b.year)).toEqual([2026,2025,2024,2023,2022,2021,2020,2019,2018]);
    const weeks = blocks.flatMap(b => b.weeks);
    expect(new Set(weeks.map(w => w.monday)).size).toBe(weeks.length);
    expect(weeks.at(-1)?.monday).toBe('2018-12-24');
    expect(weeks.some(w => w.monday === '2018-03-05')).toBe(true);
  });
  it('has its own canonical, matching social metadata and sitemap entry', () => {
    expect(dayMetadata.alternates?.canonical).toBe('https://sridevinightchart.com/sridevi-chart/');
    expect(dayMetadata.openGraph?.url).toBe(dayMetadata.alternates?.canonical);
    expect(dayMetadata.twitter?.title).toBe(dayMetadata.title);
    expect(sitemap().filter(p => p.url === dayMetadata.alternates?.canonical)).toHaveLength(1);
  });
});
