import { weeksForYear } from './chartData';
import * as repo from './repo';
import { todayIST } from './time';

/** Current and previous year in full; older years are only linked. */
export function chartPageData() {
  const today = todayIST();
  const years = repo.years().map((y) => y.year);
  const shown = years.slice(-2);
  const older = years.slice(0, -2);
  const blocks = shown.map((year) => ({ year, weeks: weeksForYear(year, today) }));
  return { today, years, blocks, older, first: repo.firstDate(), updated: repo.lastUpdated() };
}
