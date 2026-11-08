import Link from 'next/link';
import { TopBar } from '@/components/app/TopBar';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { PaymentMethodSelector } from '@/components/wallet/PaymentMethodSelector';

export const dynamic = 'force-dynamic';

export default function DepositPage({ searchParams }: { searchParams: { returnTo?: string; method?: string } }) {
  const returnTo = searchParams.returnTo?.startsWith('/save/') ? searchParams.returnTo : '/wallet';

  return (
    <div className="space-y-5">
      <TopBar title="Add money" />
      <header>
        <p className="label">FUND YOUR FIRN WALLET</p>
        <h1 className="mt-2 text-2xl font-semibold">Choose a top-up method</h1>
        <p className="mt-2 text-sm text-muted">USDT on Tron is currently available. Other payment methods will be enabled as their integrations launch.</p>
      </header>

      <PaymentMethodSelector selectedId={searchParams.method} returnTo={returnTo} />

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
