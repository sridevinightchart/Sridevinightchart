'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { login, saveResult, type FormState } from './actions';
import { ank, isValidPana } from '@/lib/matka';

const input = 'num h-12 w-full rounded-xl border border-line bg-bg px-4 text-lg tracking-widest focus:border-accent';

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="h-12 rounded-xl bg-accent px-6 font-semibold text-accent-ink disabled:opacity-60">
      {pending ? 'Saving…' : children}
    </button>
  );
}

export function LoginForm() {
  const [state, action] = useFormState<FormState, FormData>(login, {});
  return (
    <form action={action} className="card mx-auto mt-10 max-w-sm space-y-4 p-6">
      <h1 className="text-xl font-semibold">Admin login</h1>
      <label className="block text-sm">
        Password
        <input name="password" type="password" required autoComplete="current-password" className="mt-1.5 h-11 w-full rounded-xl border border-line bg-bg px-3" />
      </label>
      {state.message && <p role="alert" className="text-sm text-hot">{state.message}</p>}
      <Submit>Log in</Submit>
    </form>
  );
}

export function ResultForm({ date, open, close, holiday }: { date: string; open: string; close: string; holiday: boolean }) {
  const [state, action] = useFormState<FormState, FormData>(saveResult, {});
  const [o, setO] = useState(open);
  const [c, setC] = useState(close);
  const [h, setH] = useState(holiday);

  const oOk = o.length === 3 && isValidPana(o);
  const cOk = c.length === 3 && isValidPana(c);
  const preview = h ? '***-**-***' : oOk ? (cOk ? `${o}-${ank(o)}${ank(c)}-${c}` : `${o}-${ank(o)}*-***`) : '***-**-***';
  const clean = (v: string) => v.replace(/\D/g, '').slice(0, 3);

  return (
    <form action={action} key={date} className="card space-y-5 p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">
          Date (IST)
          <input name="date" type="date" defaultValue={date} required className="num mt-1.5 h-12 w-full rounded-xl border border-line bg-bg px-3" />
        </label>
        <label className="block text-sm">
          Open pana
          <input name="open" inputMode="numeric" value={o} onChange={(e) => setO(clean(e.target.value))} disabled={h} placeholder="238" className={`${input} mt-1.5`} aria-invalid={o.length === 3 && !oOk} />
          {o.length === 3 && !oOk && <span className="mt-1 block text-xs text-hot">Not a valid pana</span>}
        </label>
        <label className="block text-sm">
          Close pana
          <input name="close" inputMode="numeric" value={c} onChange={(e) => setC(clean(e.target.value))} disabled={h} placeholder="490" className={`${input} mt-1.5`} aria-invalid={c.length === 3 && !cOk} />
          {c.length === 3 && !cOk && <span className="mt-1 block text-xs text-hot">Not a valid pana</span>}
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="holiday" checked={h} onChange={(e) => setH(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--accent))]" />
        No result this day (holiday)
      </label>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-surface2 px-4 py-3">
        <span className="text-sm text-muted">Will show as</span>
        <span className="num text-2xl font-semibold">{preview}</span>
      </div>
      {state.message && (
        <p role="status" className={`text-sm ${state.ok ? 'text-ok' : 'text-hot'}`}>{state.message}</p>
      )}
      <Submit>Save result</Submit>
    </form>
  );
}
