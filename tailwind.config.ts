import type { Config } from 'tailwindcss';

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        bg2: v('bg2'),
        surface: v('surface'),
        surface2: v('surface-2'),
        line: v('border'),
        fg: v('text'),
        muted: v('muted'),
        soft: v('soft'),
        accent: v('accent'),
        'accent-ink': v('accent-ink'),
        'accent-text': v('accent-text'),
        hot: v('highlight'),
        ok: v('success'),
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
        display: ['var(--font-display)', 'Arial Narrow', 'sans-serif'],
      },
      borderRadius: { card: '6px', cell: '4px' },
      maxWidth: { site: '1180px' },
    },
  },
  plugins: [],
};
export default config;
