import type { ChartAsset, ChartBlock } from './chartTypes';

// Jodi and panel tabs share the same request and parsed data, including "All".
const requests = new Map<string, Promise<ChartBlock>>();
export function loadChartAsset(asset: ChartAsset): Promise<ChartBlock> {
  const existing = requests.get(asset.url);
  if (existing) return existing;
  const request = fetch(asset.url).then(async (response) => {
    if (!response.ok) throw new Error('Chart archive unavailable');
    const block = await response.json() as ChartBlock;
    if (block.year !== asset.year || !Array.isArray(block.weeks) || !block.weeks.every((w) => Array.isArray(w.days) && w.days.length === 7)) throw new Error('Invalid chart archive');
    return block;
  }).catch((error) => { requests.delete(asset.url); throw error; });
  requests.set(asset.url, request);
  return request;
}
