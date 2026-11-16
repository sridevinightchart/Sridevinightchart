import type { Metadata } from 'next';
import { SITE, abs } from './site';

// Preserve these editorial dates; change modified only when the copy changes.
export const EDITORIAL_MODIFIED = '2026-11-12T16:43:00Z';
// Homepage edition republished at the owner's request; result dates are separate.
export const HOME_PUBLISHED = '2026-11-16T07:24:23Z';
export const HOME_MODIFIED = HOME_PUBLISHED;
export const INFO_PAGES = {
  about: { title: 'About Us', description: 'About Sridevi Night Chart, our historical records, data checks and independence.', type: 'AboutPage' },
  contact: { title: 'Contact Us', description: 'Contact Sridevi Night Chart to report a result error, ask a site question or raise a privacy concern.', type: 'ContactPage' },
  'privacy-policy': { title: 'Privacy Policy', description: 'How Sridevi Night Chart handles website requests, contact emails, storage and third-party services.', type: 'WebPage' },
  disclaimer: { title: 'Disclaimer', description: 'Understand the limits of Sridevi Night Chart results, historical records and informational content.', type: 'WebPage' },
  'terms-and-conditions': { title: 'Terms and Conditions', description: 'Terms for using Sridevi Night Chart, including acceptable use, data accuracy and external links.', type: 'WebPage' },
} as const;
export type InfoSlug = keyof typeof INFO_PAGES;

export function infoMetadata(slug: InfoSlug): Metadata {
  const page = INFO_PAGES[slug];
  const title = `${page.title} | ${SITE.name}`;
  const url = abs(`/${slug}/`);
  return {
    title, description: page.description, alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: { title, description: page.description, url, type: 'website', siteName: SITE.name, locale: 'en_IN', images: [{ url: abs('/opengraph-image.png'), width: 1200, height: 630, alt: SITE.name }] },
    twitter: { card: 'summary_large_image', title, description: page.description, images: [abs('/opengraph-image.png')] },
  };
}

export function infoModified(slug: string): string {
  return slug === 'privacy-policy' ? "2026-11-15T18:26:02.988Z" : EDITORIAL_MODIFIED;
}
