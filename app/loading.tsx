export default function Loading() {
  return (
    <main aria-busy="true" aria-live="polite" className="mx-auto min-h-[50vh] w-full max-w-5xl space-y-5 p-5">
      <div className="h-5 w-28 animate-pulse rounded bg-card2" />
      <div className="h-12 w-2/3 animate-pulse rounded-xl bg-card2" />
      <div className="h-40 animate-pulse rounded-3xl border border-line bg-card" />
      <div className="grid grid-cols-2 gap-3"><div className="h-28 animate-pulse rounded-2xl bg-card"/><div className="h-28 animate-pulse rounded-2xl bg-card"/></div>
      <p className="text-xs text-muted">Loading Firn…</p>
    </main>
  );
}
