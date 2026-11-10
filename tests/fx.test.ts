import { describe, expect, it } from 'vitest';
import { FX_RATES, MIN_USDT_DEPOSIT, convertFromUsd, isCurrency, usdtToKes, usdtToUsd } from '@/lib/fx';

describe('FIRN display currency and USDT deposit rules', () => {
  it('uses the fixed USD to KES display rate', () => {
    expect(FX_RATES.USD).toBe(1);
    expect(FX_RATES.KES).toBe(135);
    expect(convertFromUsd(10, 'KES')).toBe(1350);
  });

  it('treats one USDT as one USD and converts the same amount to KES', () => {
    expect(usdtToUsd(500)).toBe(500);
    expect(usdtToKes(500)).toBe(67500);
  });

  it('allows manually verified deposits from 10 USDT and only supports USD/KES display', () => {
    expect(MIN_USDT_DEPOSIT).toBe(10);
    expect(124.14).toBeGreaterThanOrEqual(MIN_USDT_DEPOSIT);
    expect(isCurrency('USD')).toBe(true);
    expect(isCurrency('KES')).toBe(true);
    expect(isCurrency('EUR')).toBe(false);
  });
});
