import Link from 'next/link';
import { DesktopNav, MobileNav } from './Nav';

interface HeaderProps {
  years: number[];
  latestOpen?: string;
  latestJodi?: string;
  latestClose?: string;
}

export default function Header({ years }: HeaderProps) {



  return (
    <header
      className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md"
      style={{ borderBottom: '1px solid rgb(var(--text) / 0.14)' }}
    >
      <div className="relative mx-auto max-w-site px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Site logo */}
          <Link href="/" className="flex min-w-0 items-center gap-2.5 text-fg" style={{ textDecoration: 'none' }}>
            <img src="/logo-icon.svg" alt="" width={36} height={36} className="h-9 w-9 shrink-0" />
            <span className="disp whitespace-nowrap text-[21px] font-extrabold leading-tight tracking-tight sm:text-[22px]">
              Sridevi Night Chart
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2.5">
            <DesktopNav years={years} />
            <MobileNav years={years} />
          </div>
        </div>
      </div>
    </header>
  );
}
