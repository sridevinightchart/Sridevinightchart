import { SITE } from './site';
export interface QA { q: string; a: string }
export function faqSchema(items: QA[], pagePath = '/') {
  return {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    '@id': `${SITE.url}${pagePath}#faq`,
    isPartOf: { '@id': `${SITE.url}${pagePath}#webpage` }, inLanguage: 'en-IN',
    mainEntity: items.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
}
