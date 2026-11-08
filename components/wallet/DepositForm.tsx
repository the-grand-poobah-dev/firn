'use client';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';

type Props = { usdtEnabled: boolean };

const comingSoon = ['M-Pesa', 'Debit or credit card', 'Bank transfer'];

export function DepositForm({ usdtEnabled }: Props) {
  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div>
          <p className="text-sm font-semibold">USDT · TRON (TRC20)</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Send Tether to FIRN's verified receiving address. Wallet credit follows confirmed on-chain verification.
          </p>
        </div>
        {usdtEnabled ? (
          <Link href="/wallet/deposit/usdt" className="flex min-h-12 items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-on">
            Continue to USDT deposit
          </Link>
        ) : (
          <button type="button" disabled className="min-h-12 w-full cursor-not-allowed rounded-full border border-line bg-card2 text-sm font-semibold text-muted">
            USDT deposits temporarily unavailable
          </button>
        )}
      </Card>
      <Card className="space-y-3">
        <p className="text-sm font-semibold">Other payment methods</p>
        {comingSoon.map(method => (
          <button key={method} type="button" disabled aria-disabled="true" className="flex min-h-12 w-full cursor-not-allowed items-center justify-between rounded-xl border border-line bg-card2 px-4 text-left text-sm opacity-60">
            <span>{method}</span>
            <span className="rounded-full bg-card px-2 py-1 text-[10px] font-semibold text-muted">Coming soon</span>
          </button>
        ))}
        <p className="text-xs leading-5 text-muted">These options are disabled and cannot initiate a payment.</p>
      </Card>
    </div>
  );
}
