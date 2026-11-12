import localFont from 'next/font/local';
import { Big_Shoulders_Display } from 'next/font/google';

export const display = Big_Shoulders_Display({
  subsets: ['latin'],
  weight: ['500', '700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
});

export const inter = localFont({
  src: '../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
  variable: '--font-inter',
  weight: '100 900',
  display: 'swap',
});

export const mono = localFont({
  src: '../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2',
  variable: '--font-mono',
  weight: '100 800',
  display: 'swap',
});
