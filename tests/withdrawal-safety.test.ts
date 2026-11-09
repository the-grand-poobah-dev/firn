import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  new URL('../supabase/migrations/20261109102211_deposit_minimum_and_position_exit_guards.sql', import.meta.url),
  'utf8',
);

describe('deposit and withdrawal database guards', () => {
  it('enforces the 500 USDT minimum at database credit and review boundaries', () => {
    expect(migration).toContain('verified_amount >= 500');
    expect(migration).toContain('p_amount < 500');
    expect(migration).toContain('p_verified_amount < 500');
    expect(migration).toContain('min_amount = 500');
  });

  it('never closes all active positions from a wallet withdrawal request', () => {
    const start = migration.indexOf('create or replace function public.request_manual_withdrawal');
    const end = migration.indexOf('commit;', start);
    expect(start).toBeGreaterThanOrEqual(0);
    const withdrawalFunction = migration.slice(start, end);
    expect(withdrawalFunction).toContain('Early exit must be requested for one specific savings position');
    expect(withdrawalFunction).not.toContain('public.early_exit(');
    expect(withdrawalFunction).not.toContain('for v_pos');
    expect(withdrawalFunction).not.toContain('update public.positions');
  });
});
