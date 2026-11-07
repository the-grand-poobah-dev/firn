'use client';
import{useMemo,useState}from'react';
import{PLANS,growth,type PlanCode}from'@/lib/finance';
import{usd,pct}from'@/lib/format';
import{Card}from'@/components/ui/Card';
const periods=[{label:'Daily',days:1},{label:'Weekly',days:7},{label:'Monthly',days:30},{label:'Biannual (6 mo)',days:182.5},{label:'Yearly',days:365}];
export function InvestmentCalculator(){
 const[amount,setAmount]=useState('5000');const[plan,setPlan]=useState<PlanCode>('six');
 const principal=Math.max(0,Number(amount)||0);const apy=PLANS[plan].effectiveApy;
 const rows=useMemo(()=>periods.map(p=>{const balance=growth(principal,apy,p.days);return{...p,balance,profit:balance-principal}}),[principal,apy]);
 return <div className="space-y-5">
  <Card className="space-y-4"><div><p className="label">STARTING INVESTMENT</p><label className="mt-2 flex items-center gap-2"><span className="text-2xl text-muted">$</span><input aria-label="Starting investment in US dollars" type="number" min="1" step="0.01" inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full bg-transparent text-3xl font-semibold outline-none tabular"/></label></div>
   <div><p className="label mb-2">CHOOSE AN INVESTMENT PLAN</p><div className="grid grid-cols-2 gap-2">{(['six','twelve'] as const).map(code=><button type="button" key={code} onClick={()=>setPlan(code)} aria-pressed={plan===code} className={`rounded-2xl border p-3 text-left ${plan===code?'border-accent bg-accent/10':'border-line bg-card2'}`}><span className="block text-sm font-semibold">{code==='six'?'6 months':'12 months'}</span><span className="mt-1 block text-xl font-semibold">{pct(PLANS[code].termReturn)} return</span></button>)}</div></div>
  </Card>
  <div><div className="mb-3"><p className="label">COMPOUNDED PROJECTION</p><h2 className="mt-1 text-lg font-semibold">How your investment could grow</h2><p className="mt-1 text-xs text-muted">Illustrative estimate using the effective annual compounding rate of {pct(apy)}. The selected plan targets {pct(PLANS[plan].termReturn)} over its full {PLANS[plan].months}-month term.</p></div>
   <div className="space-y-2">{rows.map(row=><Card key={row.label} className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">{row.label}</p><p className="mt-1 text-xs text-pos">+{usd(row.profit,2)} profit</p></div><div className="text-right"><p className="text-[10px] text-muted">Total balance</p><p className="text-lg font-semibold tabular">{usd(row.balance,2)}</p></div></Card>)}</div>
  </div>
  <Card className="border-warm/40"><p className="text-xs leading-5 text-muted">These figures are mathematical illustrations based on the selected plan’s effective annual compounding rate, not promised or guaranteed returns. For the 6-month plan, the yearly projection assumes reinvestment after maturity at the same APY; renewal and future rates are not guaranteed. Actual results may be lower, including a loss of capital. Property values may fall and capital may be affected.</p></Card>
 </div>;
}