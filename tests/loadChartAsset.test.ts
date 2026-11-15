import { afterEach, expect, it, vi } from 'vitest';
import { loadChartAsset } from '../lib/loadChartAsset';
const block={year:2019,weeks:[{monday:'2019-01-07',sunday:'2019-01-13',days:Array.from({length:7},(_,i)=>({date:`2019-01-${String(7+i).padStart(2,'0')}`,kind:'missing',result:null}))}]};
afterEach(()=>vi.unstubAllGlobals());
it('shares one static archive request between panel and jodi',async()=>{
  const fetcher=vi.fn(async()=>new Response(JSON.stringify(block)));
  vi.stubGlobal('fetch',fetcher);
  const asset={year:2019,url:'/chart-data/shared-test.json'};
  const [one,two]=await Promise.all([loadChartAsset(asset),loadChartAsset(asset)]);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(one).toBe(two);
});
it('retries a failed static archive instead of caching the failure',async()=>{
  const fetcher=vi.fn().mockResolvedValueOnce(new Response('',{status:500})).mockResolvedValueOnce(new Response(JSON.stringify(block)));
  vi.stubGlobal('fetch',fetcher);
  const asset={year:2019,url:'/chart-data/retry-test.json'};
  await expect(loadChartAsset(asset)).rejects.toThrow();
  expect((await loadChartAsset(asset)).year).toBe(2019);
  expect(fetcher).toHaveBeenCalledTimes(2);
});
it('rejects the wrong year rather than displaying it under the selected year',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify(block))));
  await expect(loadChartAsset({year:2020,url:'/chart-data/wrong-year-test.json'})).rejects.toThrow();
});
