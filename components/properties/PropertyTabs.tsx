'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import useEmblaCarousel from 'embla-carousel-react';
const tabs=[['Overview',''],['Financials','financials'],['Rent','rent'],['Documents','documents'],['Location','location'],['Updates','updates'],['Valuation','valuation'],['Your share','share']] as const;
export function PropertyTabs({slug}:{slug:string}){
 const pathname=usePathname()??'';
 const active=pathname.endsWith('/'+slug)?'':pathname.split('/').at(-1)??'';
 const [viewportRef]=useEmblaCarousel({align:'start',containScroll:'trimSnaps',dragFree:true});
 return <nav aria-label="Property sections" className="-mx-4 mb-5 overflow-hidden touch-pan-y select-none"><div ref={viewportRef} className="overflow-hidden"><div className="flex gap-2 px-4 pb-1">{tabs.map(([label,path])=><Link draggable={false} key={label} href={path?'/properties/'+slug+'/'+path:'/properties/'+slug} aria-current={active===path?'page':undefined} className={`shrink-0 rounded-full border px-3 py-2 text-[11px] font-medium ${active===path?'border-accent bg-accent/15 text-accent':'border-line bg-card text-muted'}`}>{label}</Link>)}</div></div></nav>;
}
