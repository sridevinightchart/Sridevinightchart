import { describe, expect, it } from 'vitest';
import { MARKETS, parseDayHero, parseDatedPanels, reconcileMarket, type Market, type SourceObservation } from '../lib/marketSources';
import { sourceRecord } from '../lib/resultFeed';
import type { Result } from '../lib/matka';
import { resultsVersion } from '../lib/live';
const prior = sourceRecord('2026-11-13', '288', '82', '679', '2026-11-13T08:00:00Z')!;
const fresh = { open: '238', jodi: '33', close: '490' };
const dayNow = new Date('2026-11-14T07:10:00Z'); // 12:40 IST
function observations(market: Market, now = dayNow): SourceObservation[] {
  return MARKETS[market].sources.map(source => ({ source, hero: { ...fresh }, dated: [], observedAt: now.toISOString() }));
}
function panel(open = '238', jodi = '33', close = '490') {
  return '<tr><th>9/11/26<br>to<br>15/11/26</th>' + Array.from({length:7}, (_, i) => i === 5 ? `<th>${open.split('').join('<br>')}</th><td>${jodi}</td><th>${close.split('').join('<br>')}</th>` : '<th></th><td></td><th></th>').join('') + '</tr>';
}
describe('Day live hero boundaries', () => {
  it('reads both approved Day hero layouts, excluding ads and Night results', () => {
    const first = '<div class="live-card">SRIDEVI 288-82-679</div><div class="live"><div>SRIDEVI</div>⏳238-33-490</div><div>SRIDEVI 288-82-679</div>';
    expect(parseDayHero(first, MARKETS.day.sources[0])).toEqual(fresh);
    expect(parseDayHero('<div id="chart-top-result"><div>SRIDEVI</div>238-33-490</div>', MARKETS.day.sources[1])).toEqual(fresh);
    expect(parseDayHero('<div class="live">SRIDEVI NIGHT 238-33-490</div>', MARKETS.day.sources[0])).toBeNull();
    expect(parseDayHero('<div class="live">SRIDEVI 238-33-490 SRIDEVI 288-82-679</div>', MARKETS.day.sources[0])).toBeNull();
  });
  it('normalizes open-only results without inventing a close', () => {
    expect(parseDayHero('<div class="live">SRIDEVI 238-3</div>', MARKETS.day.sources[0])).toEqual({open:'238',jodi:'3*',close:'***'});
  });
  it('accepts the actual trailing-dash publication used by Matka Tips', () => {
    expect(parseDayHero('<div class="live"><div>SRIDEVI</div><span>⏳ 279-8-</span><button>⏳ Refresh</button></div>', MARKETS.day.sources[0])).toEqual({open:'279',jodi:'8*',close:'***'});
    const sources = observations('day');
    sources[0].hero = parseDayHero('<div class="live">SRIDEVI 279-8-</div>', MARKETS.day.sources[0]);
    sources[1].hero = parseDayHero('<div id="chart-top-result"><div>SRIDEVI</div><div>279-8</div></div>', MARKETS.day.sources[1]);
    expect(reconcileMarket('day', sources, [prior], dayNow).at(-1)).toMatchObject({date:'2026-11-14',openPana:'279',jodi:null,closePana:null,status:'open'});
    expect(parseDayHero('<div class="live">SRIDEVI 279-82-</div>', MARKETS.day.sources[0])).toBeNull();
    expect(parseDayHero('<div class="live">SRIDEVI 279-8-1234</div>', MARKETS.day.sources[0])).toBeNull();
  });
});
describe('dated weekly panel parsing', () => {
  it('preserves empty weekday cells and accepts one-digit dates and th panels', () => {
    expect(parseDatedPanels(panel(), dayNow.toISOString())).toEqual([expect.objectContaining({date:'2026-11-14',openPana:'238',jodi:'33',closePana:'490'})]);
  });
  it('rejects malformed weeks, incomplete rows and invalid panna arithmetic', () => {
    expect(parseDatedPanels(panel().replace('15/11/26','16/11/26'),dayNow.toISOString())).toEqual([]);
    expect(parseDatedPanels(panel().replace('<th></th><td></td><th></th>',''),dayNow.toISOString())).toEqual([]);
    expect(parseDatedPanels(panel('238','34','490'),dayNow.toISOString())).toEqual([]);
  });
  it('preserves whole-day colspan cells rather than shifting the remaining days', () => {
    const html = panel().replace('<th></th><td></td><th></th>','<td colspan="3">***</td>');
    expect(parseDatedPanels(html,dayNow.toISOString())[0].date).toBe('2026-11-14');
  });
});
describe.each(['day','night'] as Market[])('%s publication safeguards', market => {
  const now = market === 'day' ? dayNow : new Date('2026-11-14T15:00:00Z');
  it('publishes matching open then close, keeping all previous records intact', () => {
    const sources = observations(market, now);
    sources.forEach(s => { s.hero = {open:'238',jodi:'3*',close:'***'}; });
    const open = reconcileMarket(market,sources,[prior],now);
    expect(open.at(-1)).toMatchObject({date:'2026-11-14',status:'open',openPana:'238',closePana:null});
    const closed = reconcileMarket(market,observations(market,now),open,now);
    expect(closed.at(-1)).toMatchObject({date:'2026-11-14',status:'closed',jodi:'33'});
    expect(closed[0]).toEqual(prior);
    expect(reconcileMarket(market,observations(market,now),closed,now)).toEqual(closed);
  });
  it('withholds disagreeing, invalid and stale live values', () => {
    let sources = observations(market,now);
    sources[1].hero = {open:'288',jodi:'82',close:'679'};
    expect(() => reconcileMarket(market,sources,[prior],now)).toThrow(/disagree/);
    sources = observations(market,now);
    sources.forEach(s => { s.hero = {open:'238',jodi:'34',close:'490'}; });
    expect(() => reconcileMarket(market,sources,[prior],now)).toThrow(/validation/);
    sources.forEach(s => { s.hero = {open:'288',jodi:'82',close:'679'}; });
    expect(reconcileMarket(market,sources,[prior],now)).toEqual([prior]);
    expect(() => reconcileMarket(market,sources.slice(0,1),[prior],now)).toThrow();
  });
  it('rejects pre-window and prior-day cached heroes', () => {
    const sources = observations(market,now);
    sources.forEach(s => { s.observedAt = '2026-11-14T05:00:00Z'; });
    expect(reconcileMarket(market,sources,[prior],now)).toEqual([prior]);
    sources.forEach(s => { s.observedAt = '2026-11-13T15:00:00Z'; });
    expect(reconcileMarket(market,sources,[prior],now)).toEqual([prior]);
  });
  it('catches up after midnight using the explicit prior date, never assigning it to today', () => {
    const nextDay = new Date('2026-11-15T00:00:00Z');
    const sources = observations(market,nextDay);
    sources[1].dated = [sourceRecord('2026-11-14','238','33','490',nextDay.toISOString())!];
    const merged = reconcileMarket(market,sources,[prior],nextDay);
    expect(merged.at(-1)).toMatchObject({date:'2026-11-14',jodi:'33',provenance:{dateBasis:'dated-source-agreement'}});
    expect(merged.some(r => r.date === '2026-11-15')).toBe(false);
  });
  it('uses the caught-up date as its stale baseline, rather than copying it forward', () => {
    const sources = observations(market,now);
    sources[1].dated = [sourceRecord('2026-11-13','238','33','490',now.toISOString())!];
    const older = { ...prior, date:'2026-11-12' };
    const merged = reconcileMarket(market,sources,[older],now);
    expect(merged.at(-1)?.date).toBe('2026-11-13');
  });
  it('permits a real repeated result when explicitly dated and corroborated', () => {
    const sources = observations(market,now);
    sources.forEach(s => { s.hero = {open:'288',jodi:'82',close:'679'}; });
    sources[1].dated = [{...prior,date:'2026-11-14',updatedAt:now.toISOString()}];
    expect(reconcileMarket(market,sources,[prior],now).at(-1)?.date).toBe('2026-11-14');
  });
  it('does not replace an existing result when an upstream publication conflicts', () => {
    const saved = [...[prior], sourceRecord('2026-11-14','288','82','679',now.toISOString())!];
    expect(() => reconcileMarket(market,observations(market,now),saved,now)).toThrow(/conflict/i);
  });
});
it('does not trigger repeated UI refreshes for identical observations with new timestamps', () => {
  expect(resultsVersion([prior])).toBe(resultsVersion([{...prior,updatedAt:'2026-11-14T08:00:00Z'}]));
});
