'use client';
import Link from 'next/link';
import { useRef } from 'react';
import { articles, featured } from '@/content/learn/articles';
import { PropertyArt } from '@/components/art/PropertyArt';
import { Card } from '@/components/ui/Card';
export function LearnHome(){
 const rail=useRef<HTMLDivElement>(null); const drag=useRef({active:false,startX:0,scrollLeft:0,moved:false});
 function down(e:React.MouseEvent<HTMLDivElement>){if(e.button!==0||!rail.current)return;drag.current={active:true,startX:e.pageX,scrollLeft:rail.current.scrollLeft,moved:false};}
 function move(e:React.MouseEvent<HTMLDivElement>){if(!drag.current.active||!rail.current)return;const delta=e.pageX-drag.current.startX;if(Math.abs(delta)>4)drag.current.moved=true;rail.current.scrollLeft=drag.current.scrollLeft-delta;}
 function up(){drag.current.active=false;}
 return <div className="space-y-6"><div><p className="text-sm text-muted">Learn at your pace</p><h2 className="text-xl font-semibold">Featured reads</h2><p className="mt-1 text-xs text-muted">Swipe, scroll or drag to explore</p></div><div ref={rail} onMouseDown={down} onMouseMove={move} onMouseUp={up} onMouseLeave={up} className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none px-4 pb-2">{featured.map(a=><Link key={a.slug} href={'/learn/'+a.slug} onClick={e=>{if(drag.current.moved)e.preventDefault();drag.current.moved=false;}} className="w-[82%] shrink-0 snap-center overflow-hidden rounded-2xl border border-line bg-card"><div className="h-36"><PropertyArt kind={a.art}/></div><div className="p-4"><p className="text-xs text-muted">{a.category} · 3 min read</p><h3 className="mt-2 font-semibold">{a.title}</h3><p className="mt-1 text-sm text-muted">{a.summary}</p></div></Link>)}</div><Card><h2 className="mb-3 font-semibold">The basics</h2><div className="divide-y divide-line">{articles.map(a=><Link key={a.slug} href={'/learn/'+a.slug} className="flex items-center justify-between gap-3 py-3"><div><p className="text-xs text-muted">{a.category}</p><strong className="text-sm">{a.title}</strong></div><span aria-hidden="true">→</span></Link>)}</div></Card></div>
}