import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { APPROVED_RESULT_SOURCES, fetchAndSaveToday } from '../lib/auto-fetch';
let directory: string;
let file: string;
const prior = { date: '2026-11-11', openPana: '340', jodi: '70', closePana: '280', status: 'closed', updatedAt: '2026-11-11T15:00:00Z' };
const hero = (url: string) => url.includes('khabar.bet')
  ? '<div id="live-updates"><div class="update-item"><span>SRIDEVI NIGHT</span><span>238 - </span><span>33</span><span> - 490</span></div></div>'
  : '<div class="live"><h3>Matka Tips Live Results</h3><div>SRIDEVI NIGHT</div><span>238-33-490</span></div>';
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-12T14:45:00Z'));
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sridevi-updater-test-'));
  file = path.join(directory, 'results.json');
  fs.writeFileSync(file, JSON.stringify([prior]));
  vi.stubEnv('RESULTS_PATH', file);
  vi.stubEnv('RESULT_SOURCE_URL', 'https://kalyanchart.cyou/sridevi-night-panel-chart/');
  vi.stubEnv('RESULT_SOURCE_URL2', '');
  vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(hero(url))));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fs.rmSync(directory, { recursive: true, force: true });
});
describe('automatic file update pipeline', () => {
  it('saves a validated result once, without timestamp churn on the next poll', async () => {
    expect((await fetchAndSaveToday()).changed).toBe(true);
    const first = fs.readFileSync(file, 'utf8');
    expect(JSON.parse(first).find((r: { date: string }) => r.date === '2026-11-12').jodi).toBe('33');
    vi.setSystemTime(new Date('2026-11-12T14:50:00Z'));
    expect((await fetchAndSaveToday()).changed).toBe(false);
    expect(fs.readFileSync(file, 'utf8')).toBe(first);
  });
  it('uses only the two exact approved pages even when stale environment URLs exist', async () => {
    vi.stubEnv('RESULT_SOURCE_URL', 'https://unapproved.example/feed');
    await fetchAndSaveToday(true);
    const calledUrls = vi.mocked(fetch).mock.calls.map((call) => call[0]);
    expect(calledUrls).toEqual([...APPROVED_RESULT_SOURCES]);
    expect(calledUrls).not.toContain('https://unapproved.example/feed');
  });
  it('does not write in dry runs or when sources fail', async () => {
    expect((await fetchAndSaveToday(true)).changed).toBe(true);
    expect(JSON.parse(fs.readFileSync(file, 'utf8'))).toEqual([prior]);
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('Offline'); }));
    const attempt = fetchAndSaveToday();
    await vi.runAllTimersAsync();
    expect((await attempt).success).toBe(false);
    expect(JSON.parse(fs.readFileSync(file, 'utf8'))).toEqual([prior]);
  });
  it('still fetches and publishes an agreed result after 8:30 PM IST', async () => {
    vi.setSystemTime(new Date('2026-11-12T16:30:00Z'));
    expect((await fetchAndSaveToday()).changed).toBe(true);
    expect(JSON.parse(fs.readFileSync(file, 'utf8')).some((r: { date: string }) => r.date === '2026-11-12')).toBe(true);
  });
});
