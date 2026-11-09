'use client';
import { useEffect, useState } from 'react';
import type { Currency } from '@/lib/fx';

export function useWalletCurrency() {
  const [currency, setCurrency] = useState<Currency>('USD');
  useEffect(() => {
    let active = true;
    fetch('/api/wallet/currency', { cache: 'no-store' })
      .then(response => response.ok ? response.json() : null)
      .then(payload => { if (active && (payload?.currency === 'USD' || payload?.currency === 'KES')) setCurrency(payload.currency); })
      .catch(() => {});
    return () => { active = false; };
  }, []);
  return currency;
}
