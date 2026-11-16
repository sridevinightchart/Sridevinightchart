import type { Metadata } from 'next';
import { abs, SITE } from './site';
import { MARKET_TIMINGS } from './marketTiming';
export const DAY_TITLE = 'Sridevi Chart: Sridevi Day Panel Chart and Jodi Chart';
export const DAY_DESCRIPTION = `Sridevi chart with today's result, the full Sridevi day panel chart with patti, and the jodi chart from 2018 to today. Open ${MARKET_TIMINGS.day.openTime}, close ${MARKET_TIMINGS.day.closeTime} IST.`;
export const dayMetadata: Metadata = {
  title: DAY_TITLE, description: DAY_DESCRIPTION,
  alternates: { canonical: abs('/sridevi-chart/') },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
  openGraph: { type: 'website', title: DAY_TITLE, description: DAY_DESCRIPTION, url: abs('/sridevi-chart/'), siteName: SITE.name, locale: 'en_IN', images: [{ url: abs('/sridevi-day-opengraph.png'), width: 1200, height: 630, alt: 'Sridevi Chart — Day panel chart and jodi chart' }] },
  twitter: { card: 'summary_large_image', title: DAY_TITLE, description: DAY_DESCRIPTION, images: [abs('/sridevi-day-opengraph.png')] },
};

