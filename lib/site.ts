export const SITE = {
  name: 'Sridevi Night Chart',
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://sridevinightchart.com').replace(/\/$/, ''),
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'sridevinightchart@gmail.com',
  market: 'Sridevi Night',
  openTime: '7:15 PM',
  closeTime: '8:15 PM',
  // Minutes after midnight IST
  openMinute: 19 * 60 + 15,
  closeMinute: 20 * 60 + 15,
  pollStartMinute: 19 * 60 + 5,
  pollEndMinute: 23 * 60 + 59,
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
