import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as repo from '../lib/repo';
import type { Result } from '../lib/matka';
let directory: string;
const row: Result = { date: '2026-11-12', openPana: '238', closePana: '490', jodi: '33', status: 'closed', updatedAt: '2026-11-12T16:00:00Z' };
beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sridevi-results-test-'));
  const file = path.join(directory, 'results.json');
  fs.writeFileSync(file, '[]');
  vi.stubEnv('RESULTS_PATH', file);
});
afterEach(() => {
  vi.unstubAllEnvs();
  fs.rmSync(directory, { recursive: true, force: true });
});
describe('file-backed repository', () => {
  it('preserves the existing repository contract with atomic updates', () => {
    repo.upsertMany([row, { ...row, date: '2025-12-31' }]);
    expect(repo.getAll().map((r) => r.date)).toEqual(['2025-12-31', '2026-11-12']);
    expect(repo.getRange('2026-01-01', '2026-12-31')).toEqual([row]);
    expect(repo.recent(1)).toEqual([row]);
    expect(repo.lastUpdated()).toBe(row.updatedAt);
    expect(repo.firstDate()).toBe('2025-12-31');
    expect(repo.years().map((y) => [y.year, y.results])).toEqual([[2025, 1], [2026, 1]]);
    repo.upsert({ ...row, jodi: '03' });
    expect(repo.getByDate(row.date)?.jodi).toBe('03');
    expect(fs.existsSync(process.env.RESULTS_PATH + '.tmp')).toBe(false);
    repo.remove(row.date);
    expect(repo.getByDate(row.date)).toBeNull();
  });
  it('never attempts to write into a Vercel deployment', () => {
    vi.stubEnv('VERCEL', '1');
    expect(() => repo.upsert(row)).toThrow('read-only');
    expect(repo.getAll()).toEqual([]);
  });
});
