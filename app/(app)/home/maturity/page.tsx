import { requireUser } from '@/lib/auth';
import { getPortfolio } from '@/lib/data';
import { longDate, usd } from '@/lib/format';
import { EmptySavings } from '@/components/home/EmptySavings';
import { TopBar } from '@/components/app/TopBar';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default async function MaturityPage() {
  await requireUser();
  const portfolio = await getPortfolio();
  if (!portfolio.positions.length) return <div className="space-y-5"><TopBar title="Maturity" backHref="/investments"/><EmptySavings/></div>;
  const positions = [...portfolio.positions].sort((a,b) => a.daysLeft-b.daysLeft);
  return <div className="space-y-5">
    <TopBar title="Maturity timeline" backHref="/investments"/>
    <p className="text-sm leading-6 text-muted">Track when each active investment position reaches its planned maturity date.</p>
    <div className="space-y-3">{positions.map(position=><Card key={position.id} className="relative overflow-hidden">
      <div className="absolute bottom-0 left-0 top-0 w-1 bg-accent"/>
      <div className="flex items-start justify-between gap-3 pl-2">
        <div><p className="text-sm font-semibold">{position.plan==='six'?'Firn Six':'Firn Twelve'}</p><p className="mt-1 text-xs text-muted">Matures {longDate(position.maturesOn)}</p></div>
        <span className="rounded-full bg-card2 px-3 py-1 text-xs font-semibold">{position.daysLeft} days</span>
      </div>
      <div className="mt-4 flex justify-between border-t border-line pt-3 text-xs"><span className="text-muted">Current value</span><strong className="money">{usd(position.value,2)}</strong></div>
    </Card>)}</div>
  </div>;
}
