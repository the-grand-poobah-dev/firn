'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { growth } from '@/lib/finance';
import { longDate, pct, usd } from '@/lib/format';
import type { PortfolioPosition } from '@/lib/data';

export function PositionDeck({ positions, variant = 'compact' }: { positions: PortfolioPosition[]; variant?: 'compact' | 'full' }) {
  const [viewportRef, embla] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps' });
  const [selected, setSelected] = useState(0);
  const onSelect = useCallback(() => setSelected(embla?.selectedScrollSnap() ?? 0), [embla]);
  useEffect(() => {
    if (!embla) return;
    embla.on('select', onSelect);
    onSelect();
    return () => { embla.off('select', onSelect); };
  }, [embla, onSelect]);
  if (!positions.length) return null;
  return <section aria-label="Your investment positions" className="space-y-3">
    <div className="overflow-hidden" ref={viewportRef}>
      <div className="flex touch-pan-y gap-3">
        {positions.map(position => {
          const months = position.plan === 'six' ? 6 : 12;
          const progress = Math.max(0, Math.min(100, position.daysIn / (months * 30.4375) * 100));
          const projected = growth(position.value, position.apy, Math.max(0, position.daysLeft));
          const full = variant === 'full';
          return <motion.div key={position.id} whileTap={{ scale: 0.985 }} transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className={full ? 'min-w-0 flex-[0_0_92%] sm:flex-[0_0_88%]' : 'min-w-0 flex-[0_0_86%] sm:flex-[0_0_78%]'}>
            <Link href={'/savings/' + position.id} className={'block h-full rounded-[24px] border p-4 shadow-float ' + (full ? 'border-transparent bg-accent text-accent-on' : 'border-line bg-card')}>
              <div className="flex items-start justify-between gap-3">
                <div><p className={'text-xs font-medium ' + (full ? 'text-accent-on/70' : 'text-muted')}>FIXED INVESTMENT</p><h3 className="mt-1 text-lg font-semibold">{position.plan === 'six' ? 'Firn Six' : 'Firn Twelve'}</h3></div>
                <span className={'rounded-full px-3 py-1 text-xs font-semibold ' + (full ? 'bg-black/10' : 'bg-card2')}>{position.daysLeft} days left</span>
              </div>
              <div className="mt-5 flex items-end justify-between gap-3">
                <div><p className={'text-xs ' + (full ? 'text-accent-on/70' : 'text-muted')}>{full ? 'BALANCE TODAY' : 'CURRENT VALUE'}</p><p className="mt-1 text-[27px] font-semibold tracking-tight money">{usd(position.value, 2)}</p></div>
                <div className="text-right"><p className={'text-xs ' + (full ? 'text-accent-on/70' : 'text-muted')}>EARNED</p><p className="mt-1 font-semibold money">{usd(position.earned, 2)}</p></div>
              </div>
              {!full && <>
                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-card2"><div className="h-full rounded-full bg-accent" style={{ width: progress + '%' }} /></div>
                <div className="mt-2 flex justify-between text-[10px] text-muted"><span>Started {longDate(position.startedOn)}</span><span>{pct(progress / 100, 0)} complete</span></div>
                <div className="mt-4 flex justify-between border-t border-line pt-3 text-xs"><span className="text-muted">Maturity value</span><strong className="money">{usd(projected, 2)}</strong></div>
              </>}
              {full && <div className="mt-5 grid grid-cols-2 gap-3 border-t border-accent-on/20 pt-3 text-xs">
                <div><span className="block text-accent-on/70">POSITION ID</span><strong className="mt-1 block font-mono">{position.id.slice(0, 8).toUpperCase()}</strong></div>
                <div><span className="block text-accent-on/70">MATURES</span><strong className="mt-1 block">{longDate(position.maturesOn)}</strong></div>
              </div>}
            </Link>
          </motion.div>;
        })}
      </div>
    </div>
    {positions.length > 1 && <div className="flex justify-center gap-1.5" aria-label="Investment cards">
      {positions.map((position, index) => <button key={position.id} type="button" aria-label={'Show investment ' + (index + 1)} aria-current={selected === index ? 'true' : undefined}
        onClick={() => embla?.scrollTo(index)} className={'h-1.5 rounded-full transition-all ' + (selected === index ? 'w-6 bg-accent' : 'w-1.5 bg-muted/40')} />)}
    </div>}
  </section>;
}
