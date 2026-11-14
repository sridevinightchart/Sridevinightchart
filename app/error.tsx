'use client';

import { useEffect } from 'react';

/** Error-only indexing protection; restored when the normal page recovers. */
export default function PageError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    const cleanup = ['robots', 'googlebot'].map((name) => {
      const existing = document.head.querySelector<HTMLMetaElement>('meta[name="' + name + '"]');
      const previous = existing?.content;
      const robots = existing ?? document.createElement('meta');
      robots.name = name;
      robots.content = 'noindex, follow';
      if (!existing) document.head.appendChild(robots);
      return () => {
        if (existing) existing.content = previous ?? '';
        else robots.remove();
      };
    });
    return () => cleanup.forEach((restore) => restore());
  }, []);

  return <section data-nosnippet className="mx-auto max-w-[880px] px-6 py-16 text-center">
    <meta name="robots" content="noindex, follow" />
    <meta name="googlebot" content="noindex, follow" />
    <h1 className="disp text-[40px] font-extrabold sm:text-[56px]">This page is temporarily unavailable</h1>
    <p className="mt-4 text-base leading-7 text-muted">Please reload to try again.</p>
    <button type="button" onClick={reset} className="mt-7 rounded-lg bg-accent px-6 py-3 font-semibold text-accent-ink">Try again</button>
  </section>;
}
