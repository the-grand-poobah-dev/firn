'use client';
import {useMemo,useState} from 'react';
import {Card} from '@/components/ui/Card';
import {WarnBox} from '@/components/ui/WarnBox';
import {Segmented} from '@/components/ui/Segmented';
import {usd,pct} from '@/lib/format';
import type {PropertyRecord} from '@/lib/properties';
type View='Year 1'|'Run rate'|'Forecast';
export function FinancialsPanel({property}:{property:PropertyRecord}){
 const [view,setView]=useState<View>('Year 1');
 const figures=useMemo(()=>{
  const history=property.rent_history.map(p=>p.v*1_000_000).filter(v=>Number.isFinite(v)&&v>0);
  const latest=history.at(-1)??0,first=history[0]??latest;
  const trend=history.length>1?Math.pow(Math.max(.01,latest/Math.max(first,1)),12/(history.length-1))-1:0;
  const annualGrowth=Math.max(-.15,Math.min(.15,trend));
  const occupancy=Math.max(0,Math.min(1,property.occupancy));
  const runVacancy=Math.max(2,Math.min(18,(1-occupancy)*100));
  const runCosts=Math.max(16,Math.min(30,21.4+(property.units>100?1.2:0)));
  const forecastVacancy=Math.max(2,Math.min(20,runVacancy+(annualGrowth<0?1.5:-.5)));
  const build=(gross:number,operating:number,vacancy:number)=>({gross,operating,management:7,vacancy,net:gross-operating-7-vacancy});
  if(view==='Year 1')return {allocation:build(100,21.4,4.6),headline:'Year 1 baseline',sub:'Illustrative first-year allocation per $100 of gross rent',annualRent:first*12,change:null};
  if(view==='Run rate')return {allocation:build(100,runCosts,runVacancy),headline:'Current operating run rate',sub:'Per $100 of rent, using this property’s latest reported occupancy and operating scale',annualRent:latest*12,change:null};
  return {allocation:build(100,runCosts+Math.max(-2,annualGrowth*8),forecastVacancy),headline:'Forward 12-month scenario',sub:'Per $100 of rent, with a property-specific rent trend and occupancy sensitivity',annualRent:latest*(1+annualGrowth)*12,change:annualGrowth};
 },[property,view]);
 const a=figures.allocation;\n const netYield=property.valuation>0?(figures.annualRent/property.valuation)*(a.net/100):0;\n const appreciation=property.target_return-netYield;
 return <div className="space-y-4">
  <Segmented items={['Year 1','Run rate','Forecast']} defaultValue="Year 1" onChange={v=>setView(v as View)}/>
  <Card><p className="text-sm font-semibold">Where $100 of rent goes</p><p className="mt-1 text-xs text-muted">{figures.sub}</p><div className="mt-4 space-y-3">{[['Gross rent',a.gross],['Operating costs',-a.operating],['Management fee',-a.management],['Vacancy reserve',-a.vacancy],['Net income',a.net]].map(([label,value])=><div key={String(label)} className="flex items-center justify-between text-sm"><span className={label==='Net income'?'font-semibold':'text-muted'}>{label}</span><span className="tabular font-medium">{Number(value)<0?'−':''}{usd(Math.abs(Number(value)),2)}</span></div>)}</div><div className="mt-4 h-2 overflow-hidden rounded-full bg-card2"><div className="h-full rounded-full bg-accent transition-all" style={{width:`${Math.max(0,Math.min(100,a.net))}%`}}/></div></Card>
  <Card><p className="text-sm font-semibold">{figures.headline}</p><p className="mt-1 text-xs text-muted">Latest reported monthly rent, annualised where applicable</p><p className="mt-2 text-xl font-semibold tabular">{usd(figures.annualRent)}</p><div className="mt-4 space-y-3">{[['Implied net rental yield',netYield],['Target appreciation component',appreciation],['Property target return',property.target_return]].map(([label,value])=><div key={String(label)} className="flex items-center justify-between text-sm"><span className={label==='Property target return'?'font-semibold':'text-muted'}>{label}</span><span className="font-semibold tabular">{pct(Number(value))}</span></div>)}</div><div className="mt-4 rounded-xl bg-card2 p-3 text-xs text-muted">Occupancy: {pct(property.occupancy)} · {property.units} units · {property.city}, {property.country}{figures.change!==null? ` · Implied rent trend: ${pct(figures.change)} annually`:''}</div></Card>
  <WarnBox>Run-rate and forecast views are analytical scenarios based on the property data available in this listing. They are not audited financial statements or guaranteed returns.</WarnBox>
 </div>;
}
