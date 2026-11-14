import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import { INFO_PAGES, infoModified, infoMetadata, type InfoSlug } from '@/lib/pages';
import { legalContent } from '@/lib/legalContent';
import { SITE, abs } from '@/lib/site';

export const dynamicParams = false;
export function generateStaticParams() { return Object.keys(INFO_PAGES).map((info) => ({ info })); }
function isInfo(value: string): value is InfoSlug { return Object.hasOwn(INFO_PAGES, value); }
export function generateMetadata({ params }: { params: { info: string } }) {
  return isInfo(params.info) ? infoMetadata(params.info) : { title: 'Page not found', robots: { index: false, follow: true } };
}
export default function InfoPage({ params }: { params: { info: string } }) {
  if (!isInfo(params.info)) notFound();
  const slug = params.info;
  const page = INFO_PAGES[slug];
  return (
    <article className="reading-section mx-auto max-w-[880px] px-6 pt-12 sm:pt-16">
      <Link href="/" className="text-sm font-semibold text-accent-text hover:underline">← Back to the chart</Link>
      <header className="mt-7 border-b border-line pb-7">
        <h1 className="disp mt-3 text-[48px] font-extrabold leading-tight sm:text-[64px]">{page.title}</h1>
        <p className="mt-4 max-w-[65ch] text-lg leading-relaxed text-soft">{page.description}</p>
      </header>
      <div className="prose-site mt-8 space-y-8 text-base">
        {legalContent[slug].map((section) => <section key={section.heading}>
          <h2 className="disp mb-3 text-[28px] font-bold leading-tight">{section.heading}</h2>
          <p>{section.text.split('sridevi night chart').map((part, index) => <span key={index}>{index > 0 && <Link href="/" className="text-accent-text underline underline-offset-4">sridevi night chart</Link>}{part}</span>)}</p>
        </section>)}
      </div>
      <aside className="mt-10 rounded-xl border border-line bg-surface/60 p-6">
        <h2 className="disp text-2xl font-bold">Get in touch</h2>
        <p className="mt-2 text-sm leading-relaxed text-soft">Questions, corrections or privacy concerns:</p>
        <a className="mt-2 inline-block break-all font-semibold text-accent-text underline underline-offset-4" href={`mailto:${SITE.email}`}>{SITE.email}</a>
      </aside>
      <nav aria-label="Related information" className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm">
        {Object.entries(INFO_PAGES).filter(([key]) => key !== slug).map(([key, item]) => <Link key={key} href={`/${key}/`} className="text-accent-text hover:underline">{item.title}</Link>)}
      </nav>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': page.type, '@id': abs(`/${slug}/#webpage`), url: abs(`/${slug}/`), name: page.title, description: page.description, inLanguage: 'en-IN', dateModified: infoModified(slug), isPartOf: { '@id': abs('/#website') } }} />
    </article>
  );
}
