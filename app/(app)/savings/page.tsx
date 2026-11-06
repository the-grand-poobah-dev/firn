import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { getPortfolio } from '@/lib/data';
import { PositionDeck } from '@/components/home/PositionDeck';
import { EmptySavings } from '@/components/home/EmptySavings';
import { TopBar } from '@/components/app/TopBar';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';

export const dynamic = 'force-dynamic';

export default async function SavingsPage() {
  await requireUser();
  const portfolio = await getPortfolio();
  return <div className="space-y-5">
    <TopBar title="Your savings"/>
    {portfolio.positions.length ? <>
      <div className="flex items-center justify-between"><div><p className="label">ACTIVE POSITIONS</p><p className="mt-1 text-2xl font-semibold">{portfolio.positions.length}</p></div><Link href="/save" className="rounded-full bg-accent px-4 py-2.5 text-xs font-semibold text-accent-on">+ Save more</Link></div>
      <PositionDeck positions={portfolio.positions} variant="full"/>
      <div className="grid grid-cols-2 gap-3">
        <Link href="/home/maturity"><Card className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-card2 text-accent"><Icon name="calendar"/></span><span><strong className="block text-sm">Maturity</strong><small className="text-muted">Track your timeline</small></span></Card></Link>
        <Link href="/analytics"><Card className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-card2 text-accent"><Icon name="doc"/></span><span><strong className="block text-sm">Statement</strong><small className="text-muted">View your activity</small></span></Card></Link>
      </div>
    </> : <EmptySavings/>}
    <p className="text-center text-[10px] leading-5 text-muted">Returns are targets, not guarantees. Capital can be lost.</p>
  </div>;
}
