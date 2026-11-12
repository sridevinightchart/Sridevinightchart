import { describe, expect, it } from 'vitest';
import { ank, display, groupByWeek, isDoubleJodi, isValidPana, jodiFrom, statusFrom, weekYear, type Result } from '../lib/matka';
import { mondayOf, weekLabel } from '../lib/time';

const r = (date: string, o: string | null, c: string | null, status: Result['status'] = 'closed'): Result => ({
  date,
  openPana: o,
  closePana: c,
  jodi: o && c ? jodiFrom(o, c) : null,
  status,
  updatedAt: '2026-11-10T14:47:00.000Z',
});

describe('ank and jodi', () => {
  it('computes ank as digit sum mod 10', () => {
    expect(ank('238')).toBe(3);
    expect(ank('490')).toBe(3);
    expect(ank('000')).toBe(0);
    expect(ank('999')).toBe(7);
  });
  it('238 + 490 gives jodi 33', () => {
    expect(jodiFrom('238', '490')).toBe('33');
  });
  it('detects doubles', () => {
    expect(isDoubleJodi('33')).toBe(true);
    expect(isDoubleJodi('34')).toBe(false);
    expect(isDoubleJodi(null)).toBe(false);
  });
});

describe('pana validation', () => {
  it.each(['490', '238', '550', '100', '000', '999', '127', '220'])('accepts %s', (p) => expect(isValidPana(p)).toBe(true));
  it.each(['924', '012', '321', '23', '2380', 'abc', '091', '901'])('rejects %s', (p) => expect(isValidPana(p)).toBe(false));
});

describe('status and display', () => {
  it.each(['62', '03', '00', '11'])('displays historical jodi %s without panas', (jodi) => {
    const result = { ...r('2026-01-05', null, null), jodi };
    expect(display(result)).toEqual({ open: '***', jodi, close: '***', text: `***-${jodi}-***` });
    const cell = groupByWeek([result], '2026-11-12')[0].days[0];
    expect(cell.kind).toBe('result');
    expect(display(cell.result).jodi).toBe(jodi);
  });
  it('keeps undeclared and holiday results hidden even if a jodi remains', () => {
    for (const status of ['pending', 'holiday'] as const) {
      expect(display({ ...r('2026-01-05', null, null, status), jodi: '62' }).jodi).toBe('**');
    }
  });
  it('derives status', () => {
    expect(statusFrom('238', '490', false)).toBe('closed');
    expect(statusFrom('238', null, false)).toBe('open');
    expect(statusFrom(null, null, false)).toBe('pending');
    expect(statusFrom('238', '490', true)).toBe('holiday');
  });
  it('formats closed, open-only and empty results', () => {
    expect(display(r('2026-11-10', '238', '490')).text).toBe('238-33-490');
    expect(display(r('2026-11-10', '238', null, 'open')).text).toBe('238-3*-***');
    expect(display(r('2026-11-10', null, null, 'holiday')).text).toBe('***-**-***');
    expect(display(null).text).toBe('***-**-***');
  });
});

describe('week grouping', () => {
  it('finds the Monday of a week', () => {
    expect(mondayOf('2026-11-10')).toBe('2026-11-09'); // Tuesday
    expect(mondayOf('2026-11-15')).toBe('2026-11-09'); // Sunday
    expect(mondayOf('2026-11-09')).toBe('2026-11-09'); // Monday
  });
  it('labels a week', () => {
    expect(weekLabel('2026-11-09')).toBe('09 Nov – 15 Nov 2026');
  });
  it('groups into full Monday–Sunday weeks with filled gaps', () => {
    const data = [r('2026-11-02', '899', '480'), r('2026-11-09', '790', '200'), r('2026-11-10', '238', '490')];
    const weeks = groupByWeek(data, '2026-11-11');
    expect(weeks).toHaveLength(2);
    expect(weeks[0].monday).toBe('2026-11-02');
    expect(weeks.every((w) => w.days.length === 7)).toBe(true);
    expect(weeks[0].days[0].kind).toBe('result');
    expect(weeks[0].days[1].kind).toBe('missing');
    expect(weeks[1].days[1].result?.jodi).toBe('33');
    expect(weeks[1].days[2].kind).toBe('pending'); // today, not declared
    expect(weeks[1].days[3].kind).toBe('future');
  });
  it('assigns a week to the year of its Thursday', () => {
    expect(weekYear('2025-12-29')).toBe(2026);
    expect(weekYear('2026-12-28')).toBe(2026);
    expect(weekYear('2019-12-30')).toBe(2020);
  });
});
