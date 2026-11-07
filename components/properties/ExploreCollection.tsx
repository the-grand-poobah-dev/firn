'use client';
import Link from 'next/link';
import {useState} from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import {PropertyCard} from './PropertyCard';
import type {PropertyRecord} from '@/lib/property-utils';
import {pct,usd} from '@/lib/format';
type Props={properties:PropertyRecord[];countries:string[];activeCountry:string};
const layouts=[{id:'cards',label:'Cards'},{id:'magazine',label:'Magazine'},{id:'magazine2',label:'Magazine 2'},{id:'rich',label:'Rich list'}] as const;
export function ExploreCollection({properties,countries,activeCountry}:Props){
 const [layout,setLayout]=useState<(typeof layouts)[number]['id']>('cards');
 const [railRef]=useEmblaCarousel({align:'start',containScroll:'trimSnaps',dragFree:true});
 return <div className="space-y-5">
  <div ref={railRef} className="-mx-4 overflow-hidden touch-pan-y">
   <div className="flex gap-2 px-4">
    {['All',...countries].map(country=><Link key={country} draggable={false} href={country==='All'?'/properties':`/properties?country=${encodeURIComponent(country)}`} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium ${activeCountry===country?'border-accent bg-accent/15 text-accent':'border-line bg-card2 text-muted'}`}>{country}</Link>)}
   </div>
  </div>
  <div className="flex items-center justify-between gap-3"><div><p className="label">BROWSE STYLE</p><p className="mt-1 text-sm font-semibold">Choose your view</p></div><span className="text-xs text-muted">{properties.length} properties</span></div>
  <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-1">{layouts.map(item=><button key={item.id} type="button" onClick={()=>setLayout(item.id)} aria-pressed={layout===item.id} className={`shrink-0 rounded-full border px-3 py-2 text-xs ${layout===item.id?'border-accent bg-accent/15 text-accent':'border-line bg-card text-muted'}`}>{item.label}</button>)}</div>
  {layout==='cards'&&<div className="grid grid-cols-1 gap-4">{properties.map(p=><PropertyCard key={p.slug} property={p}/>)}</div>}
  {layout==='magazine'&&<div className="grid grid-cols-2 gap-3">{properties.map((p,i)=><div key={p.slug} className={i===0?'col-span-2':''}><PropertyCard property={p}/></div>)}</div>}
  {layout==='magazine2'&&<div className="grid grid-cols-2 gap-3">{properties.map((p,i)=><div key={p.slug} className={i===0?'col-span-2':''}><PropertyCard property={p}/></div>)}</div>}
  {layout==='rich'&&<div className="space-y-3">{properties.map(p=><Link key={p.slug} href={`/properties/${p.slug}`} className="flex gap-3 rounded-2xl border border-line bg-card p-3"><img src={`https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=300&q=75`} alt="" loading="lazy" className="h-24 w-28 shrink-0 rounded-xl object-cover"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{p.name}</p><p className="mt-1 text-xs text-muted">{p.city}, {p.country} · {p.kind}</p><div className="mt-2 flex items-center justify-between gap-2 text-xs"><span className="text-muted">Target APY</span><strong>{pct(p.target_return)}</strong></div><p className="mt-1 text-[11px] text-muted">{usd(p.raised)} raised of {usd(p.target_raise)}</p></div></Link>)}</div>}
 </div>;
}
