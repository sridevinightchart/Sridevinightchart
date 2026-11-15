/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://*.clarity.ms https://www.googletagmanager.com${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.clarity.ms https://c.bing.com https://www.googletagmanager.com https://*.google-analytics.com",
  "font-src 'self'",
  "connect-src 'self' https://*.clarity.ms https://c.bing.com https://www.googletagmanager.com https://*.google-analytics.com https://*.google.com",
  "frame-src https://www.googletagmanager.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const nextConfig = {
  distDir: isDev ? '.next-dev' : '.next',
  trailingSlash: true,
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  async redirects() {
    return [
      ...(isDev ? [] : [{ source: '/:path*', has: [{ type: 'host', value: 'www.sridevinightchart.com' }], destination: 'https://sridevinightchart.com/:path*', permanent: true }]),
      ...['admin'].map((page) => ({
        source: `/${page}/:path*`, destination: '/', permanent: true,
      })),
      { source: '/sridevi-night-jodi-chart/:path*', destination: '/#jodi-chart', permanent: true },
      { source: '/sridevi-night-panel-chart/:path*', destination: '/#panel-chart', permanent: true },
      { source: '/sridevi-night-result-today/:path*', destination: '/#result-today', permanent: true },
      { source: '/sridevi-night-chart/:path*', destination: '/#old-chart', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      { source: '/chart-data/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      {
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default nextConfig;
