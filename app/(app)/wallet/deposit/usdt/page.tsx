import Link from 'next/link';
import { TopBar } from '@/components/app/TopBar';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';

export const dynamic = 'force-dynamic';

export default function UsdtDepositStep({ searchParams }: { searchParams: { returnTo?: string } }) {
  const returnTo = searchParams.returnTo?.startsWith('/save/') ? searchParams.returnTo : '/wallet/deposit';

  return (
    <div className="space-y-5">
      <TopBar title="USDT deposit" />
      <header>
        <p className="label">TRON · TRC20</p>
        <h1 className="mt-2 text-2xl font-semibold">USDT deposit setup</h1>
        <p className="mt-2 text-sm text-muted">You selected Tether on the Tron network.</p>
      </header>
      <Card className="border-warm/40">
        <div className="flex gap-2">
          <Icon name="warn" className="shrink-0 text-warm" size={18} />
          <div>
            <p className="text-sm font-semibold">Deposit instructions are the next implementation step</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              No receiving address is configured here yet. Do not send USDT to Firn until the deposit flow displays an assigned, verified TRC20 address and the transfer verification service is live.
            </p>
          </div>
        </div>
      </Card>
      <Link href={returnTo} className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-on">
        Back <Icon name="arrow" size={16} />
      </Link>
    </div>
  );
}
