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
