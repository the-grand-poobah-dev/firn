'use client';

import { useMemo, useState } from 'react';
import { PLANS, vacancyScenario } from '@/lib/finance';
import { usd, pct } from '@/lib/format';
import { Card } from '@/components/ui/Card';

function Range({ label, value, min, max, step, suffix = '%', onChange }: { label: string; value: number; min: number; max: number; step: number; suffix?: string; onChange: (n:number)=>void }) {
  return <label className="block space-y-2"><span className="flex justify-between text-sm"><span>{label}</span><strong>{value > 0 && min < 0 ? '+' : ''}{value}{suffix}</strong></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))} className="w-full accent-current"/><span className="flex justify-between text-xs text-muted"><span>{min}{suffix}</span><span>{max > 0 && min < 0 ? '+' : ''}{max}{suffix}</span></span></label>;
}

export function RiskTool() {
  const [vacancy,setVacancy]=useState(6), [rent,setRent]=useState(0), [valuation,setValuation]=useState(0), [amount,setAmount]=useState(5000);
  const result=useMemo(()=>vacancyScenario({apy:PLANS.twelve.apy,vacancy:vacancy/100,rentChange:rent/100,valuationChange:valuation/100}),[vacancy,rent,valuation]);
  const value=amount*(1+result);
  return <div className="space-y-4">
    <Card><div className="mb-4"><p className="text-sm text-muted">Adjust the assumptions</p><h2 className="text-lg font-semibold">Property sensitivity</h2></div>
      <div className="space-y-6"><Range label="Vacancy" value={vacancy} min={5} max={35} step={1} onChange={setVacancy}/><Range label="Rent change" value={rent} min={-10} max={10} step={1} onChange={setRent}/><Range label="Valuation change" value={valuation} min={-15} max={10} step={1} onChange={setValuation}/></div>
      <label className="mt-6 block text-sm">Investment amount <input aria-label="Investment amount" type="number" min="500" step="100" value={amount} onChange={e=>setAmount(Math.max(0,Number(e.target.value)||0))} className="mt-2 w-full rounded-xl border border-line bg-card2 p-3"/></label>
    </Card>
    <Card variant="hero"><p className="text-sm text-muted">Illustrative 12-month result · Firn Twelve</p><p className="mt-2 text-3xl font-semibold tabular-nums">{pct(result,2)}</p><p className="mt-1 text-sm text-muted">instead of 13.0%</p><div className="mt-5 flex justify-between border-t border-line pt-4"><span className="text-sm text-muted">Value on {usd(amount)}</span><strong className="text-xl tabular-nums">{usd(value,2)}</strong></div><p className="mt-3 text-xs text-muted">Scenario model only. It is not a forecast or a guarantee; actual property performance may differ and capital can be lost.</p></Card>
  </div>;
}
