import { requireUser } from '@/lib/auth';
import { TopBar } from '@/components/app/TopBar';
import { UsdtDepositClient } from '@/components/wallet/UsdtDepositClient';
import { MIN_USDT_DEPOSIT } from '@/lib/fx';

export const dynamic = 'force-dynamic';

const TRON_ADDRESS_PATTERN = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

export default async function UsdtDepositStep({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const params = await searchParams;
  const { supabase, user } = await requireUser();
  const configuredAddress = process.env.DEPOSIT_USDT_TRC20_ADDRESS?.trim() ?? '';
  // The receiving wallet is visible in manual-review mode; automated crediting stays disabled.
  const address = TRON_ADDRESS_PATTERN.test(configuredAddress) ? configuredAddress : null;
  const configuredMinimum = Number(process.env.MIN_DEPOSIT_USDT ?? '500');
  // $500 is the hard floor; a lower environment value can never weaken it.
  const minimumDeposit = Math.max(MIN_USDT_DEPOSIT, Number.isFinite(configuredMinimum) && configuredMinimum > 0 ? configuredMinimum : MIN_USDT_DEPOSIT);
  const returnTo = params.returnTo?.startsWith('/save/') ? params.returnTo : '/wallet/deposit';

  const { data, error } = await supabase
    .from('deposits')
    .select('id,txid,claimed_amount,verified_amount,status,failure_reason,created_at,updated_at,credited_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="space-y-5">
      <TopBar title="Deposit USDT (TRC20)" />
      <UsdtDepositClient
        address={address}
        minimumDeposit={minimumDeposit}
        initialDeposits={data ?? []}
        initialStatusError={error ? 'Deposit status is not available yet. The deposits database setup may still be pending.' : null}
        returnTo={returnTo}
      />
    </div>
  );
}
