'use client';

import { useMemo } from 'react';
import { PLANS, vacancyScenario } from '@/lib/finance';
import { pct } from '@/lib/format';
import { Card } from '@/components/ui/Card';

const points=Array.from({length:7},(_,i)=>5+i*5);
export function StressTool(){
  const values=useMemo(()=>points.map(v=>({vacancy:v,apy:vacancyScenario({apy:PLANS.twelve.apy,vacancy:v/100,rentChange:0,valuationChange:0})})),[]);
  const min=-.02,max=.16,x=(v:number)=>28+(v-5)/30*286,y=(v:number)=>154-(v-min)/(max-min)*128;
  const path=values.map((p,i)=>`${i?'L':'M'} ${x(p.vacancy)} ${y(p.apy)}`).join(' ');
  const rows=[6,20,35].map(v=>({vacancy:v,apy:vacancyScenario({apy:PLANS.twelve.apy,vacancy:v/100,rentChange:0,valuationChange:0})}));
  const tone=(n:number)=>n>=.125?'text-positive':n>=.11?'text-amber-600':'text-rose-600';
  return <div className="space-y-4"><Card><div className="flex justify-between"><div><p className="text-sm text-muted">Firn Twelve</p><h2 className="font-semibold">Return sensitivity</h2></div><span className="text-xs text-muted">12 months</span></div>
    <svg viewBox="0 0 340 190" role="img" aria-label="Illustrative return versus vacancy chart" className="mt-4 w-full overflow-visible"><line x1="28" y1={y(.10)} x2="314" y2={y(.10)} stroke="currentColor" strokeDasharray="5 5" opacity=".55"/><text x="28" y={y(.10)-7} fontSize="9" fill="currentColor">10% plan range floor</text><path d={path} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>{values.map(p=><g key={p.vacancy}><circle cx={x(p.vacancy)} cy={y(p.apy)} r="3.5" fill="currentColor"/><text x={x(p.vacancy)} y="174" fontSize="10" textAnchor="middle" fill="currentColor">{p.vacancy}%</text></g>)}<text x="8" y="18" fontSize="9" fill="currentColor">Return</text></svg><p className="text-xs text-muted">Vacancy varies; rent and valuation changes are held at 0%. Dashed line marks the plan's 10% lower target range, not a guaranteed minimum.</p></Card>
    <Card><h3 className="mb-3 font-semibold">Selected vacancy points</h3><div className="divide-y divide-line">{rows.map(r=><div key={r.vacancy} className="flex items-center justify-between py-3"><div><strong>{r.vacancy}% vacancy</strong><p className="text-xs text-muted">Illustrative annual return</p></div><strong className={tone(r.apy)}>{pct(r.apy,2)}</strong></div>)}</div><p className="mt-2 text-xs text-muted">Colour indicates relative sensitivity to the 13% target, not whether a positive return is assured. All figures are illustrative.</p></Card>
  </div>;
}
