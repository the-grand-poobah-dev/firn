import { TopBar } from '@/components/app/TopBar';
import { DepositForm } from '@/components/wallet/DepositForm';

export const dynamic = 'force-dynamic';

export default function DepositPage() {
  const usdtEnabled = process.env.USDT_DEPOSITS_ENABLED === 'true'
    && Boolean(process.env.DEPOSIT_USDT_TRC20_ADDRESS?.trim())
    && Boolean(process.env.TRONGRID_API_KEY?.trim());
  return (
    <div className="space-y-5">
      <TopBar title="Add money" backHref="/wallet" />
      <header>
        <p className="label">FUND YOUR WALLET</p>
        <h1 className="mt-2 text-2xl font-semibold">Add to your FIRN wallet</h1>
        <p className="mt-2 text-sm text-muted">USDT on TRON is the only payment route being prepared. Other methods are disabled until their integrations launch.</p>
      </header>
      <DepositForm usdtEnabled={usdtEnabled} />
    </div>
  );
}
