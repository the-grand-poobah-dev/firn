import { requireUser } from '@/lib/auth';
import { getPortfolio } from '@/lib/data';
import { usd, pct } from '@/lib/format';
import { EmptySavings } from '@/components/home/EmptySavings';
import { TopBar } from '@/components/app/TopBar';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default async function GeographyPage() {
  await requireUser();
  const portfolio = await getPortfolio();
  if (!portfolio.positions.length) return <div className="space-y-5"><TopBar title="Geography" backHref="/home"/><EmptySavings/></div>;
  const total = portfolio.propertyShares.reduce((sum,item) => sum + item.amount, 0) || 1;
  const countries = new Map<string,number>();
  for (const item of portfolio.propertyShares) countries.set(item.country, (countries.get(item.country) ?? 0) + item.amount);
  const exposure = [...countries.entries()].map(([country,amount]) => ({country,amount,share:amount/total})).sort((a,b) => b.amount-a.amount);
  const pins = portfolio.propertyShares.filter(item => item.lat !== null && item.lng !== null);
  return <div className="space-y-5">
    <TopBar title="Global exposure" backHref="/home"/>
    <section className="space-y-3"><h2 className="text-base font-semibold">Exposure by country</h2>
      {exposure.map(item => <Card key={item.country} className="space-y-2 py-3">
        <div className="flex justify-between text-sm"><strong>{item.country}</strong><span className="money">{pct(item.share)} · {usd(item.amount,0)}</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-card2"><div className="h-full rounded-full bg-accent" style={{width:(item.share*100)+'%'}}/></div>
      </Card>)}
    </section>
    <Card className="space-y-3">
      <div><h2 className="text-base font-semibold">Your properties around the world</h2><p className="mt-1 text-xs text-muted">{pins.length} allocated properties with location data</p></div>
      <svg viewBox="0 0 1000 500" role="img" aria-label="Map showing locations of your allocated properties" className="w-full rounded-xl bg-card2/70">
        <path d="M65 130 105 85 190 65 245 98 275 150 240 190 220 255 165 270 125 220 85 205ZM300 250 355 275 385 340 365 430 330 405 315 335ZM455 110 510 75 580 90 625 135 680 120 720 155 785 145 850 185 905 235 875 280 820 270 790 315 735 305 690 345 645 325 605 270 550 255 515 205 470 190ZM760 350 810 330 850 350 845 390 800 410 770 390Z" fill="currentColor" opacity=".10" stroke="currentColor" strokeOpacity=".18" strokeWidth="2"/>
        {pins.map((item,index) => <g key={item.propertyId}><circle cx={(item.lng! + 180) / 360 * 1000} cy={(90 - item.lat!) / 180 * 500} r="10" fill="var(--accent)" opacity=".2"/><circle cx={(item.lng! + 180) / 360 * 1000} cy={(90 - item.lat!) / 180 * 500} r="4" fill="var(--accent)" stroke="var(--bg)" strokeWidth="2"><title>{item.name}</title></circle></g>)}
      </svg>
      <p className="text-[10px] leading-5 text-muted">Map pins reflect the location coordinates recorded for properties in your active allocation.</p>
    </Card>
  </div>;
}
