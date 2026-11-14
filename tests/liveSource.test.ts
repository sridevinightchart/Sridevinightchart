import { describe, expect, it } from 'vitest';
import { agreedLiveResult, parseLiveHero } from '../lib/liveSource';
import type { Result } from '../lib/matka';
const previous: Result = { date: '2026-11-12', openPana: '340', jodi: '70', closePana: '280', status: 'closed', updatedAt: '' };
const fresh = { open: '238', jodi: '33', close: '490' };
const now = new Date('2026-11-13T14:45:00Z'); // 20:15 IST.

describe('exact live hero extraction', () => {
  it('normalizes a trailing empty close delimiter without inventing a close', () => {
    expect(parseLiveHero('<div class="live">SRIDEVI NIGHT 279-8-</div>', 'https://matka-tips.org/record-chart/sridevi-night-jodi')).toEqual({open:'279',jodi:'8*',close:'***'});
  });
  it('extracts Matka Tips live result and ignores a conflicting advertisement', () => {
    const html = '<div class="live"><h3>Matka Tips Live Results</h3><div class="t24"><div>SRIDEVI NIGHT</div><span>⏳ 238-33-490</span></div></div><section><h2>SRIDEVI NIGHT</h2>340-70-280</section>';
    expect(parseLiveHero(html, 'https://matka-tips.org/record-chart/sridevi-night-jodi')).toEqual(fresh);
  });
  it('extracts Khabar split spans and normalizes its single-digit open jodi', () => {
    const html = '<div id="live-updates"><div class="update-item"><div><span>SRIDEVI NIGHT</span></div><div><span>238 - </span><span>3</span><span> - ***</span></div></div></div>';
    expect(parseLiveHero(html, 'https://khabar.bet/sridevi-night-matka-chart')).toEqual({ open: '238', jodi: '3*', close: '***' });
  });
  it('accepts open-only hero values without an undeclared close placeholder', () => {
    expect(parseLiveHero('<div class="live"><div>SRIDEVI NIGHT</div><span>470-1</span></div>', 'https://matka-tips.org/record-chart/sridevi-night-jodi')).toEqual({ open: '470', jodi: '1*', close: '***' });
  });
  it('does not use unrelated markup, another market, or multiple conflicting hero values', () => {
    expect(parseLiveHero('<div>SRIDEVI NIGHT 238-33-490</div>', 'https://khabar.bet/sridevi-night-matka-chart')).toBeNull();
    expect(parseLiveHero('<div class="live">SRIDEVI DAY 238-33-490</div>', 'https://matka-tips.org/record-chart/sridevi-night-jodi')).toBeNull();
    expect(parseLiveHero('<div class="live">SRIDEVI NIGHT 238-33-490 SRIDEVI NIGHT 340-70-280</div>', 'https://matka-tips.org/record-chart/sridevi-night-jodi')).toBeNull();
  });
});

describe('owner-approved publication window', () => {
  it('publishes matching valid new full results with explicit inference provenance', () => {
    const r = agreedLiveResult([fresh, fresh], [previous], now).record!;
    expect([r.date, r.openPana, r.jodi, r.closePana]).toEqual(['2026-11-13', '238', '33', '490']);
    expect(r.provenance?.dateBasis).toBe('owner-approved-publication-window');
  });
  it.each(['2026-11-13T13:44:00Z', '2026-11-13T18:30:00Z'])('does not assign undated numbers outside the window: %s', (time) => {
    expect(agreedLiveResult([fresh, fresh], [previous], new Date(time)).record).toBeNull();
  });
  it.each(['2026-11-13T13:45:00Z', '2026-11-13T18:29:00Z'])('includes the requested window boundary: %s', (time) => {
    expect(agreedLiveResult([fresh, fresh], [previous], new Date(time)).record?.date).toBe('2026-11-13');
  });
  it('accepts delayed evening checks after the old 8:30 PM cutoff', () => {
    expect(agreedLiveResult([fresh, fresh], [previous], new Date('2026-11-13T16:30:00Z')).record?.jodi).toBe('33');
  });
  it('does not relabel the carried-over previous result as today', () => {
    const stale = { open: '340', jodi: '70', close: '280' };
    expect(agreedLiveResult([stale, stale], [previous], now).record).toBeNull();
  });
  it('requires both sites, rejects disagreement, invalid arithmetic and an explicitly old date', () => {
    expect(() => agreedLiveResult([fresh, null], [previous], now)).toThrow('Both');
    expect(() => agreedLiveResult([fresh, { open: '556', jodi: '60', close: '299' }], [previous], now)).toThrow('disagree');
    expect(() => agreedLiveResult([{ ...fresh, jodi: '34' }, fresh], [previous], now)).toThrow('validation');
    expect(() => agreedLiveResult([{ ...fresh, date: '2026-11-12' }, fresh], [previous], now)).toThrow('different date');
  });
  it('publishes only the shared open until both sites agree on a close', () => {
    const r = agreedLiveResult([fresh, { open: '238', jodi: '3*', close: '***' }], [previous], now).record!;
    expect(r.status).toBe('open');
    expect(r.openPana).toBe('238');
    expect(r.closePana).toBeNull();
  });
});
