import Link from 'next/link';
import { TopBar } from '@/components/app/TopBar';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { PaymentMethodSelector } from '@/components/wallet/PaymentMethodSelector';

export const dynamic = 'force-dynamic';

const TRON_ADDRESS_PATTERN = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

export default function DepositPage({ searchParams }: { searchParams: { returnTo?: string; method?: string } }) {
  const returnTo = searchParams.returnTo?.startsWith('/save/') ? searchParams.returnTo : '/wallet';
  const configuredAddress = process.env.DEPOSIT_USDT_TRC20_ADDRESS?.trim() ?? '';
  // Enable the setup screen when a valid receiving wallet exists. All claims remain manual-review only.
  const usdtEnabled = TRON_ADDRESS_PATTERN.test(configuredAddress);

  return (
    <div className="space-y-5">
      <TopBar title="Add money" />
      <header>
        <p className="label">FUND YOUR FIRN WALLET</p>
        <h1 className="mt-2 text-2xl font-semibold">Choose a top-up method</h1>
        <p className="mt-2 text-sm text-muted">USDT on Tron is the supported crypto deposit method. Other payment methods will be enabled as their integrations launch.</p>
      </header>

      <PaymentMethodSelector selectedId={searchParams.method} returnTo={returnTo} usdtEnabled={usdtEnabled} />

      {!usdtEnabled && <Card className="border-warm/40">
        <div className="flex gap-2">
          <Icon name="warn" className="shrink-0 text-warm" size={18} />
          <div>
            <p className="text-sm font-semibold">USDT deposits are not active yet</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              A valid TRON receiving wallet is not configured. Do not send funds until FIRN displays its receiving address and TRC20 instructions.
            </p>
          </div>
        </div>
      </Card>}

      <Link href={returnTo} className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-on">
        Return to savings <Icon name="arrow" size={16} />
      </Link>
    </div>
  );
}
