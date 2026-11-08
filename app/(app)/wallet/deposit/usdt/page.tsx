import { requireUser } from '@/lib/auth';
import { TopBar } from '@/components/app/TopBar';
import { UsdtDepositClient } from '@/components/wallet/UsdtDepositClient';

export const dynamic = 'force-dynamic';

const TRON_ADDRESS_PATTERN = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

export default async function UsdtDepositStep({ searchParams }: { searchParams: { returnTo?: string } }) {
  const { supabase, user } = await requireUser();
  const configuredAddress = process.env.DEPOSIT_USDT_TRC20_ADDRESS?.trim() ?? '';
  const address = TRON_ADDRESS_PATTERN.test(configuredAddress) ? configuredAddress : null;
  const configuredMinimum = Number(process.env.MIN_DEPOSIT_USDT ?? '10');
  const minimumDeposit = Number.isFinite(configuredMinimum) && configuredMinimum > 0 ? configuredMinimum : 10;
  const returnTo = searchParams.returnTo?.startsWith('/save/') ? searchParams.returnTo : '/wallet/deposit';

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
