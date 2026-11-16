import { MARKET_TIMINGS } from './marketTiming';

export const SITE = {
  name: 'Sridevi Night Chart',
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://sridevinightchart.com').replace(/\/$/, ''),
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'sridevinightchart@gmail.com',
  market: 'Sridevi Night',
  ...MARKET_TIMINGS.night,
};

export const ROUTES = {
  home: '/',
  jodi: '/#jodi-chart',
  panel: '/#panel-chart',
  today: '/#result-today',
  year: (y: number | string) => `/#jodi-year-${y}`,
  archive: '/#old-chart',
  contact: '/contact/',
  disclaimer: '/disclaimer/',
  privacy: '/privacy-policy/',
};

export const abs = (path: string) => `${SITE.url}${path}`;
