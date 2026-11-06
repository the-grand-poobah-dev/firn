'use client';

export default function SavingsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="rounded-2xl border border-line bg-card p-6 text-center"><h2 className="font-semibold">Savings couldn't load</h2><p className="mt-2 text-sm text-muted">Please check your connection and retry.</p><button onClick={() => reset()} className="mt-4 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-on">Retry</button></div>;
}
