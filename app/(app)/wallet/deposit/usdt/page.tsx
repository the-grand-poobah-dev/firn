import { requireUser } from '@/lib/auth';
import { UsdtDepositClient } from '@/components/wallet/UsdtDepositClient';

export const dynamic = 'force-dynamic';

const TRON_ADDRESS_PATTERN = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

export default async function UsdtDepositStep() {
  const { supabase, user } = await requireUser();
  const configuredAddress = process.env.DEPOSIT_USDT_TRC20_ADDRESS?.trim() ?? '';
  const address = TRON_ADDRESS_PATTERN.test(configuredAddress) ? configuredAddress : null;
  const configuredMinimum = Number(process.env.MIN_DEPOSIT_USDT ?? '10');
  const minimumDeposit = Number.isFinite(configuredMinimum) && configuredMinimum > 0 ? configuredMinimum : 10;

  const { data, error } = await supabase
    .from('deposits')
    .select('id,txid,claimed_amount,verified_amount,status,failure_reason,created_at,updated_at,credited_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="space-y-5">
      <UsdtDepositClient
        address={address}
        minimumDeposit={minimumDeposit}
        initialDeposits={data ?? []}
        initialStatusError={error ? 'Deposit status is not available yet. The deposits database setup may still be pending.' : null}
      />
    </div>
  );
}
