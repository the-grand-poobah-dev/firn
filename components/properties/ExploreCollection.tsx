'use client';
import Link from 'next/link';
import {useState} from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import {propertyPhoto} from '@/lib/property-display';
import type {PropertyRecord} from '@/lib/property-utils';
import {pct,usd} from '@/lib/format';
import {Progress} from '@/components/ui/Progress';
import {Icon,type IconName} from '@/components/ui/Icon';
type Props={properties:PropertyRecord[];countries:string[];activeCountry:string};
const layouts:{id:'cards'|'magazine'|'magazine2'|'rich';icon:IconName;hint:string}[]=[{id:'cards',icon:'gallery',hint:'Large cards'},{id:'magazine',icon:'building',hint:'Editorial feature'},{id:'magazine2',icon:'grid',hint:'Compact grid'},{id:'rich',icon:'rows',hint:'Detailed list'}];
function Tile({property,compact=false}:{property:PropertyRecord;compact?:boolean}){
 const raised=property.target_raise>0?property.raised/property.target_raise*100:0;
 return <Link href={`/properties/${property.slug}`} className="block min-w-0 overflow-hidden rounded-[22px] border border-line bg-card active:scale-[.99]">
  <div className={`relative overflow-hidden ${compact?'h-32':'h-44'}`}><img src={propertyPhoto(property,720)} alt={`${property.name}, ${property.city}`} loading="lazy" className="h-full w-full object-cover"/><span className="absolute left-3 top-3 rounded-full bg-black/45 px-3 py-1 text-[10px] text-white backdrop-blur">{property.country}</span><span className="absolute bottom-3 right-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] text-white backdrop-blur">{pct(property.target_return)} target APY</span></div>
  <div className={`space-y-2 ${compact?'p-3':'p-4'}`}><h3 className="truncate text-sm font-semibold">{property.name}</h3><p className="text-xs text-muted">{property.city} · {property.kind}</p><div className="flex items-center justify-between text-xs"><span className="text-muted">Capital raised</span><strong>{usd(property.raised)}</strong></div><Progress value={raised} label={`${Math.round(raised)}% funded of ${usd(property.target_raise)}`}/></div>
 </Link>;
}
export function ExploreCollection({properties,countries,activeCountry}:Props){
 const [layout,setLayout]=useState<(typeof layouts)[number]['id']>('cards');
 const [railRef]=useEmblaCarousel({align:'start',containScroll:'trimSnaps',dragFree:true});
 return <div className="space-y-5">
  <div ref={railRef} className="-mx-4 overflow-hidden touch-pan-y select-none"><div className="flex gap-2 px-4">{['All',...countries].map(country=><Link key={country} draggable={false} href={country==='All'?'/properties':`/properties?country=${encodeURIComponent(country)}`} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium ${activeCountry===country?'border-accent bg-accent/15 text-accent':'border-line bg-card2 text-muted'}`}>{country}</Link>)}</div></div>
  <div className="flex items-center justify-between gap-3"><div><p className="label">EXPLORE COLLECTION</p><p className="mt-1 text-sm font-semibold">Find your next investment</p></div><span className="text-xs text-muted">{properties.length} properties</span></div>
  <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-1" role="group" aria-label="Property display style">{layouts.map(item=><button key={item.id} type="button" onClick={()=>setLayout(item.id)} aria-label={item.hint} title={item.hint} aria-pressed={layout===item.id} className={`grid size-10 shrink-0 place-items-center rounded-xl border ${layout===item.id?'border-accent bg-accent/15 text-accent':'border-line bg-card text-muted'}`}><Icon name={item.icon} size={18}/></button>)}</div>
  {layout==='cards'&&<div className="grid grid-cols-1 gap-4">{properties.map(p=><Tile key={p.slug} property={p}/>)}</div>}
  {layout==='magazine'&&<div className="space-y-4">{properties.map(p=><Link key={p.slug} href={`/properties/${p.slug}`} className="group relative block h-56 overflow-hidden rounded-[24px] border border-line bg-card"><img src={propertyPhoto(p,900)} alt={`${p.name}, ${p.city}`} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"/><div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent"/><div className="absolute inset-x-0 bottom-0 p-4 text-white"><p className="text-[10px] uppercase tracking-widest text-white/75">{p.country} · {p.kind}</p><h3 className="mt-1 text-lg font-semibold">{p.name}</h3><p className="mt-1 text-xs text-white/80">{p.city} · {pct(p.target_return)} target APY</p></div></Link>)}</div>}
  {layout==='magazine2'&&<div className="grid grid-cols-2 gap-3">{properties.map(p=><Link key={p.slug} href={`/properties/${p.slug}`} className="min-w-0 overflow-hidden rounded-[20px] border border-line bg-card"><img src={propertyPhoto(p,500)} alt={`${p.name}, ${p.city}`} loading="lazy" className="h-28 w-full object-cover"/><div className="space-y-1 p-3"><h3 className="truncate text-xs font-semibold">{p.name}</h3><p className="truncate text-[10px] text-muted">{p.city}</p><p className="text-xs font-semibold text-accent">{pct(p.target_return)} APY</p></div></Link>)}</div>}
  {layout==='rich'&&<div className="space-y-3">{properties.map(p=><Link key={p.slug} href={`/properties/${p.slug}`} className="flex gap-3 rounded-2xl border border-line bg-card p-3"><img src={propertyPhoto(p,300)} alt={`${p.name}, ${p.city}`} loading="lazy" className="h-24 w-28 shrink-0 rounded-xl object-cover"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{p.name}</p><p className="mt-1 text-xs text-muted">{p.city}, {p.country} · {p.kind}</p><div className="mt-2 flex items-center justify-between gap-2 text-xs"><span className="text-muted">Target APY</span><strong>{pct(p.target_return)}</strong></div><p className="mt-1 text-[11px] text-muted">{usd(p.raised)} raised of {usd(p.target_raise)}</p></div></Link>)}</div>}
 </div>;
}
