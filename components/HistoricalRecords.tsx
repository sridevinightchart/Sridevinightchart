import { display, isDoubleJodi, type Week } from '@/lib/matka';
import { labelDayMonth } from '@/lib/time';
import { todayIST, mondayOf } from '@/lib/time';

/** Compact server-only history: the numbers are present before JavaScript runs. */
export default function HistoricalRecords({ blocks }: { blocks: { year: number; weeks: Week[] }[] }) {
  const today = todayIST();
  return <div className="mt-8 space-y-3">
    <p className="text-sm leading-relaxed text-muted">Open a year to read its full weekly record. Each cell shows open panna, jodi and close panna; stars mean a value is unavailable.</p>
    {blocks.map(({ year, weeks }) => {
      // Values here are generated exclusively from numeric date/result fields.
      // Escape the remaining text so database edits cannot introduce markup.
      const esc = (value: string) => value.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!));
      const rows = weeks.map((week) => `<tr${week.monday === mondayOf(today) ? ' class="is-current"' : ''}><th scope="row">${labelDayMonth(week.monday)} – ${labelDayMonth(week.sunday)}</th>${week.days.map((day) => {
        const d = display(day.result);
        const text = day.kind === 'future' ? '' : `${esc(d.open)} <b${isDoubleJodi(d.jodi) ? ' class="is-double"' : ''}>${esc(d.jodi)}</b> ${esc(d.close)}`;
        return `<td id="h-${esc(day.date)}"${day.date === today ? ' class="is-today"' : ''}>${text}</td>`;
      }).join('')}</tr>`).join('');
      return <details key={year} id={`history-${year}`} className="history-year rounded-lg border border-line bg-surface/40">
        <summary className="cursor-pointer px-5 py-4 font-semibold">{year} full result record</summary>
        <div className="overflow-x-auto px-3 pb-4">
          <table className="history-table w-full text-center text-xs">
            <caption className="sr-only">Sridevi Night {year} historical open panna, jodi and close panna, Monday to Sunday</caption>
            <thead><tr><th scope="col">Week</th>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <th scope="col" key={day}>{day}</th>)}</tr></thead>
            <tbody dangerouslySetInnerHTML={{ __html: rows }} />
          </table>
        </div>
      </details>;
    })}
  </div>;
}
