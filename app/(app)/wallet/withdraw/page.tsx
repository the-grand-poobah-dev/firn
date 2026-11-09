import { TopBar } from '@/components/app/TopBar';
import { Card } from '@/components/ui/Card';
import { requireUser } from '@/lib/auth';
import { formatCurrency, isCurrency } from '@/lib/fx';
import { ManualWithdraw } from '@/components/wallet/ManualWithdraw';
export const dynamic = 'force-dynamic';
export default async function WithdrawPage() {
 const { supabase, user } = await requireUser();
 const [balanceResult, profileResult, positionsResult] = await Promise.all([
  supabase.rpc('wallet_balance'),
  supabase.from('profiles').select('currency').eq('id', user.id).maybeSingle(),
  supabase.from('positions').select('id').eq('user_id', user.id).eq('status', 'active'),
 ]);
 const currency = isCurrency(profileResult.data?.currency) ? profileResult.data.currency : 'USD';
 const balance = Number(balanceResult.data ?? 0);
 const hasActivePositions = (positionsResult.data ?? []).length > 0;
 return <div className="space-y-5"><TopBar title="Withdraw" backHref="/wallet"/><header><p className="label">MOVE MONEY OUT</p><h1 className="mt-2 text-2xl font-semibold">Withdraw funds</h1><p className="mt-2 text-sm text-muted">Choose a payout method. Every request is reviewed and paid manually by FIRN.</p></header><Card><p className="label">AVAILABLE WALLET BALANCE</p><p className="mt-2 text-3xl font-semibold">{formatCurrency(balance,currency)}</p><p className="mt-1 text-xs text-muted">Requests are checked against your available balance before they enter the review queue.</p></Card><ManualWithdraw balance={balance} currency={currency} hasActivePositions={hasActivePositions} /><Card><p className="font-semibold">90-day early exit</p><p className="mt-2 text-sm text-muted">Funds in an active savings position remain locked for the first 90 days. After day 90, an early exit can be requested: all earned profits are forfeited and a 1.5% charge applies to principal. Normal maturity terms still apply.</p></Card></div>;
}