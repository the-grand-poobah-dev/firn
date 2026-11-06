import { requireUser } from '@/lib/auth';
import { getPortfolio } from '@/lib/data';
import { usd, pct, shortDate } from '@/lib/format';
import { TopBar } from '@/components/app/TopBar';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  await requireUser();
  const portfolio = await getPortfolio();
  const rows = portfolio.last30Days.slice(-7);
  return (
    <div className="space-y-5">
      <TopBar title="Analytics" />
      <header>
        <p className="label">YOUR SAVINGS SNAPSHOT</p>
        <h2 className="mt-1 text-2xl font-semibold">Portfolio overview</h2>
        <p className="mt-1 text-xs text-muted">Historical account figures from your savings records.</p>
      </header>
      <div className="grid grid-cols-2 gap-3">
        <Card><p className="label">TOTAL VALUE</p><p className="mt-2 text-xl font-semibold money">{usd(portfolio.totals.value, 2)}</p></Card>
        <Card><p className="label">PRINCIPAL</p><p className="mt-2 text-xl font-semibold money">{usd(portfolio.totals.principal, 2)}</p></Card>
        <Card><p className="label">EARNED TO DATE</p><p className="mt-2 text-xl font-semibold text-pos money">{usd(portfolio.totals.earned, 2)}</p></Card>
        <Card><p className="label">BLENDED TARGET APY</p><p className="mt-2 text-xl font-semibold">{pct(portfolio.totals.blendedApy, 2)}</p></Card>
      </div>
      <section className="space-y-3">
        <div><p className="label">RECENT HISTORY</p><h2 className="mt-1 text-base font-semibold">Daily earnings · last 7 recorded days</h2></div>
        {rows.length ? (
          <Card className="space-y-3">
            {rows.map(row => (
              <div key={row.date} className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted">{shortDate(row.date)}</span>
                <span className="text-sm font-semibold tabular-nums">{usd(row.profit, 2)}</span>
              </div>
            ))}
          </Card>
        ) : (
          <Card><p className="text-sm text-muted">Daily history will appear after interest is recorded.</p></Card>
        )}
      </section>
      <section className="space-y-3">
        <div><p className="label">POSITION MIX</p><h2 className="mt-1 text-base font-semibold">By savings plan</h2></div>
        <Card className="space-y-3">
          {(['six', 'twelve'] as const).map(plan => {
            const positions = portfolio.positions.filter(position => position.plan === plan);
            const principal = positions.reduce((sum, position) => sum + position.principal, 0);
            return (
              <div key={plan} className="flex items-center justify-between gap-3">
                <div><p className="text-sm font-medium">Firn {plan === 'six' ? 'Six' : 'Twelve'}</p><p className="text-[11px] text-muted">{positions.length} positions</p></div>
                <p className="text-sm font-semibold tabular-nums">{usd(principal, 2)}</p>
              </div>
            );
          })}
        </Card>
      </section>
      <p className="text-center text-[10px] leading-5 text-muted">Illustrative analytics only. Target returns are not guarantees and capital can be lost.</p>
    </div>
  );
}
