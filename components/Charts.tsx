import type { DayCell, Week } from '@/lib/matka';
import { display, isDoubleJodi } from '@/lib/matka';
import { labelDayMonth, labelLong, mondayOf, WEEKDAYS, weekLabel } from '@/lib/time';

function cellLabel(c: DayCell): string {
  const day = labelLong(c.date);
  switch (c.kind) {
    case 'result':
    case 'open':
      return `${day}: ${display(c.result).text}`;
    case 'holiday':
      return `${day}: no result (holiday)`;
    case 'pending':
      return `${day}: result not declared yet`;
    case 'future':
      return `${day}: upcoming`;
    default:
      return `${day}: no result recorded`;
  }
}

function WeekHeader({ w }: { w: Week }) {
  return (
    <th scope="row" className="wk num text-[12px] leading-[1.35] text-muted">
      <span aria-hidden="true">
        {labelDayMonth(w.monday)}
        <br />
        <span className="wk-to">– </span>
        {labelDayMonth(w.sunday)}
      </span>
      <span className="sr-only">{weekLabel(w.monday)}</span>
    </th>
  );
}

function Head({ caption }: { caption: string }) {
  return (
    <>
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          <th scope="col" className="wk">Week</th>
          {WEEKDAYS.map((d) => (
            <th scope="col" key={d}>{d}</th>
          ))}
        </tr>
      </thead>
    </>
  );
}

interface ChartProps {
  weeks: Week[];
  today: string;
  caption: string;
}

export function JodiChart({ weeks, today, caption }: ChartProps) {
  const currentMonday = mondayOf(today);
  return (
    <div className="chart-scroll">
      <table className="chart">
        <Head caption={caption} />
        <tbody>
          {weeks.map((w) => (
            <tr key={w.monday} className={w.monday === currentMonday ? 'is-current' : undefined}>
              <WeekHeader w={w} />
              {w.days.map((c) => {
                const d = display(c.result);
                const blank = c.kind !== 'result' && c.kind !== 'open';
                const cls = [
                  'cell jodi-cell num',
                  c.kind === 'future' ? 'is-future' : '',
                  blank && c.kind !== 'future' ? 'is-blank' : '',
                  c.kind === 'result' && isDoubleJodi(d.jodi) ? 'is-double' : '',
                  c.date === today ? 'is-today' : '',
                ].join(' ');
                return (
                  <td key={c.date} className="day">
                    <span id={`j-${c.date}`} data-date={c.date} className={cls} aria-label={cellLabel(c)} title={cellLabel(c)}>
                      {c.kind === 'future' ? '' : d.jodi}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Digits({ value }: { value: string }) {
  return (
    <span className="pana num" aria-hidden="true">
      {[...value].map((ch, i) => (
        <span key={i}>{ch}</span>
      ))}
    </span>
  );
}

export function PanelChart({ weeks, today, caption }: ChartProps) {
  const currentMonday = mondayOf(today);
  return (
    <div className="chart-scroll panel-chart">
      <table className="chart">
        <Head caption={caption} />
        <tbody>
          {weeks.map((w) => (
            <tr key={w.monday} className={w.monday === currentMonday ? 'is-current' : undefined}>
              <WeekHeader w={w} />
              {w.days.map((c) => {
                const d = display(c.result);
                const blank = c.kind !== 'result' && c.kind !== 'open';
                const cls = [
                  'cell panel-cell',
                  c.kind === 'future' ? 'is-future' : '',
                  blank && c.kind !== 'future' ? 'is-blank' : '',
                  c.date === today ? 'is-today' : '',
                ].join(' ');
                const jodiCls = `pj num ${c.kind === 'result' && isDoubleJodi(d.jodi) ? 'is-double' : ''}`;
                return (
                  <td key={c.date} className="day">
                    <span id={`p-${c.date}`} data-date={c.date} className={cls} aria-label={cellLabel(c)} title={cellLabel(c)}>
                      {c.kind === 'future' ? null : (
                        <>
                          <Digits value={d.open} />
                          <span className={jodiCls} aria-hidden="true">{d.jodi}</span>
                          <Digits value={d.close} />
                        </>
                      )}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
