import Link from 'next/link';
import { ROUTES, SITE } from '@/lib/site';
import { INFO_PAGES } from '@/lib/pages';


export default function Footer({ years, lastUpdated }: { years: number[]; lastUpdated: string | null }) {
  return (
    <footer
      className="mt-28"
      style={{ background: 'rgb(var(--accent))', color: 'rgb(var(--accent-ink))', borderTop: '2px solid rgb(var(--accent-ink))' }}
    >
      <div className="mx-auto max-w-site px-6 pb-7 pt-14 flex flex-col gap-10">
        {/* Top grid */}
        <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div className="flex flex-col gap-2.5">
            <span className="disp text-[44px] font-black leading-none">{SITE.name}</span>
            <p className="mt-1 text-[15px] leading-relaxed max-w-[32ch]">
              Results and records only. Updated every night, minutes after the close.
            </p>
            <Link
              href="/"
              className="mt-2 self-start flex items-center gap-2 rounded-full border-2 px-4 py-2.5 text-sm font-semibold"
              style={{
                borderColor: 'rgb(var(--accent-ink))',
                color: 'rgb(var(--accent-ink))',
                textDecoration: 'none',
              }}
            >
              Back to today's result ↑
            </Link>
          </div>

          {/* Charts */}
          <nav aria-label="Charts" className="flex flex-col gap-2.5">
            <span className="disp text-[22px] font-extrabold">Charts</span>
            {[
              { href: ROUTES.today, label: 'Result today' },
              { href: ROUTES.jodi, label: 'Jodi chart' },
              { href: ROUTES.panel, label: 'Panel chart' },
              { href: ROUTES.archive, label: 'Old charts by year' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-[16px]"
                style={{ color: 'rgb(var(--accent-ink))', textDecoration: 'none' }}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Year archive */}
          {years.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <span className="disp text-[22px] font-extrabold">Every year</span>
              <div className="grid grid-cols-4 gap-1.5">
                {years
                  .slice()
                  .reverse()
                  .map((y, i) => (
                    <Link
                      key={y}
                      href={ROUTES.year(y)}
                      className="disp num text-center rounded-sm py-2 text-[18px] font-bold"
                      style={{
                        textDecoration: 'none',
                        ...(i === 0
                          ? { background: 'rgb(var(--accent-ink))', color: 'rgb(var(--accent))' }
                          : { border: '1.5px solid rgb(var(--accent-ink))', color: 'rgb(var(--accent-ink))' }),
                      }}
                    >
                      {y}
                    </Link>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Legal */}
        <p
          className="pt-5 text-[14px] leading-relaxed max-w-[92ch]"
          style={{ borderTop: '1.5px solid rgb(var(--accent-ink) / 0.35)' }}
        >
          This site is a public record of Sridevi Night results, published for information only. We do not run, promote or accept bets, and we have no link to any market operator. Past results cannot predict future ones. For readers aged 18 and over.
        </p>

        {/* Bottom bar */}
        <nav aria-label="Site information" className="flex flex-wrap gap-x-6 gap-y-3 border-t border-current/20 pt-6 text-sm font-semibold">
          {Object.entries(INFO_PAGES).map(([slug, page]) => <Link key={slug} href={`/${slug}/`} className="hover:underline">{page.title}</Link>)}
        </nav>
        <div className="num flex flex-wrap items-center justify-between gap-3 text-[13px]">
          <span>
            © {new Date().getFullYear()} {SITE.name}

          </span>

        </div>
      </div>
    </footer>
  );
}
