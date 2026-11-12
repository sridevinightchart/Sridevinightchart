/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
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
      {
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default nextConfig;
