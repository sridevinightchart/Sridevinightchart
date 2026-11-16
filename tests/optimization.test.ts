import { describe, expect, it } from 'vitest';
import { compactObservations, savedResultSufficient, MARKETS } from '../lib/marketSources';
import { pollDelay, FAST_POLL_MS, IDLE_POLL_MS, COMPLETE_POLL_MS, LIVE_CACHE_HEADERS } from '../lib/resultPolicy';
import { groupByWeek, type Result } from '../lib/matka';
import type { LivePayload } from '../lib/live';
import { archiveFile, chartDelivery } from '../lib/chartAssets';
import { GET as snapshot } from '../app/api/result/snapshot/route';
const closed: Result = {date:'2026-11-14',openPana:'279',jodi:'81',closePana:'236',status:'closed',updatedAt:'2026-11-14T07:00:00Z'};
const live = (status?: Result['status']): LivePayload => ({date:'2026-11-14',today:status?{...closed,status}:null,yesterday:null,week:[]});
describe('small live cache', () => {
  it('stores only the three permitted dates, rejecting future and old rows before caching', () => {
    const records = Array.from({length:2000},()=>({...closed,date:'2020-01-01'}));
    const sources = MARKETS.day.sources.map(source=>({source,hero:null,observedAt:'2026-11-14T06:00:00Z',dated:[...records,{...closed,date:'2026-11-12'},closed,{...closed,date:'2026-11-15'}]}));
    const compact = compactObservations(sources,new Date('2026-11-14T06:00:00Z'));
    expect(compact.every(s=>s.dated.length===2)).toBe(true);
    expect(Buffer.byteLength(JSON.stringify(compact))).toBeLessThan(8192);
    expect(sources[0].dated.length).toBe(2003);
  });
  it('retains conflicting recent publications for the agreement checks', () => {
    const source={source:MARKETS.day.sources[0],hero:null,observedAt:'2026-11-14T06:00:00Z',dated:[closed,{...closed,closePana:'490',jodi:'83'}]};
    expect(compactObservations([source],new Date('2026-11-14T06:00:00Z'))[0].dated).toHaveLength(2);
  });
});
describe('skip only reliable saved results', () => {
  it('skips before publication when yesterday is complete', () => {
    expect(savedResultSufficient('day',[closed],new Date('2026-11-15T04:00:00Z'))).toBe(true);
  });
  it('wakes at publication even with a complete previous day', () => {
    expect(savedResultSufficient('day',[closed],new Date('2026-11-15T06:05:00Z'))).toBe(false);
    expect(savedResultSufficient('night',[closed],new Date('2026-11-15T13:45:00Z'))).toBe(false);
  });
  it('skips only a mathematically valid completed current result', () => {
    const now=new Date('2026-11-14T06:30:00Z');
    expect(savedResultSufficient('day',[closed],now)).toBe(true);
    expect(savedResultSufficient('day',[{...closed,closePana:null}],now)).toBe(false);
    expect(savedResultSufficient('day',[{...closed,jodi:'88'}],now)).toBe(false);
  });
  it('does not skip a pending close or a missing past record', () => {
    expect(savedResultSufficient('day',[{...closed,date:'2026-11-15',status:'open',jodi:null,closePana:null}],new Date('2026-11-15T04:00:00Z'))).toBe(false);
    expect(savedResultSufficient('night',[],new Date('2026-11-15T04:00:00Z'))).toBe(false);
  });
});
describe('polling across market transitions', () => {
  it('slows outside publication and resumes at the window without a reload', () => {
    expect(pollDelay(live(),'2026-11-14',694,695,900)).toBe(IDLE_POLL_MS);
    expect(pollDelay(live(),'2026-11-14',695,695,900)).toBe(FAST_POLL_MS);
  });
  it('keeps polling after open, including late closes after the window', () => {
    expect(pollDelay(live('open'),'2026-11-14',1000,695,900)).toBe(FAST_POLL_MS);
  });
  it('slows after close but wakes immediately on the next IST day', () => {
    expect(pollDelay(live('closed'),'2026-11-14',850,695,900)).toBe(COMPLETE_POLL_MS);
    expect(pollDelay(live('closed'),'2026-11-15',0,695,900)).toBe(0);
  });
  it('keeps waiting for yesterday\'s close after the midnight payload refresh', () => {
    const payload={...live(),date:'2026-11-15',yesterday:{...closed,status:'open' as const,jodi:null,closePana:null}};
    expect(pollDelay(payload,'2026-11-15',15,695,900)).toBe(FAST_POLL_MS);
    expect(pollDelay({...payload,yesterday:closed},'2026-11-15',15,695,900)).toBe(IDLE_POLL_MS);
  });
  it('shares only a short public API response at Vercel, avoiding downstream cache stacking', () => {
    expect(LIVE_CACHE_HEADERS['Vercel-CDN-Cache-Control']).toBe('max-age=10');
    expect(LIVE_CACHE_HEADERS['CDN-Cache-Control']).toBe('no-store');
  });
});
describe('static archive delivery', () => {
  const block={year:2026,weeks:groupByWeek([closed],'2026-11-14','2026-11-09','2026-11-15')};
  it('does not change the archived URL when only observation metadata changes', () => {
    const one=archiveFile('day',block);
    const changed={...block,weeks:groupByWeek([{...closed,updatedAt:'2026-11-15T00:00:00Z'}],'2026-11-14','2026-11-09','2026-11-15')};
    expect(archiveFile('day',changed).url).toBe(one.url);
    expect(JSON.parse(one.body).weeks[0].days[5].result.openPana).toBe('279');
  });
  it('keeps both the calendar and ISO year live over New Year', () => {
    const blocks=[{year:2027,weeks:[]},{year:2026,weeks:[]},{year:2025,weeks:[]}];
    const plan=chartDelivery('day',blocks,'2027-01-01');
    expect(plan.initialBlocks.map(b=>b.year)).toEqual([2027,2026]);
    expect(plan.archives.map(b=>b.year)).toEqual([2025]);
  });
  it('trims only browser metadata, preserving live cell kinds and verified source records', () => {
    const input = structuredClone(block);
    const cell = input.weeks[0].days.find(day => day.result)!;
    cell.result!.provenance = { dateBasis: 'dated-source-agreement', observedAt: closed.updatedAt, sources: [...MARKETS.day.sources] };
    const original = structuredClone(input);
    const plan = chartDelivery('day', [input], '2026-11-14');
    const displayed = plan.initialBlocks[0].weeks[0].days.find(day => day.result)!;
    const { provenance, ...values } = cell.result!;
    expect(displayed.result).toEqual({ ...values, updatedAt: '' });
    expect(displayed.result).not.toHaveProperty('provenance');
    expect(plan.initialBlocks[0].weeks[0].days.map(day => day.kind)).toEqual(input.weeks[0].days.map(day => day.kind));
    expect(input).toEqual(original);
    expect(displayed.result).not.toBe(cell.result);
  });
  it('keeps archived filenames stable when pending/future cells become missing', () => {
    const past=JSON.parse(JSON.stringify(block));
    past.weeks[0].days[6].kind='missing';
    expect(archiveFile('day',past).url).toBe(archiveFile('day',block).url);
  });
});
it('returns committed versions without touching current source caches',async()=>{
  const response=snapshot();
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(await response.json()).toEqual({night:expect.any(String),day:expect.any(String)});
});
