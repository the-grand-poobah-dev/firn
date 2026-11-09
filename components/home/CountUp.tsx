'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { usd } from '@/lib/format';
import type { Currency } from '@/lib/fx';

export function CountUp({ value, currency = 'USD', decimals = 0 }: { value: number; currency?: Currency; decimals?: number }) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(reduceMotion ? value : 0);
  useEffect(() => {
    if (reduceMotion) { setDisplay(value); return; }
    let frame = 0;
    const start = performance.now();
    const duration = 850;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setDisplay(value * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduceMotion]);
  return <span className="tabular">{usd(display, decimals, currency)}</span>;
}
