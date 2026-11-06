'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('Firn route error:', error); }, [error]);
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="label">Something went wrong</p>
      <h1 className="text-2xl font-semibold">This page hit a snag.</h1>
      <p className="text-sm text-muted">Your account data has not been changed by this error. Try loading the page again.</p>
      {error.digest && <p className="font-mono text-[10px] text-muted">Reference: {error.digest}</p>}
      <button onClick={() => reset()} className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-on">Try again</button>
    </main>
  );
}
