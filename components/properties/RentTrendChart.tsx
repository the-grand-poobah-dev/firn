'use client';
import {useMemo,useState} from 'react';
import {usd} from '@/lib/format';
import type {HistoryPoint} from '@/lib/properties';
export function RentTrendChart({history}:{history:HistoryPoint[]}){
 const [period,setPeriod]=useState<'6M'|'12M'|'All'>('All');
 const [active,setActive]=useState<number|null>(null);
 const points=useMemo(()=>{const sorted=[...history].sort((a,b)=>a.d.localeCompare(b.d));return period==='6M'?sorted.slice(-6):period==='12M'?sorted.slice(-12):sorted;},[history,period]);
 const values=points.map(p=>p.v*1_000_000);const max=Math.max(...values,1),min=Math.min(...values,0),range=max-min||1;
 const coords=values.map((v,i)=>({x:points.length<2?50:i/(points.length-1)*100,y:94-(v-min)/range*78,v,label:points[i].d}));
 const line=coords.map(p=>`${p.x},${p.y}`).join(' ');
 const selected=active===null?coords.at(-1):coords[active];
 const rangeLabel=period==='6M'?'Last 6 months':period==='12M'?'Last 12 months':'All recorded history';
 return <div>
  <div className="mb-3 flex items-center justify-between gap-2"><div><p className="text-sm font-semibold">Rental income trend</p><p className="mt-1 text-xs text-muted">Select a point to inspect reported monthly rent</p></div><div className="flex rounded-full bg-card2 p-1">{(['6M','12M','All'] as const).map(p=><button key={p} type="button" onClick={()=>{setPeriod(p);setActive(null)}} aria-pressed={period===p} className={`rounded-full px-2.5 py-1.5 text-[10px] ${period===p?'bg-card text-fg':'text-muted'}`}>{p}</button>)}</div></div>
  <div className="rounded-xl bg-card2/60 p-2"><p className="mb-2 text-[10px] text-muted">{rangeLabel} · {points.length} recorded monthly points</p>
   <div className="mb-2 flex items-baseline justify-between"><span className="text-xs text-muted">{selected?.label??'No rent history'}</span><span className="text-lg font-semibold tabular">{usd(selected?.v??0)}</span></div>
   <svg viewBox="0 0 100 100" className="h-40 w-full overflow-visible" role="group" aria-label="Interactive monthly rental income chart">
    {[20,45,70,95].map(y=><line key={y} x1="0" x2="100" y1={y} y2={y} stroke="currentColor" opacity=".09" strokeDasharray="1 2"/> )}
    {coords.length>1&&<><polygon points={`0,100 ${line} 100,100`} fill="var(--accent)" opacity=".12"/><polyline points={line} fill="none" stroke="var(--accent)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></>}
    {coords.map((p,i)=><g key={p.label+i} onClick={()=>setActive(i)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setActive(i)}}} role="button" tabIndex={0} aria-label={`${p.label}: ${usd(p.v)}`}><circle cx={p.x} cy={p.y} r={active===i?3.3:2.2} fill="var(--accent)" stroke="var(--card)" strokeWidth=".8"/><circle cx={p.x} cy={p.y} r="5" fill="transparent"/></g>)}
   </svg>
   <div className="mt-1 flex justify-between text-[9px] text-muted"><span>{points[0]?.d??''}</span><span>{points.at(-1)?.d??''}</span></div>
  </div>
  <div className="mt-3 flex items-center justify-between text-[11px] text-muted"><span>{points.length} of {history.length} available months</span><span>Tap a plotted point for details</span></div>
 </div>;
}
