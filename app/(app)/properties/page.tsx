import Link from 'next/link';
import {TopBar} from '@/components/app/TopBar';
import {PropertyDeck} from '@/components/properties/PropertyDeck';
import {ExploreCollection} from '@/components/properties/ExploreCollection';
import {getProperties} from '@/lib/properties';
import type {PropertyRecord} from '@/lib/property-utils';
import {Icon} from '@/components/ui/Icon';
type Search=Record<string,string|string[]|undefined>;
const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
function filterRows(rows:PropertyRecord[],query:Search){
 const country=first(query.country),kind=first(query.kind),min=first(query.minReturn),max=first(query.maxReturn),status=first(query.status);
 return rows.filter(p=>{
  const countryOk=!country||country==='All'||(country==='Dubai'?p.country==='UAE':country==='Swiss'?p.country==='Switzerland':p.country===country);
  const kindOk=!kind||kind==='All'||p.kind.toLowerCase().includes(kind.toLowerCase());
  const minOk=!min||p.target_return>=Number(min)/100;
  const maxOk=!max||p.target_return<=Number(max)/100;
  const statusOk=!status||(status==='funding'?p.raised<p.target_raise:p.raised>=p.target_raise);
  return countryOk&&kindOk&&minOk&&maxOk&&statusOk;
 });
}
export default async function PropertiesPage({searchParams}:{searchParams:Promise<Search>}){
 const query=await searchParams;const all=await getProperties();const rows=filterRows(all,query);
 const chips=['All',...Array.from(new Set(all.map(p=>p.country))).sort((a,b)=>a.localeCompare(b))];
 const active=first(query.country)??'All';const featured=rows.slice(0,8);
 return <div className="space-y-6">
  <TopBar title="Explore" right={<div className="flex items-center gap-2"><Link href="/home/search" aria-label="Search properties" className="grid size-9 place-items-center rounded-full border border-line bg-card"><Icon name="search" size={17}/></Link><Link href="/home/calculator" aria-label="Investment calculator" className="grid size-9 place-items-center rounded-full border border-line bg-card"><Icon name="chart" size={17}/></Link><Link href="/properties/filters" className="rounded-full border border-line bg-card px-3 py-2 text-xs">Filters</Link></div>}/>
  <section><div className="mb-3 flex items-end justify-between"><div><p className="label">THE FIRN COLLECTION</p><h2 className="mt-1 text-lg font-semibold">Explore properties</h2></div><span className="text-xs text-muted">{rows.length} assets</span></div><ExploreCollection properties={rows} countries={chips.slice(1)} activeCountry={active}/></section>
  <section><div className="mb-3 flex items-end justify-between"><div><p className="label">COMMUNITY PICKS</p><h2 className="mt-1 text-lg font-semibold">Trending this week</h2></div><Link href="/properties/compare" className="text-xs text-accent">Compare</Link></div>{featured.length?<PropertyDeck properties={featured}/>:null}</section>
  <div className="grid grid-cols-2 gap-3"><Link href="/properties/compare" className="rounded-2xl border border-line bg-card p-4"><p className="text-sm font-semibold">Compare properties</p><p className="mt-1 text-xs text-muted">Side-by-side view</p></Link><Link href="/properties/capital" className="rounded-2xl border border-line bg-card p-4"><p className="text-sm font-semibold">Capital raised</p><p className="mt-1 text-xs text-muted">Portfolio funding progress</p></Link></div>
  <p className="text-[10px] leading-relaxed text-muted">Target returns and property information are illustrative, not guarantees or an offer to invest. Property values may fall and capital may be affected.</p>
 </div>;
}
