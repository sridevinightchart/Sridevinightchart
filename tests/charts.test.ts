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
      expect(html).toContain('<span>2</span><span>3</span><span>8</span>');
      expect(html).toContain('<span>4</span><span>9</span><span>0</span>');
    }
  });
});
