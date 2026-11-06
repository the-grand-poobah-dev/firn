import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { getWalletBalance } from '@/lib/data';
import { usd, longDate } from '@/lib/format';
import { TopBar } from '@/components/app/TopBar';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default async function WalletPage() {
  const { supabase, user } = await requireUser();
  const [balance, ledgerResult] = await Promise.all([
    getWalletBalance(),
    supabase.from('wallet_ledger')
      .select('id, kind, amount, method, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30),
  ]);
  if (ledgerResult.error) throw ledgerResult.error;

  return (
    <div className="space-y-5">
      <TopBar title="Wallet" />
      <Card variant="hero" className="space-y-2">
        <p className="label">AVAILABLE BALANCE</p>
        <p className="text-3xl font-semibold money">{usd(balance, 2)}</p>
        <p className="text-xs text-muted">Calculated from your wallet ledger.</p>
        <Link href="/wallet/deposit" className="mt-2 inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-on">
          Add money
        </Link>
      </Card>
      <section className="space-y-3">
        <div><p className="label">RECENT ACTIVITY</p><h2 className="mt-1 text-base font-semibold">Wallet history</h2></div>
        {ledgerResult.data?.length ? (
          <div className="overflow-hidden rounded-2xl border border-line bg-card">
            {ledgerResult.data.map((entry, index) => {
              const amount = Number(entry.amount ?? 0);
              const positive = amount >= 0;
              return (
                <div key={entry.id} className={`flex items-center justify-between gap-3 px-4 py-3 ${index ? 'border-t border-line' : ''}`}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium capitalize">{entry.kind.replaceAll('_', ' ')}</p>
                    <p className="mt-1 text-[11px] text-muted">{entry.created_at ? longDate(entry.created_at) : 'Date unavailable'}{entry.method ? ` · ${entry.method}` : ''}</p>
                  </div>
                  <p className={`shrink-0 text-sm font-semibold tabular-nums ${positive ? 'text-pos' : 'text-fg'}`}>
                    {positive ? '+' : '−'}{usd(Math.abs(amount), 2)}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <Card><p className="text-sm text-muted">No wallet activity yet.</p></Card>
        )}
      </section>
      <p className="text-center text-[10px] leading-5 text-muted">SIMULATED wallet display. Payment providers are not connected; this page does not accept or transfer funds.</p>
    </div>
  );
}
