import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { getPortfolio, getProperties } from '@/lib/data';
import { usd, pct } from '@/lib/format';
import { isCurrency } from '@/lib/fx';
import { FloatingCard } from '@/components/cards/FloatingCard';
import { Sparkline } from '@/components/charts/Sparkline';
import { PositionDeck } from '@/components/home/PositionDeck';
import { EmptySavings } from '@/components/home/EmptySavings';
import { HomeHeader } from '@/components/home/HomeHeader';
import { PropertyTile } from '@/components/home/PropertyTile';
import { CountUp } from '@/components/home/CountUp';
import { Icon } from '@/components/ui/Icon';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { supabase, user } = await requireUser();
  const [{ data: profile }, portfolio, properties, { count: unread }] = await Promise.all([
    supabase.from('profiles').select('full_name, kyc_status, prefs, currency').eq('id', user.id).maybeSingle(),
    getPortfolio(),
    getProperties(),
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false),
  ]);
  if (!profile) redirect('/profile');
  if (profile.kyc_status !== 'verified') {
    const prefs = (profile.prefs ?? {}) as Record<string, unknown>;
    redirect(profile.kyc_status === 'in_review' || prefs.onboarding_profile_complete === true ? '/kyc' : '/profile');
  }
  const name = profile.full_name?.trim() || user.email?.split('@')[0] || 'Investor';
  const currency = isCurrency(profile.currency) ? profile.currency : 'USD';
  const prefs = (profile.prefs ?? {}) as Record<string, unknown>;
  const avatarUrl = typeof prefs.avatar_url === 'string' ? prefs.avatar_url : null;
  const hasInvestments = portfolio.positions.length > 0;
  const todayRate = portfolio.totals.value > 0 ? portfolio.totals.todayProfit / portfolio.totals.value : 0;
  const spark = portfolio.cumulativeValueSeries.map(point => point.value);
  return <div className="space-y-6">
    <HomeHeader name={name} unread={(unread ?? 0) > 0} avatarUrl={avatarUrl} userId={user.id}/>
    {hasInvestments ? <>
      <FloatingCard className="p-4">
        <div className="flex items-start justify-between">
          <div><p className="label">TOTAL INVESTMENT VALUE</p><p className="mt-2 text-[34px] font-semibold tracking-tight money"><CountUp value={portfolio.totals.value} format={n => usd(n, 2, currency)}/></p></div>
          <Link href="/home/portfolio" className="grid size-9 place-items-center rounded-full bg-card2 text-accent" aria-label="View portfolio"><Icon name="arrow" size={18}/></Link>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="font-semibold text-pos money">+{usd(portfolio.totals.todayProfit, 2, currency)} today</span>
          <span className="rounded-full bg-pos/10 px-2 py-1 text-pos">{pct(todayRate, 2)}</span>
        </div>
        <div className="mt-4 h-12">{spark.length > 1 ? <Sparkline data={spark} className="h-12 w-full"/> : <div className="h-full rounded-xl bg-card2/60"/>}</div>
        <div className="mt-4 grid grid-cols-3 divide-x divide-line border-t border-line pt-4">
          <div className="pr-2"><p className="label">PRINCIPAL</p><p className="mt-1 text-sm font-semibold money"><CountUp value={portfolio.totals.principal} format={n => usd(n, 0, currency)}/></p></div>
          <div className="px-3"><p className="label">EARNED</p><p className="mt-1 text-sm font-semibold text-pos money"><CountUp value={portfolio.totals.earned} format={n => usd(n, 2, currency)}/></p></div>
          <div className="pl-3"><p className="label">BLENDED APY</p><p className="mt-1 text-sm font-semibold">{pct(portfolio.totals.blendedApy)}</p></div>
        </div>
      </FloatingCard>
      <section className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="text-base font-semibold">Your investments</h2><Link href="/investments" className="text-xs font-semibold text-accent">See all</Link></div>
        <PositionDeck positions={portfolio.positions} currency={currency}/>
      </section>
      <section className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="text-base font-semibold">Where it works</h2><Link href="/properties" className="text-xs font-semibold text-accent">Explore all</Link></div>
        <div className="grid grid-cols-2 gap-3">{properties.slice(0, 2).map(property => <PropertyTile key={property.id} property={property}/>)}</div>
      </section>
    </> : <EmptySavings/>}
    <section className="space-y-3">
      <div className="flex items-center justify-between"><h2 className="text-base font-semibold">Portfolio insights</h2><Link href="/home/calculator" className="text-xs font-semibold text-accent">Investment calculator →</Link></div>
      <div className="grid grid-cols-3 gap-2">
        <Link href="/home/today" className="rounded-2xl border border-line bg-card p-3 text-center"><Icon name="sun" size={18} className="mx-auto text-accent"/><span className="mt-2 block text-xs font-semibold">Today</span></Link>
        <Link href="/home/portfolio" className="rounded-2xl border border-line bg-card p-3 text-center"><Icon name="chart" size={18} className="mx-auto text-accent"/><span className="mt-2 block text-xs font-semibold">Portfolio</span></Link>
        <Link href="/home/geography" className="rounded-2xl border border-line bg-card p-3 text-center"><Icon name="globe" size={18} className="mx-auto text-accent"/><span className="mt-2 block text-xs font-semibold">Geography</span></Link>
      </div>
    </section>
    <section className="space-y-3"><h2 className="text-base font-semibold">More from FIRN</h2><div className="grid grid-cols-3 gap-2"><Link href="/tools" className="rounded-2xl border border-line bg-card p-3 text-center text-xs font-semibold">Tools</Link><Link href="/learn" className="rounded-2xl border border-line bg-card p-3 text-center text-xs font-semibold">Learn</Link><Link href="/settings" className="rounded-2xl border border-line bg-card p-3 text-center text-xs font-semibold">Settings</Link></div></section>
    <p className="pb-2 text-center text-[10px] leading-5 text-muted">Returns are targets, not guarantees. Capital can be lost. Property information is illustrative and not financial advice.</p>
  </div>;
}
