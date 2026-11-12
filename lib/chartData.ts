import { groupByWeek, weekYear, type Week } from './matka';
import * as repo from './repo';
import { addDays, mondayOf, todayIST } from './time';

/** Last `n` weeks up to and including the current week */
export function recentWeeks(n: number, today = todayIST()): Week[] {
  const end = addDays(mondayOf(today), 6);
  const start = addDays(mondayOf(today), -7 * (n - 1));
  const rows = repo.getRange(start, end);
  return groupByWeek(rows, today, start, today);
}

/** Weeks belonging to a calendar year (a week belongs to the year of its Thursday) */
export function weeksForYear(year: number, today = todayIST()): Week[] {
  const from = addDays(`${year}-01-01`, -6);
  const to = addDays(`${year}-12-31`, 6);
  const rows = repo.getRange(from, to);
  if (!rows.length) return [];
  const lastData = rows[rows.length - 1].date;
  const endDay = String(year) === today.slice(0, 4) ? (today > lastData ? today : lastData) : `${year}-12-31`;
  const weeks = groupByWeek(rows, today, rows[0].date < `${year}-01-01` ? `${year}-01-01` : rows[0].date, endDay);
  return weeks.filter((w) => weekYear(w.monday) === year);
}
