import { TopBar } from '@/components/app/TopBar';
import { Card } from '@/components/ui/Card';

export default function WithdrawPage() {
  return (
    <div className="space-y-5">
      <TopBar title="Withdraw" backHref="/wallet" />
      <header>
        <p className="label">MOVE MONEY OUT</p>
        <h1 className="mt-2 text-2xl font-semibold">Withdraw funds</h1>
        <p className="mt-2 text-sm text-muted">Payouts are not available yet.</p>
      </header>
      <Card className="border-warm/40">
        <p className="text-sm font-semibold">Withdrawals are temporarily unavailable</p>
        <p className="mt-2 text-xs leading-5 text-muted">
          FIRN has not connected a real payout provider. No withdrawal request can be submitted and no money will be moved. Your available wallet balance remains unchanged.
        </p>
      </Card>
    </div>
  );
}
