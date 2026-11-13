'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/sridevi-chart/', label: 'Sridevi Chart (Day)' },
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
];

export function MobileNav({ years }: { years: number[] }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);
  const close = () => { if (menu.current) menu.current.open = false; };
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!menu.current?.contains(event.target as Node)) close(); };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menu.current?.open) {
        close();
        menu.current.querySelector('summary')?.focus();
      }
    };
    const desktop = window.matchMedia('(min-width: 768px)');
    const resize = () => { if (desktop.matches) close(); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    desktop.addEventListener('change', resize);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
      desktop.removeEventListener('change', resize);
    };
  }, []);
  return (
    <details ref={menu} onToggle={() => setOpen(menu.current?.open ?? false)} className="mobile-menu group md:hidden">
      <summary aria-label={open ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={open} aria-controls="mobile-navigation" className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-xl border border-line bg-surface/70 text-fg transition-colors hover:bg-bg2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent group-open:border-accent group-open:bg-accent">
        <svg className="h-5 w-5 group-open:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        <svg className="hidden h-5 w-5 group-open:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </summary>
      <nav id="mobile-navigation" aria-label="Mobile navigation" className="absolute left-4 right-4 top-[calc(100%+8px)] overflow-hidden rounded-2xl border border-line bg-bg p-2 shadow-xl sm:left-auto sm:right-6 sm:w-80">
        {LINKS.map((link, index) => <Link key={link.href} href={link.href} onClick={close} className="flex min-h-14 items-center justify-between gap-4 rounded-xl px-4 py-3 text-base font-semibold text-fg transition-colors hover:bg-bg2 focus-visible:bg-bg2 focus-visible:outline-none">
          <span className="flex items-center gap-3"><span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-lg bg-accent/15 text-xs font-bold text-accent-text">0{index + 1}</span>{link.label}</span>
          <span aria-hidden="true" className="text-muted">↗</span>
        </Link>)}
      </nav>
    </details>
  );
}

export function DesktopNav({ years }: { years: number[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="hidden items-center md:flex">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={path === l.href ? 'page' : undefined}
          className={`px-3.5 py-2.5 text-[15px] ${
            path === l.href ? 'text-fg font-medium' : 'text-soft hover:text-fg'
          }`}
          style={{ textDecoration: 'none' }}
        >
          {l.label}
        </Link>
      ))}


    </nav>
  );
}
