import { requireUser } from '@/lib/auth';
import { getPortfolio, getProperties } from '@/lib/data';
import { usd, pct } from '@/lib/format';
import { EmptySavings } from '@/components/home/EmptySavings';
import { PortfolioDonut } from '@/components/home/PortfolioDonut';
import { TopBar } from '@/components/app/TopBar';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default async function PortfolioPage() {
  await requireUser();
  const [portfolio, properties] = await Promise.all([getPortfolio(), getProperties()]);
  if (!portfolio.positions.length) return <div className="space-y-5"><TopBar title="Portfolio" backHref="/home"/><EmptySavings/></div>;
  const allocated = [...portfolio.propertyShares].sort((a,b) => b.amount - a.amount);
  const allocatedIds = new Set(allocated.map(item => item.propertyId));
  const remaining = properties.filter(item => !allocatedIds.has(item.id));
  return <div className="space-y-5">
    <TopBar title="Portfolio" backHref="/home"/>
    <Card className="py-5 text-center">
      <PortfolioDonut/>
      <p className="mt-3 text-xs text-muted">Each savings deposit is spread across 10 randomly selected active properties.</p>
      <p className="mt-1 text-[10px] text-muted">The ring represents the 88-property portfolio universe.</p>
    </Card>
    <section className="space-y-3">
      <div><h2 className="text-base font-semibold">Your property allocation</h2><p className="mt-1 text-xs text-muted">Properties receiving your active savings are listed first.</p></div>
      {allocated.map((property,index) => <Card key={property.propertyId} className="flex items-center justify-between gap-3 py-3">
        <div className="flex min-w-0 items-center gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-card2 text-xs font-semibold text-accent">{index + 1}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{property.name}</p><p className="mt-1 text-xs text-muted">{property.city}, {property.country} · {pct(property.targetReturn)}</p></div></div>
        <strong className="shrink-0 text-sm money">{usd(property.amount, 2)}</strong>
      </Card>)}
      {remaining.map(property => <Card key={property.id} className="flex items-center justify-between gap-3 py-3 opacity-65">
        <div className="min-w-0"><p className="truncate text-sm font-medium">{property.name}</p><p className="mt-1 text-xs text-muted">{property.city}, {property.country}</p></div>
        <span className="text-xs text-muted">$0.00</span>
      </Card>)}
    </section>
  </div>;
}
