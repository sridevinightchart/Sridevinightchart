import JsonLd from './JsonLd';
import { faqSchema, type QA } from '@/lib/faq';
export type { QA } from '@/lib/faq';

export default function Faq({ items, id = 'faq', pagePath = '/', schema = true }: { items: QA[]; id?: string; pagePath?: string; schema?: boolean }) {
  return (
    <>
      <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
        {items.map((it, i) => (
          <details key={i} className="group" id={`${id}-${i + 1}`}>
            <summary className="flex items-center justify-between gap-4 px-4 py-4 text-[15px] font-medium sm:px-5">
              {it.q}
              <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line text-muted transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="px-4 pb-4 text-[15px] leading-7 text-fg/85 sm:px-5">{it.a}</p>
          </details>
        ))}
      </div>
      {schema && <JsonLd data={faqSchema(items, pagePath)} />}
    </>
  );
}
