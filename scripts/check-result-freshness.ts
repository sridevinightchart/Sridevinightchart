import * as repo from '../lib/repo';
import { addDays, todayIST } from '../lib/time';
// This check runs at 20:23 UTC: 01:53 IST on the following calendar day.
const expected = addDays(todayIST(), -1);
const record = repo.getByDate(expected);
if (record?.status !== 'closed' && record?.status !== 'holiday') {
  console.error(`No completed result or confirmed closure is recorded for ${expected}. Existing data is preserved; inspect source availability. The next scheduled update will retry.`);
  process.exitCode = 1;
} else {
  console.log(`Daily record verified for ${expected}.`);
}
