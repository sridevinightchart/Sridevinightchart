import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { inter, mono, display } from './fonts';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import { SITE } from '@/lib/site';
import * as repo from '@/lib/repo';
import NightFaqHead from '@/components/NightFaqHead';
import { nightFaqItems } from '@/lib/nightFaq';
import { faqSchema } from '@/lib/faq';

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
      <head><NightFaqHead data={faqSchema(nightFaqItems(repo.firstDate()))} /></head>
      <body className="min-h-screen font-sans antialiased">
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-M34V85S6" height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} title="Google Tag Manager" /></noscript>
        <Script id="google-tag-manager" strategy="afterInteractive">{`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-M34V85S6');
        `}</Script>
        <Script id="microsoft-clarity" strategy="lazyOnload">{`
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
