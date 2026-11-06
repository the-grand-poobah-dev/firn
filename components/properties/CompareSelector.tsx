'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PropertyArt } from '@/components/art/PropertyArt';
import { artKind, artSeed, type PropertyRecord } from '@/lib/property-utils';
import { usd, pct } from '@/lib/format';
const metrics: Array<[string, (property: PropertyRecord) => string]> = [
  ['Type', property => property.kind],
  ['Target', property => pct(property.target_return)],
  ['Occupied', property => pct(property.occupancy)],
  ['Raised', property => usd(property.raised)],
  ['Valuation', property => usd(property.valuation)],
  ['Risk', property => property.occupancy < .85 || property.target_return > .145 ? 'Higher' : property.occupancy >= .95 && property.target_return < .125 ? 'Lower' : 'Medium'],
];
export function CompareSelector({ properties, initial }: { properties: PropertyRecord[]; initial: string[] }) {
  const router=useRouter();
  const [selected,setSelected]=useState(initial.slice(0,3));
  const chosen=selected.map(slug=>properties.find(p=>p.slug===slug)).filter((p):p is PropertyRecord=>Boolean(p));
  const toggle=(slug:string)=>setSelected(current=>current.includes(slug)?current.filter(x=>x!==slug):current.length<3?[...current,slug]:current);
  return <div className="space-y-4"><div className="flex flex-wrap gap-2">{properties.map(p=><button key={p.slug} type="button" onClick={()=>toggle(p.slug)} className={`rounded-full border px-3 py-2 text-[11px] ${selected.includes(p.slug)?'border-accent bg-accent/15 text-accent':'border-line bg-card text-muted'}`}>{selected.includes(p.slug)?'✓ ':''}{p.name}</button>)}</div><p className="text-xs text-muted">Choose up to three properties ({selected.length}/3).</p><button type="button" onClick={()=>router.replace('/properties/compare'+(selected.length?'?slugs='+selected.join(','):''))} className="w-full rounded-full bg-accent py-3 text-sm font-semibold text-accent-on">Update comparison</button>{chosen.length>0&&<div className="overflow-x-auto rounded-2xl border border-line bg-card"><table className="min-w-[520px] w-full text-left text-xs"><thead><tr><th className="p-3 text-muted">Metric</th>{chosen.map(p=><th key={p.slug} className="w-36 p-3"><div className="mb-2 h-16 overflow-hidden rounded-lg"><PropertyArt kind={artKind(p.art,artSeed(p.slug))} seed={artSeed(p.slug)}/></div><span className="font-semibold">{p.name}</span></th>)}</tr></thead><tbody>{metrics.map(([label,render])=><tr key={label} className="border-t border-line"><th className="p-3 font-medium text-muted">{label}</th>{chosen.map(p=><td key={p.slug} className="p-3 font-medium">{render(p)}</td>)}</tr>)}</tbody></table></div>}</div>;
}
