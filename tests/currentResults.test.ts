import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ cached: vi.fn(), fresh: vi.fn() }));
vi.mock('next/cache', () => ({ unstable_cache: () => mocks.cached }));
vi.mock('../lib/marketSources', async (original) => ({ ...await original<typeof import('../lib/marketSources')>(), observeMarket: mocks.fresh }));
import { currentMarketState } from '../lib/currentResults';
import { MARKETS } from '../lib/marketSources';
import type { Result } from '../lib/matka';
const now = new Date('2026-11-14T06:30:00Z');
const saved: Result[] = [{date:'2026-11-13',openPana:'288',jodi:'82',closePana:'679',status:'closed',updatedAt:'2026-11-13T08:00:00Z'}];
const observations = (observedAt: string) => MARKETS.day.sources.map(source => ({source,hero:{open:'279',jodi:'8*',close:'***'},dated:[],observedAt}));
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(now); mocks.cached.mockReset(); mocks.fresh.mockReset(); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
describe('live source cache recovery', () => {
  it('uses fresh cached observations without extra upstream fetches', async () => {
    mocks.cached.mockResolvedValue(observations(now.toISOString()));
    const state = await currentMarketState('day', saved);
    expect(state.records.at(-1)).toMatchObject({date:'2026-11-14',openPana:'279',status:'open',closePana:null});
    expect(mocks.fresh).not.toHaveBeenCalled();
  });
  it('bypasses observations retained after failed background revalidation', async () => {
    mocks.cached.mockResolvedValue(observations('2026-11-14T06:05:00Z'));
    mocks.fresh.mockResolvedValue(observations(now.toISOString()));
    const state = await currentMarketState('day', saved);
    expect(mocks.fresh).toHaveBeenCalledWith('day');
    expect(state.records.at(-1)?.openPana).toBe('279');
    expect(state.checkedAt).toBe(now.toISOString());
    expect(state.sourceStatus).toBe('checked');
  });
  it('reports an unavailable source instead of silently calling an old cache current', async () => {
    vi.spyOn(console,'error').mockImplementation(() => {});
    mocks.cached.mockResolvedValue(observations('2026-11-14T06:05:00Z'));
    mocks.fresh.mockRejectedValue(new Error('Upstream timeout'));
    const state = await currentMarketState('day', saved);
    expect(state.records).toEqual(saved);
    expect(state.sourceStatus).toBe('unavailable');
  });
});
