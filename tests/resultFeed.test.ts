import { describe, expect, it } from 'vitest';
import { parseResultFeed, mergePublished, sourceRecord } from '../lib/resultFeed';
const now = '2026-11-12T16:00:00Z';
const record = sourceRecord('2026-11-12', '238', '33', '490', now)!;

describe('published result validation', () => {
  it('parses an explicitly dated panel cell without shifting dates', () => {
    const html = '<h1>Sridevi Night Panel Chart</h1><td aria-label="2026-11-12: Published"><span>238</span><strong>33</strong><span>490</span></td><td aria-label="2026-11-13: Unavailable">***</td>';
    expect(parseResultFeed(html, now)).toEqual([record]);
  });
  it('rejects undated JSON and the wrong market', () => {
    expect(parseResultFeed('{"open":"238","jodi":"33","close":"490"}')).toEqual([]);
    expect(parseResultFeed(JSON.stringify({ market: 'Sridevi Day', date: '2026-11-12', open: '238', jodi: '33', close: '490' }))).toEqual([]);
  });
  it('does not use an article publication date to date an undated live result', () => {
    const html = '<h1>Sridevi Night</h1><script type="application/ld+json">{"datePublished":"2025-10-12"}</script><div>340-70-280</div><table><tr><td>62</td><td>33</td><td>60</td><td>70</td><td>**</td><td>**</td><td>**</td></tr></table>';
    expect(parseResultFeed(html, now)).toEqual([]);
  });
  it('reads dated weekly panels and keeps holiday columns aligned', () => {
    const full = (o: string, j: string, c: string) => `<td>${o.split('').join('<br>')}</td><td>${j}</td><td>${c.split('').join('<br>')}</td>`;
    const empty = '<td>***</td><td>**</td><td>***</td>';
    const html = `<h1>Sridevi Night Panel Chart</h1><table><tr><td>09/11/26<br>to<br>15/11/26</td>${full('238', '33', '490')}<td colspan="3">✪</td>${full('556', '60', '299')}${full('340', '70', '280')}${empty.repeat(3)}</tr></table>`;
    expect(parseResultFeed(html, now).map((r) => [r.date, r.jodi])).toEqual([
      ['2026-11-09', '33'], ['2026-11-11', '60'], ['2026-11-12', '70'],
    ]);
  });
  it('rejects a weekly row whose start is not Monday', () => {
    const html = '<h1>Sridevi Night</h1><tr><td>10/11/2026 to 16/11/2026</td>' + '<td>238</td><td>33</td><td>490</td>'.repeat(7) + '</tr>';
    expect(parseResultFeed(html, now)).toEqual([]);
  });
  it('supports Khabar panel widths without mistaking numeric jodi colspans for holidays', () => {
    const panel = '<td colspan="2">3<br>4<br>0</td><td colspan="3">70</td><td colspan="2">2<br>8<br>0</td>';
    const missing = '<td colspan="7">✪</td>';
    const html = `<h1>Sridevi Night</h1><tr><td colspan="7">09/11/26<br>to<br>15/11/26</td>${missing.repeat(3)}${panel}${missing.repeat(3)}</tr>`;
    expect(parseResultFeed(html, now).map((r) => [r.date, r.openPana, r.jodi, r.closePana])).toEqual([['2026-11-12', '340', '70', '280']]);
  });
  it('rejects mismatched jodis, invalid pannas and impossible dates', () => {
    expect(sourceRecord('2026-11-12', '238', '34', '490', now)).toBeNull();
    expect(sourceRecord('2026-11-12', '924', '53', '490', now)).toBeNull();
    expect(sourceRecord('2026-02-30', '238', '33', '490', now)).toBeNull();
  });
  it('preserves leading zeros and supports a dated open result', () => {
    expect(sourceRecord('2026-11-12', '000', '03', '490', now)?.jodi).toBe('03');
    expect(sourceRecord('2026-11-12', '238', '3*', '***', now)?.status).toBe('open');
  });
});
describe('safe automatic merging', () => {
  it('leaves existing history untouched and ignores future records', () => {
    expect(mergePublished([record], [{ ...record, date: '2026-11-13' }], '2026-11-12')).toEqual([record]);
    expect(mergePublished([record], [], '2026-11-12')).toEqual([record]);
  });
  it('does not change timestamps or downgrade a declared close', () => {
    expect(mergePublished([record], [{ ...record, updatedAt: '2026-11-12T17:00:00Z' }], record.date)).toEqual([record]);
    expect(mergePublished([record], [{ ...record, closePana: null, jodi: null, status: 'open' }], record.date)).toEqual([record]);
  });
  it('upgrades open to closed and preserves other dates', () => {
    const old = { ...record, date: '2026-11-11' };
    expect(mergePublished([old, { ...record, closePana: null, jodi: null, status: 'open' }], [record], record.date)).toEqual([old, record]);
  });
  it('rejects disagreement before mutating saved results', () => {
    const conflicting = sourceRecord(record.date, '790', '62', '200', now)!;
    expect(() => mergePublished([], [record, conflicting], record.date)).toThrow('disagree');
    expect(() => mergePublished([record], [conflicting], record.date)).toThrow('conflicts');
  });
});
