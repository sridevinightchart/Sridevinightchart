'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en-IN">
    <head>
      <title>Page temporarily unavailable | Sridevi Night Chart</title>
      <meta name="robots" content="noindex, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body style={{ margin: 0, background: '#F6F0E3', color: '#141938', fontFamily: 'Arial, sans-serif' }}>
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <section data-nosnippet>
        <h1>This page is temporarily unavailable</h1>
        <p style={{ lineHeight: 1.75 }}>Please reload to try again.</p>
        <button type="button" onClick={reset} style={{ marginTop: 20, border: 0, borderRadius: 8, background: '#F4A51C', color: '#141938', padding: '12px 24px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>Try again</button>
        </section>
      </main>
    </body>
  </html>;
}
