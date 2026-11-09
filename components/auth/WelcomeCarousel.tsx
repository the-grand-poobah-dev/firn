'use client';

import useEmblaCarousel from 'embla-carousel-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { InvestmentCalculator } from '@/components/calculator/InvestmentCalculator';

const slides = [
  ['Real buildings behind every dollar', 'Explore a portfolio of properties connected to your investment experience.'],
  ['Interest added every day', 'Watch daily accrual build over time. Targets are not guarantees.'],
  ['Estimate your investment', 'Choose an amount and compare daily, weekly, monthly, six-month and yearly projections.'],
  ['Lock 6 or 12 months', 'Choose a time horizon that works for your plan.'],
];
const slideImages: Record<number, string> = {
  0: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=85',
  1: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=85',
  3: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=85',
};

export function WelcomeCarousel() {
  const [started, setStarted] = useState(false);
  const [ref, api] = useEmblaCarousel({ loop: false });
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!api) return;
    const sync = () => setI(api.selectedScrollSnap());
    api.on('select', sync);
    return () => { api.off('select', sync); };
  }, [api]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden bg-bg px-5 pb-8 pt-[max(22px,env(safe-area-inset-top))] text-fg">
      <header className="flex justify-between"><Logo /></header>
      {!started ? (
        <>
          <div className="relative mt-8 flex flex-1 flex-col justify-start">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-[-20px] bottom-[-2rem] h-[48%] bg-cover bg-center"
              style={{ backgroundImage: "linear-gradient(180deg, var(--bg) 0%, color-mix(in srgb, var(--bg) 10%, transparent) 28%, rgba(8,20,29,.78) 100%), url(https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85)" }}
            />
            <div className="relative z-10 pt-10">
              <p className="font-mono text-[10px] uppercase tracking-[.25em] text-accent">A clearer path to your goals</p>
              <h1 className="mt-5 max-w-xs text-5xl font-semibold leading-[.98] tracking-tight">Invest with a view of what’s real.</h1>
              <p className="mt-5 max-w-xs text-sm leading-6 text-muted">Build an investment portfolio connected to real property, with clear time horizons and daily accrual.</p>
            </div>
          </div>
          <Link href="/calculator" className="mb-3 block text-center text-xs font-semibold text-accent">Try the investment calculator →</Link>
          <Button className="w-full" onClick={() => setStarted(true)}>Get started</Button>
          <Link href="/login" className="mt-4 text-center text-xs text-muted">Already have an account? <span className="text-accent">Log in</span></Link>
        </>
      ) : (
        <>
          <div ref={ref} className="mt-5 min-h-0 flex-1 overflow-hidden">
            <div className="flex h-full">
              {slides.map(([heading, body], n) => (
                <article key={heading} className="max-h-[calc(100dvh-250px)] min-w-0 flex-[0_0_100%] overflow-y-auto pb-3">
                  {slideImages[n] && (
                    <div
                      role="img"
                      aria-label={n === 0 ? 'Residential property exterior' : n === 1 ? 'Financial planning and calculations' : 'Planning and signing an investment agreement'}
                      className="relative h-64 overflow-hidden rounded-[30px] bg-card2 bg-cover bg-center"
                      style={{ backgroundImage: `linear-gradient(180deg, rgba(8,20,29,.02), rgba(8,20,29,.38)), url(${slideImages[n]})` }}
                    />
                  )}
                  <h2 className="mt-7 text-[32px] font-semibold leading-tight">{heading}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted">{body}</p>
                  {n === 2 && <div className="mt-4"><InvestmentCalculator /></div>}
                </article>
              ))}
            </div>
          </div>
          <div className="mt-auto pt-4">
            <div className="mb-5 flex justify-center gap-2">
              {slides.map((slide, n) => <button key={slide[0]} onClick={() => api?.scrollTo(n)} aria-label={'Slide ' + (n + 1)} className={'h-1.5 rounded-full ' + (i === n ? 'w-8 bg-accent' : 'w-2 bg-line')} />)}
            </div>
            {i < slides.length - 1 ? (
              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => api?.scrollNext()}>{i === 2 ? 'Continue to lock period' : 'Continue'}</Button>
                <Button variant="ghost" onClick={() => api?.scrollTo(slides.length - 1)}>Skip</Button>
              </div>
            ) : (
              <div className="grid gap-3">
                <Link className="flex min-h-12 items-center justify-center rounded-full bg-accent font-semibold text-accent-on" href="/signup">Create account</Link>
                <Link className="flex min-h-12 items-center justify-center rounded-full border border-line" href="/login">Log in</Link>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
