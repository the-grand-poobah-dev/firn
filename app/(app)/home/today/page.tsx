import { requireUser } from '@/lib/auth';
import { getPortfolio } from '@/lib/data';
import { propertyShare } from '@/lib/finance';
import { usd, pct } from '@/lib/format';
import { EmptySavings } from '@/components/home/EmptySavings';
import { TopBar } from '@/components/app/TopBar';
import { Ring } from '@/components/charts/Ring';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default async function TodayPage() {
  await requireUser();
  const portfolio = await getPortfolio();
  if (!portfolio.positions.length) return <div className="space-y-5"><TopBar title="Today" backHref="/home"/><EmptySavings/></div>;
  const now = new Date();
  const seconds = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
  const fraction = seconds / 86400;
  const accrued = portfolio.totals.todayProfit * fraction;
  const shares = propertyShare(portfolio.totals.todayProfit, portfolio.propertyShares.map(item => ({ targetReturn: item.targetReturn })));
  const rows = portfolio.propertyShares.map((property, index) => ({ ...property, profit: shares[index] ?? 0 })).sort((a,b) => b.profit - a.profit);
  return <div className="space-y-5">
    <TopBar title="Today" backHref="/home"/>
    <Card className="flex items-center gap-5 p-5">
      <Ring value={fraction * 100} label={Math.round(fraction * 100) + '%'} size={112}/>
      <div className="min-w-0"><p className="label">ACCRUED SO FAR</p><p className="mt-1 text-2xl font-semibold money">{usd(accrued, 2)}</p><p className="mt-2 text-xs leading-5 text-muted">Estimated from today&apos;s credited profit as the UTC day progresses.</p><p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-accent">Credited at 00:00 UTC</p></div>
    </Card>
    <section className="space-y-3">
      <div><h2 className="text-base font-semibold">Profit by property</h2><p className="mt-1 text-xs text-muted">Daily portfolio profit allocated by each property&apos;s target return.</p></div>
      {rows.length ? rows.map(property => <Card key={property.propertyId} className="flex items-center justify-between gap-3 py-3">
        <div className="min-w-0"><p className="truncate text-sm font-semibold">{property.name}</p><p className="mt-1 text-xs text-muted">{property.city}, {property.country} · {pct(property.targetReturn)}</p></div>
        <strong className="shrink-0 text-sm text-pos money">{usd(property.profit, 2)}</strong>
      </Card>) : <p className="rounded-xl bg-card p-4 text-sm text-muted">Property allocations will appear once your investments are allocated.</p>}
    </section>
    <p className="text-center text-[10px] leading-5 text-muted">Accrued-so-far is an estimate. Actual earnings are credited at 00:00 UTC.</p>
  </div>;
}
