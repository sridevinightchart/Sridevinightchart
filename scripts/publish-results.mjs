import fs from 'node:fs';

const snapshots = [
  { file: 'data/results.json', endpoint: '/api/result/today/' },
  { file: 'data/sridevi-day.json', endpoint: '/api/sridevi-day/result/today/' },
].map(({ file, endpoint }) => ({ endpoint, expected: JSON.parse(fs.readFileSync(file, 'utf8')).reduce((latest, row) => row.updatedAt > latest ? row.updatedAt : latest, '') }));
const base = process.env.PUBLIC_SITE_URL || 'https://sridevinightchart.com';
async function published() {
  const checks = await Promise.all(snapshots.map(async ({ endpoint, expected }) => {
    try {
      const response = await fetch(base.replace(/\/$/, '') + endpoint + '?verify=' + Date.now(), { cache: 'no-store', signal: AbortSignal.timeout(20_000) });
      if (!response.ok) return false;
      const data = await response.json();
      return (data.snapshotVersion ?? data.version) === expected;
    } catch { return false; }
  }));
  return checks.every(Boolean);
}
if (await published()) {
  console.log('Live site already serves the expected Day and Night snapshots.');
} else {
  const hook = process.env.VERCEL_DEPLOY_HOOK;
  if (!hook || new URL(hook).hostname !== 'api.vercel.com') throw new Error('A valid Vercel deploy hook secret is required.');
  const response = await fetch(hook, { method: 'POST', signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`Deployment request failed: HTTP ${response.status}`);
  // Verify actual production data rather than treating a deployment request as success.
  let verified = false;
  for (let attempt = 0; attempt < 24; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 10_000));
    if (await published()) { verified = true; break; }
  }
  if (!verified) throw new Error('New data is committed, but the production snapshot is not verified yet. The next scheduled run will retry deployment.');
  console.log('Verified: the live site serves the committed Day and Night snapshots.');
}
