import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

async function main() {
  const { fetchAndSaveToday } = await import('../lib/auto-fetch');
  const result = await fetchAndSaveToday(process.argv.includes('--dry'));
  console.log(result.message);
  if (!result.success) process.exitCode = 1;
}
main().catch((error) => { console.error(error instanceof Error ? error.message : 'Updater failed'); process.exitCode = 1; });
