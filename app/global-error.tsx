'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('Firn global error:', error); }, [error]);
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#08141D', color: '#EAF3F6', fontFamily: 'Arial, sans-serif' }}>
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 24, textAlign: 'center', gap: 16 }}>
          <div style={{ color: '#F0B27A', letterSpacing: 4, fontSize: 12 }}>SIMULATED</div>
          <h1 style={{ fontSize: 30, margin: 0 }}>Firn needs a moment.</h1>
          <p style={{ maxWidth: 420, color: '#8AA2AF', lineHeight: 1.6 }}>A page-level error interrupted this view. Please try again.</p>
          <button onClick={() => reset()} style={{ background: '#6FD3E6', color: '#052029', border: 0, borderRadius: 999, padding: '12px 20px', fontWeight: 700 }}>Try again</button>
        </main>
      </body>
    </html>
  );
}
