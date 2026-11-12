import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/', name: SITE.name, short_name: 'Sridevi Night',
    description: 'Sridevi Night results, jodi charts and panel records.',
    start_url: '/', scope: '/', display: 'standalone', lang: 'en-IN',
    background_color: '#F6F0E3', theme_color: '#F6F0E3',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
