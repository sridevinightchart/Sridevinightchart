import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Result } from '../lib/matka';
const fixture = vi.hoisted(() => ({ rows: [] as Result[] }));
vi.mock('../lib/repo', () => ({
  getAll: () => [...fixture.rows].sort((a, b) => a.date.localeCompare(b.date)),
  getRange: (from: string, to: string) => fixture.rows.filter((r) => r.date >= from && r.date <= to),
  getByDate: (date: string) => fixture.rows.find((r) => r.date === date) ?? null,
  lastUpdated: () => '2026-11-12T19:00:00Z',
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { buildLive } from '../lib/live';
import ResultCard from '../components/ResultCard';
const last: Result = { date: '2026-11-12', openPana: '340', jodi: '70', closePana: '280', status: 'closed', updatedAt: '2026-11-12T19:00:00Z' };
beforeEach(() => { fixture.rows = [last]; });

describe('latest declared result fallback', () => {
  it('keeps the real current date and leaves today empty while exposing the prior result separately', () => {
    const payload = buildLive(new Date('2026-11-13T04:00:00Z'));
    expect(payload.date).toBe('2026-11-13');
    expect(payload.today).toBeNull();
    expect(payload.latest).toEqual(last);
  });
  it('works across gaps and never picks future results', () => {
    fixture.rows = [{ ...last, date: '2026-11-10' }, { ...last, date: '2026-11-14' }];
    const payload = buildLive(new Date('2026-11-13T04:00:00Z'));
    expect(payload.yesterday).toBeNull();
    expect(payload.latest?.date).toBe('2026-11-10');
  });
  it('labels the fallback with 12 November, not 13 November', () => {
    const payload = buildLive(new Date('2026-11-13T04:00:00Z'));
    const html = renderToStaticMarkup(createElement(ResultCard, { initial: payload, initialMinutes: 570 }));
    expect(html).toContain('Last declared result');
    expect(html).toContain('Thu, 12 Nov 2026');
    expect(html).toContain('Jodi: 70');
    expect(html).toContain('Open: 340');
    expect(html).toContain('Close: 280');
  });
  it.each(['open', 'closed'] as const)('switches to the actual new %s result', (status) => {
    fixture.rows.push({ ...last, date: '2026-11-13', openPana: '238', closePana: status === 'closed' ? '490' : null, jodi: status === 'closed' ? '33' : null, status });
    const payload = buildLive(new Date('2026-11-13T15:00:00Z'));
    const html = renderToStaticMarkup(createElement(ResultCard, { initial: payload, initialMinutes: 1230 }));
    expect(html).not.toContain('Last declared result');
    expect(html).toContain('Fri, 13 Nov 2026');
    expect(html).toContain(status === 'closed' ? 'Jodi: 33' : 'Jodi: 3*');
  });
});
