import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { APPROVED_RESULT_SOURCES, fetchAndSaveToday } from '../lib/auto-fetch';
let directory: string;
let file: string;
const feed = { market: 'Sridevi Night', date: '2026-11-12', open: '238', jodi: '33', close: '490' };
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-12T15:00:00Z'));
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sridevi-updater-test-'));
  file = path.join(directory, 'results.json');
  fs.writeFileSync(file, '[]');
  vi.stubEnv('RESULTS_PATH', file);
  vi.stubEnv('RESULT_SOURCE_URL', 'https://kalyanchart.cyou/sridevi-night-panel-chart/');
  vi.stubEnv('RESULT_SOURCE_URL2', '');
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(feed))));
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
    expect(JSON.parse(first)[0].jodi).toBe('33');
    vi.setSystemTime(new Date('2026-11-12T15:30:00Z'));
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
    expect(fs.readFileSync(file, 'utf8')).toBe('[]');
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('Offline'); }));
    expect((await fetchAndSaveToday()).success).toBe(false);
    expect(fs.readFileSync(file, 'utf8')).toBe('[]');
  });
});
