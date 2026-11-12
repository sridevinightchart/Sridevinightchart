import { ank, isValidPana, jodiFrom, type Result } from './matka';
import { addDays } from './time';

function validDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
/** Validate explicit source dates and published numbers; never infer a date from row position. */
export function sourceRecord(date: string, open: string, jodi: string, close: string, now: string): Result | null {
  if (!validDate(date) || !isValidPana(open)) return null;
  if (close === '***' && jodi === `${ank(open)}*`) return { date, openPana: open, closePana: null, jodi: null, status: 'open', updatedAt: now };
  if (!isValidPana(close) || !/^\d{2}$/.test(jodi) || jodiFrom(open, close) !== jodi) return null;
  return { date, openPana: open, closePana: close, jodi, status: 'closed', updatedAt: now };
}

export function parseResultFeed(body: string, now = new Date().toISOString()): Result[] {
  const records: Result[] = [];
  const add = (date: string, text: string) => {
    const flat = text.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');
    const match = flat.match(/(?:^|\s)(\d{3})\s*[-–]?\s*(\d{2}|\d\*)\s*[-–]?\s*(\d{3}|\*{3})(?:\s|$)/);
    if (!match) return;
    const record = sourceRecord(date, match[1], match[2], match[3], now);
    if (record) records.push(record);
  };
  // Require the market identity as well as a date. Undated JSON cannot become today's result.
  try {
    const parsed = JSON.parse(body);
    const rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed.results) ? parsed.results : [parsed];
    for (const row of rows) {
      if (!row || !/^sridevi[ -]night$/i.test(String(row.market ?? parsed.market ?? ''))) continue;
      const record = sourceRecord(String(row.date ?? ''), String(row.open ?? row.openPana ?? ''), String(row.jodi ?? ''), String(row.close ?? row.closePana ?? ''), now);
      if (record) records.push(record);
    }
    return records;
  } catch { /* Try the supported dated HTML layouts. */ }
  if (!/sridevi\s+night/i.test(body.replace(/<[^>]+>/g, ' '))) return [];
  for (const cell of body.matchAll(/<td\b[^>]*aria-label=["'](\d{4}-\d{2}-\d{2}):[^"']*["'][^>]*>([\s\S]*?)<\/td>/gi)) add(cell[1], cell[2]);
  for (const row of body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const date = row[1].match(/<td[^>]*>\s*(\d{4}-\d{2}-\d{2})\s*<\/td>/i)?.[1];
    if (date) add(date, row[1].replace(/<td[^>]*>\s*\d{4}-\d{2}-\d{2}\s*<\/td>/i, ''));
    // Dated Monday–Sunday panel rows. Preserve colspan holiday cells so dates never shift.
    const cells = [...row[1].matchAll(/<td\b([^>]*)>([\s\S]*?)<\/td>/gi)];
    if (!cells.length) continue;
    const dates = [...cells[0][2].matchAll(/(\d{2})\/(\d{2})\/(\d{4}|\d{2})(?!\d)/g)].map((m) => `${m[3].length === 2 ? '20' + m[3] : m[3]}-${m[2]}-${m[1]}`);
    if (dates.length !== 2 || !dates.every(validDate)) continue;
    const [monday, sunday] = dates;
    if (new Date(monday + 'T00:00:00Z').getUTCDay() !== 1 || addDays(monday, 6) !== sunday) continue;
    const values = cells.slice(1).flatMap((cell) => {
      const value = cell[2].replace(/<[^>]+>/g, '').replace(/&nbsp;|&#160;/gi, '').replace(/\s/g, '');
      const span = Number(cell[1].match(/colspan\s*=\s*["']?(\d+)/i)?.[1] ?? 1);
      // Khabar uses widths 2/3/2 for open/jodi/close and 7 for a whole missing day.
      if (span === 2 && /^(?:\d{3}|\*{3})$/.test(value)) return [value];
      if (span === 3 && /^(?:\d{2}|\d\*)$/.test(value)) return [value];
      if ((span === 3 || span === 7) && /^(?:\*+|✪)?$/.test(value)) return ['***', '**', '***'];
      return span === 1 ? [value] : ['INVALID'];
    });
    if (values.length !== 21) continue;
    for (let day = 0; day < 7; day++) {
      const [open, rawJodi, close] = values.slice(day * 3, day * 3 + 3);
      const jodi = /^\d$/.test(rawJodi) && close === '***' ? `${rawJodi}*` : rawJodi;
      const record = sourceRecord(addDays(monday, day), open, jodi, close, now);
      if (record) records.push(record);
    }
  }
  return records;
}

export function mergePublished(existing: Result[], incoming: Result[], today: string): Result[] {
  const byDate = new Map(existing.map((r) => [r.date, r]));
  const candidates = new Map<string, Result>();
  for (const record of incoming) {
    if (record.date > today) continue;
    // Automatic polling must not rewrite settled historical full results.
    const settled = byDate.get(record.date);
    if (record.date < today && settled?.status === 'closed' && settled.openPana && settled.closePana) continue;
    const previous = candidates.get(record.date);
    if (previous && (previous.openPana !== record.openPana || (previous.closePana && record.closePana && previous.closePana !== record.closePana))) {
      throw new Error(`Sources disagree for ${record.date}; no changes saved.`);
    }
    if (!previous || record.status === 'closed') candidates.set(record.date, record);
  }
  for (const [date, record] of candidates) {
    const old = byDate.get(date);
    if (old?.status === 'closed') {
      if (old.openPana && old.closePana) {
        if (old.openPana !== record.openPana || (record.closePana && old.closePana !== record.closePana)) throw new Error(`Published record conflicts with saved result for ${date}; no changes saved.`);
        continue;
      }
      if (record.status !== 'closed' || (old.jodi && old.jodi !== record.jodi)) continue;
    }
    if (old?.openPana && old.openPana !== record.openPana) throw new Error(`Open result conflicts for ${date}; no changes saved.`);
    if (old && old.status === record.status && old.openPana === record.openPana && old.closePana === record.closePana && old.jodi === record.jodi) continue;
    byDate.set(date, record);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}
