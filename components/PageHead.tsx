import Breadcrumbs, { type Crumb } from './Breadcrumbs';
import { stampIST } from '@/lib/time';

export default function PageHead({
  crumbs,
  title,
  children,
  updated,
}: {
  crumbs: Crumb[];
  title: string;
  children?: React.ReactNode;
  updated?: string | null;
}) {
  return (
    <>
      <Breadcrumbs items={crumbs} />
      <header className="mx-auto max-w-site px-4 pt-4">
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] sm:text-[40px]">{title}</h1>
        {updated && (
          <p className="mt-2 text-[13px] text-muted">
            Last updated <time dateTime={updated}>{stampIST(updated)}</time>
          </p>
        )}
        {children && <div className="prose-site mt-4 text-[15px]">{children}</div>}
      </header>
    </>
  );
}
