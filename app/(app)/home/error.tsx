'use client';

export default function HomeError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="rounded-2xl border border-line bg-card p-6 text-center">
    <h2 className="font-semibold">This view could not load</h2>
    <p className="mt-2 text-sm text-muted">Your data is safe. Please try again.</p>
    <button onClick={() => reset()} className="mt-4 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-on">Try again</button>
  </div>;
}
