import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { JodiChart, PanelChart } from '../components/Charts';
import { groupByWeek, type Result } from '../lib/matka';

const result = (date: string, status: Result['status'], openPana: string | null, closePana: string | null, jodi: string | null): Result =>
  ({ date, status, openPana, closePana, jodi, updatedAt: '' });

describe.each([JodiChart, PanelChart])('chart cell rules', (Chart) => {
  it('marks doubles, today, the current week, holidays, open results and future cells', () => {
    const weeks = groupByWeek([
      result('2026-11-09', 'closed', '238', '490', '33'),
      result('2026-11-10', 'holiday', null, null, null),
      result('2026-11-11', 'open', '238', null, null),
    ], '2026-11-11');
    const html = renderToStaticMarkup(createElement(Chart, { weeks, today: '2026-11-11', caption: 'Test' }));
    expect(html).toContain('class="is-current"');
    expect(html).toMatch(/class="[^"]*is-double[^"]*"[^>]*>33</);
    expect(html).toMatch(/data-date="2026-11-11"[^>]*class="[^"]*is-today/);
    expect(html).toContain('3*');
    expect(html).toContain('no result (holiday)');
    expect(html).toMatch(/data-date="2026-11-12"[^>]*><\/span>/);
    if (Chart === PanelChart) {
      expect(html).toContain('aria-hidden="true">238</span>');
      expect(html).toContain('aria-hidden="true">490</span>');
    }
    // Table cells support accessible names; generic spans do not. This also
    // exposes all three panel values together instead of isolated digits.
    expect(html).toContain('<td class="day" aria-label="Monday 9 November 2026: 238-33-490">');
    expect(html).not.toMatch(/<span[^>]*aria-label=/);
  });
  it('distinguishes a missing entry with a readable dash, leaving future dates blank', () => {
    const weeks = groupByWeek([], '2026-11-11', '2026-11-09', '2026-11-15');
    const html = renderToStaticMarkup(createElement(Chart, { weeks, today: '2026-11-11', caption: 'Test', distinguishMissing: true }));
    expect(html).toContain('—');
    expect(html).not.toContain('\uFFFD');
    expect(html).toMatch(/data-date="2026-11-12"[^>]*><\/span>/);
  });
});
