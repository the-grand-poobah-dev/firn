'use client';

import { useMemo, useState } from 'react';
import { PLANS, growth, type PlanCode } from '@/lib/finance';
import { usd, longDate } from '@/lib/format';
import { Card } from '@/components/ui/Card';

export function Calculator(){
  const [amount,setAmount]=useState(5000),[plan,setPlan]=useState<PlanCode>('twelve'),[days,setDays]=useState(0);
  const today=new Date();
  const maturity=new Date(today);maturity.setMonth(maturity.getMonth()+PLANS[plan].months);
  const maxDays=Math.max(1,Math.round((Date.UTC(maturity.getFullYear(),maturity.getMonth(),maturity.getDate())-Date.UTC(today.getFullYear(),today.getMonth(),today.getDate()))/86400000));
  const value=useMemo(()=>growth(amount,PLANS[plan].apy,days),[amount,plan,days]);
  const date=new Date(today);date.setDate(date.getDate()+days);
  return <div className="space-y-4"><Card><label className="block text-sm">Amount (USD)<input type="number" min="500" step="100" value={amount} onChange={e=>setAmount(Math.max(0,Number(e.target.value)||0))} className="mt-2 w-full rounded-xl border border-line bg-card2 p-3"/></label><div className="mt-5"><p className="mb-2 text-sm">Plan</p><div className="grid grid-cols-2 gap-2">{(['six','twelve'] as PlanCode[]).map(p=><button key={p} type="button" onClick={()=>{setPlan(p);setDays(0)}} className={`rounded-xl border p-3 text-left ${plan===p?'border-current bg-card2':'border-line'}`}><strong>{PLANS[p].name}</strong><span className="block text-xs text-muted">{(PLANS[p].apy*100).toFixed(1)}% target APY</span></button>)}</div></div><label className="mt-6 block text-sm">Days from today <strong className="float-right">{days} / {maxDays}</strong><input aria-label="Days from today" type="range" min="0" max={maxDays} value={days} onChange={e=>setDays(Number(e.target.value))} className="mt-3 w-full accent-current"/></label><div className="mt-2 flex justify-between text-xs text-muted"><span>Today</span><span>Maturity · {longDate(maturity)}</span></div></Card><Card variant="hero"><p className="text-sm text-muted">Estimated value on {longDate(date)}</p><p className="mt-2 text-3xl font-semibold tabular-nums">{usd(value,2)}</p><p className="mt-2 text-sm text-muted">Estimated change: {usd(value-amount,2)}</p><p className="mt-4 text-xs text-muted">Uses daily-equivalent compounding at the plan&apos;s target APY. A calculation is not a promise of returns; fees, vacancy, valuations and other risks can affect actual outcomes.</p></Card></div>;
}
