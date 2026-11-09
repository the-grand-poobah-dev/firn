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
  supabase.from('positions').select('id,principal,started_on,status').eq('user_id', user.id).eq('status', 'active'),
 ]);
 const currency = isCurrency(profileResult.data?.currency) ? profileResult.data.currency : 'USD';
 const balance = Number(balanceResult.data ?? 0);
 const now = new Date();
 const positions = (positionsResult.data ?? []).map(p => {
  const start = new Date(`${p.started_on}T00:00:00Z`);
  const elapsed = Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - start.getTime()) / 86400000);
  return { id:p.id, principal:Number(p.principal), daysRemaining:Math.max(0,90-elapsed), elapsed };
 });
 const holdDays = positions.reduce((max,p)=>Math.max(max,p.daysRemaining),0);
 const earlyExitUnlockable = holdDays===0 ? positions.reduce((sum,p)=>sum+p.principal-Math.round(p.principal*0.015*100)/100,0) : 0;
 return <div className="space-y-5"><TopBar title="Withdraw" backHref="/wallet"/><header><p className="label">MOVE MONEY OUT</p><h1 className="mt-2 text-2xl font-semibold">Withdraw funds</h1><p className="mt-2 text-sm text-muted">Choose a payout method. Every request is reviewed and paid manually by FIRN.</p></header><Card><p className="label">AVAILABLE WALLET BALANCE</p><p className="mt-2 text-3xl font-semibold">{formatCurrency(balance,currency)}</p><p className="mt-1 text-xs text-muted">Requests are checked against your available balance before they enter the review queue.</p></Card><ManualWithdraw balance={balance} currency={currency} holdDays={holdDays} hasActivePositions={positions.length>0&&holdDays===0} earlyExitUnlockable={earlyExitUnlockable}/><Card><p className="font-semibold">90-day early exit</p><p className="mt-2 text-sm text-muted">Funds in an active savings position remain locked for the first 90 days. After day 90, an early exit can be requested: all earned profits are forfeited and a 1.5% charge applies to principal. Normal maturity terms still apply.</p></Card></div>;
}