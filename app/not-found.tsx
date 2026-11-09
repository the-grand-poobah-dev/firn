import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="label">404 · Not found</p>
      <h1 className="text-3xl font-semibold">This page wandered off.</h1>
      <p className="text-sm text-muted">The address may be incorrect, or the page may have moved.</p>
      <Link href="/" className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-on">Back to Firn</Link>
    </main>
  );
}
