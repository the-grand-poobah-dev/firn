import Link from 'next/link';
import { TopBar } from '@/components/app/TopBar';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { PaymentMethodSelector } from '@/components/wallet/PaymentMethodSelector';
import { areUsdtDepositsEnabled, getActiveDepositAddress } from '@/lib/deposits/config';

export const dynamic = 'force-dynamic';

export default async function DepositPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; method?: string }> }) {
  const query = await searchParams;
  const returnTo = query.returnTo?.startsWith('/save/') ? query.returnTo : '/wallet';
  const usdtEnabled = areUsdtDepositsEnabled() && Boolean(getActiveDepositAddress());

  return (
    <div className="space-y-5">
      <TopBar title="Add money" />
      <header>
        <p className="label">FUND YOUR FIRN WALLET</p>
        <h1 className="mt-2 text-2xl font-semibold">Choose a top-up method</h1>
        <p className="mt-2 text-sm text-muted">{usdtEnabled ? 'USDT on Tron is available.' : 'Deposits are temporarily unavailable.'} Other payment methods will be enabled as their integrations launch.</p>
      </header>

      <PaymentMethodSelector selectedId={query.method} returnTo={returnTo} usdtEnabled={usdtEnabled} />

      <Card className="border-warm/40">
        <div className="flex gap-2">
          <Icon name="warn" className="shrink-0 text-warm" size={18} />
          <div>
            <p className="text-sm font-semibold">Deposit processing is not enabled yet</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Selecting USDT opens the dedicated deposit setup screen. Do not send funds until that screen provides a verified receiving address and deposit instructions. No payment is taken or wallet balance credited by this selector.
            </p>
          </div>
        </div>
      </Card>

      <Link href={returnTo} className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-on">
        Return to savings <Icon name="arrow" size={16} />
      </Link>
    </div>
  );
}
