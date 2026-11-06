import Link from 'next/link';
import { TopBar } from '@/components/app/TopBar';
import { PropertyDeck } from '@/components/properties/PropertyDeck';
import { getProperties, type PropertyRecord } from '@/lib/properties';
function filterRows(rows:PropertyRecord[],query:Record<string,string|undefined>) {
  return rows.filter(p=>{
    const country=query.country;
    const countryOk=!country||country==='All'||(country==='Dubai'?p.country==='UAE':country==='Swiss'?p.country==='Switzerland':p.country===country);
    const kindOk=!query.kind||query.kind==='All'||p.kind.toLowerCase().includes(query.kind.toLowerCase());
    const minOk=!query.minReturn||p.target_return>=Number(query.minReturn)/100;
    const maxOk=!query.maxReturn||p.target_return<=Number(query.maxReturn)/100;
    const statusOk=!query.status||(query.status==='funding'?p.raised<p.target_raise:p.raised>=p.target_raise);
    return countryOk&&kindOk&&minOk&&maxOk&&statusOk;
  });
}
export default async function PropertiesPage({searchParams}:{searchParams:Record<string,string|undefined>}) {
  const all=await getProperties();
  const rows=filterRows(all,searchParams);
  const chips=['All','Dubai','Italy','Spain','Portugal','Swiss'];
  const active=searchParams.country??'All';
  const featured=rows.slice(0,8);
  return <div className="space-y-6"><TopBar title="Explore" right={<Link href="/properties/filters" className="rounded-full border border-line bg-card px-3 py-2 text-xs">Filters</Link>}/><div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">{chips.map(chip=><Link key={chip} href={chip==='All'?'/properties':`/properties?country=${encodeURIComponent(chip)}`}><span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-medium ${active===chip?'border-accent bg-accent/15 text-accent':'border-line bg-card2 text-muted'}`}>{chip}</span></Link>)}</div><section><div className="mb-3 flex items-end justify-between"><div><p className="label">THE FIRN COLLECTION</p><h2 className="mt-1 text-lg font-semibold">Explore properties</h2></div><span className="text-xs text-muted">{rows.length} assets</span></div>{rows.length?<PropertyDeck properties={rows}/>:<div className="rounded-2xl border border-line bg-card p-6 text-center text-sm text-muted">No properties match those filters.</div>}</section><section><div className="mb-3 flex items-end justify-between"><div><p className="label">COMMUNITY PICKS</p><h2 className="mt-1 text-lg font-semibold">Trending this week</h2></div><Link href="/properties/compare" className="text-xs text-accent">Compare</Link></div>{featured.length?<PropertyDeck properties={featured}/>:null}</section><div className="grid grid-cols-2 gap-3"><Link href="/properties/compare" className="rounded-2xl border border-line bg-card p-4"><p className="text-sm font-semibold">Compare properties</p><p className="mt-1 text-xs text-muted">Side-by-side view</p></Link><Link href="/properties/capital" className="rounded-2xl border border-line bg-card p-4"><p className="text-sm font-semibold">Capital raised</p><p className="mt-1 text-xs text-muted">Portfolio funding progress</p></Link></div><p className="text-[10px] leading-relaxed text-muted">Target returns and property information are illustrative, not guarantees or an offer to invest. Property values may fall and capital is at risk.</p></div>;
}
