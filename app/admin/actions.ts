'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { checkPassword, clearAttempts, createSession, destroySession, isAuthed, rateLimited } from '@/lib/auth';
import { isValidPana, jodiFrom, statusFrom } from '@/lib/matka';
import * as repo from '@/lib/repo';
import { labelShort } from '@/lib/time';

export interface FormState {
  ok?: boolean;
  message?: string;
}

function clientIp(): string {
  const h = headers();
  return (h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? 'local').split(',')[0].trim();
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const ip = clientIp();
  if (rateLimited(ip)) return { message: 'Too many attempts. Wait 15 minutes and try again.' };
  if (!checkPassword(String(form.get('password') ?? ''))) return { message: 'Wrong password.' };
  clearAttempts(ip);
  createSession();
  redirect('/admin/');
}

export async function logout(): Promise<void> {
  destroySession();
  redirect('/admin/');
}

function refreshPages() {
  // Every public page shows results (header, footer timestamp), so revalidate the whole tree.
  revalidatePath('/', 'layout');
}

export async function saveResult(_: FormState, form: FormData): Promise<FormState> {
  if (!isAuthed()) return { message: 'Your session has expired. Log in again.' };

  const date = String(form.get('date') ?? '');
  const open = String(form.get('open') ?? '').trim() || null;
  const close = String(form.get('close') ?? '').trim() || null;
  const holiday = form.get('holiday') === 'on';

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { message: 'Enter a valid date.' };
  if (!holiday) {
    if (!open) return { message: 'Enter the open pana, or tick “No result”.' };
    if (!isValidPana(open)) return { message: `Open pana ${open} is not valid. Digits must be in order, with 0 counted as 10 (e.g. 238, 490).` };
    if (close && !isValidPana(close)) return { message: `Close pana ${close} is not valid. Digits must be in order, with 0 counted as 10.` };
  }

  const status = statusFrom(holiday ? null : open, holiday ? null : close, holiday);
  repo.upsert({
    date,
    openPana: holiday ? null : open,
    closePana: holiday ? null : close,
    jodi: !holiday && open && close ? jodiFrom(open, close) : null,
    status,
    updatedAt: new Date().toISOString(),
  });
  refreshPages();

  const what = status === 'holiday' ? 'marked as no result' : status === 'closed' ? `saved: ${open}-${jodiFrom(open!, close!)}-${close}` : `open saved: ${open}`;
  return { ok: true, message: `${labelShort(date)} ${what}. Pages updated.` };
}

export async function deleteResult(form: FormData): Promise<void> {
  if (!isAuthed()) redirect('/admin/');
  const date = String(form.get('date') ?? '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    repo.remove(date);
    refreshPages();
  }
  redirect('/admin/');
}
