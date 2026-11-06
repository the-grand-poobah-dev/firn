import { requireUser } from '@/lib/auth';
import { getPortfolio, getProperties } from '@/lib/data';
import { usd, pct } from '@/lib/format';
import { EmptySavings } from '@/components/home/EmptySavings';
import { TopBar } from '@/components/app/TopBar';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default async function GeographyPage() {
  await requireUser();
  const [portfolio, properties] = await Promise.all([getPortfolio(), getProperties()]);
  if (!portfolio.positions.length) return <div className="space-y-5"><TopBar title="Geography" backHref="/home"/><EmptySavings/></div>;
  const showcase = properties.slice(0, 8);
  const countryCounts = new Map<string,number>();
  for (const property of showcase) countryCounts.set(property.country, (countryCounts.get(property.country) ?? 0) + 1);
  const total = showcase.length || 1;
  const exposure = [...countryCounts.entries()].map(([country,count]) => ({country,share:count/total})).sort((a,b) => b.share-a.share);
  const pins = properties.filter(item => item.lat !== null && item.lng !== null);
  return <div className="space-y-5">
    <TopBar title="Global exposure" backHref="/home"/>
    <section className="space-y-3"><h2 className="text-base font-semibold">Exposure by country</h2>
      {exposure.map(item => <Card key={item.country} className="space-y-2 py-3">
        <div className="flex justify-between text-sm"><strong>{item.country}</strong><span>{pct(item.share)}</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-card2"><div className="h-full rounded-full bg-accent" style={{width:(item.share*100)+'%'}}/></div>
      </Card>)}
      <p className="text-[10px] leading-5 text-muted">Country mix is calculated from the eight featured properties in the live property catalogue.</p>
    </section>
    <Card className="space-y-3">
      <div><h2 className="text-base font-semibold">Properties around the world</h2><p className="mt-1 text-xs text-muted">{pins.length} properties with location data</p></div>
      <svg viewBox="0 0 1000 500" role="img" aria-label="Map showing all property locations" className="w-full rounded-xl bg-card2/70">
        <path d="M65 130 105 85 190 65 245 98 275 150 240 190 220 255 165 270 125 220 85 205ZM300 250 355 275 385 340 365 430 330 405 315 335ZM455 110 510 75 580 90 625 135 680 120 720 155 785 145 850 185 905 235 875 280 820 270 790 315 735 305 690 345 645 325 605 270 550 255 515 205 470 190ZM760 350 810 330 850 350 845 390 800 410 770 390Z" fill="currentColor" opacity=".10" stroke="currentColor" strokeOpacity=".18" strokeWidth="2"/>
        {pins.map(item => <g key={item.id}><circle cx={(Number(item.lng) + 180) / 360 * 1000} cy={(90 - Number(item.lat)) / 180 * 500} r="9" fill="var(--accent)" opacity=".2"/><circle cx={(Number(item.lng) + 180) / 360 * 1000} cy={(90 - Number(item.lat)) / 180 * 500} r="3.5" fill="var(--accent)" stroke="var(--bg)" strokeWidth="2"><title>{item.name}</title></circle></g>)}
      </svg>
      <p className="text-[10px] leading-5 text-muted">Pins use the latitude and longitude recorded for each property.</p>
    </Card>
  </div>;
}
