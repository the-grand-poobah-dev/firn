'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

export function CountUp({ value, format = (n: number) => n.toLocaleString('en-US') }: { value: number; format?: (value: number) => string }) {
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
  return <span className="tabular">{format(display)}</span>;
}
