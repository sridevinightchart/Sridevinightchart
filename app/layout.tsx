import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { inter, mono, display } from './fonts';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import { SITE } from '@/lib/site';
import * as repo from '@/lib/repo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: 'Sridevi Night Chart – Today\'s Result, Jodi & Panel Chart Record', template: '%s' },
  applicationName: SITE.name,
  verification: { google: 'svVZs7B1m7nEMMqTTXStFC1Rjuk8xv3O6OnAafzvFrA' },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml', sizes: 'any' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F6F0E3',
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  const years = repo.years().map((y) => y.year);
  const lastUpdated = repo.lastUpdated();
  return (
    <html lang="en-IN" className={`${inter.variable} ${mono.variable} ${display.variable}`} data-theme="light">
      <body className="min-h-screen font-sans antialiased">
        <Script id="microsoft-clarity" strategy="afterInteractive">{`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "zdfabqcxaa");
        `}</Script>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-ink">
          Skip to content
        </a>
        <Header years={years} />
        <main id="main">{children}</main>
        <Footer years={years} lastUpdated={lastUpdated} />
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@graph': [
              { '@type': 'WebSite', '@id': `${SITE.url}/#website`, name: SITE.name, url: `${SITE.url}/`, inLanguage: 'en-IN' },
            ],
          }}
        />
      </body>
    </html>
  );
}
