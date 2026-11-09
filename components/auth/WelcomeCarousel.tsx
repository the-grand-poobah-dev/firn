'use client';
import useEmblaCarousel from 'embla-carousel-react';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {Logo} from '@/components/ui/Logo';
import {Button} from '@/components/ui/Button';
import {InvestmentCalculator} from '@/components/calculator/InvestmentCalculator';

const slides=[
 ['Real buildings behind every dollar','Explore a portfolio of properties connected to your investment experience.'],
 ['Interest added every day','Watch daily accrual build over time. Targets are not guarantees.'],
 ['Estimate your investment','Choose an amount and compare daily, weekly, monthly, six-month and yearly projections.'],
 ['Lock 6 or 12 months','Choose a time horizon that works for your plan.']
];
export function WelcomeCarousel(){
 const [started,setStarted]=useState(false);
 const [ref,api]=useEmblaCarousel({loop:false});
 const [i,setI]=useState(0);
 useEffect(()=>{if(!api)return;const sync=()=>setI(api.selectedScrollSnap());api.on('select',sync);return()=>{api.off('select',sync)}},[api]);
 return <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden bg-bg px-5 pb-8 pt-[max(22px,env(safe-area-inset-top))] text-fg">
  <header className="flex justify-between"><Logo/></header>
  {!started?<><div className="relative mt-8 flex flex-1 flex-col justify-center"><div className="absolute inset-x-[-24px] bottom-0 h-[58%] overflow-hidden rounded-t-[2rem] bg-cover bg-center" style={{backgroundImage:"linear-gradient(180deg, rgba(8,20,29,.02), rgba(8,20,29,.88)), url(https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85)"}} /></div><div className="relative z-10 mb-28"><p className="font-mono text-[10px] uppercase tracking-[.25em] text-accent">A clearer path to your goals</p><h1 className="mt-5 max-w-xs text-5xl font-semibold leading-[.98] tracking-tight">Invest with a view of what’s real.</h1><p className="mt-5 max-w-xs text-sm leading-6 text-muted">Build an investment portfolio connected to real property, with clear time horizons and daily accrual.</p></div></div><Link href="/calculator" className="mb-3 block text-center text-xs font-semibold text-accent">Try the investment calculator →</Link><Button className="w-full" onClick={()=>setStarted(true)}>Get started</Button><Link href="/login" className="mt-4 text-center text-xs text-muted">Already have an account? <span className="text-accent">Log in</span></Link></>
  :<><div ref={ref} className="mt-5 min-h-0 flex-1 overflow-hidden"><div className="flex h-full">{slides.map(([h,b],n)=><article key={h} className="max-h-[calc(100dvh-250px)] min-w-0 flex-[0_0_100%] overflow-y-auto pb-3"><div className={n===2?'':'relative flex h-64 items-end justify-center overflow-hidden rounded-[30px] border border-line bg-card2 p-5'}>{n===2?<></>:<>{n===0?<div className="relative flex items-end gap-2">{[70,110,88,145,98].map((x,j)=><div key={j} style={{height:x}} className="w-12 rounded-t-lg border border-accent/40 bg-accent/20"><div className="grid h-full grid-cols-2 gap-1 p-2">{Array.from({length:8},(_,k)=><i key={k} className="rounded bg-accent/50"/>)}</div></div>)}</div>:n===1?<div className="relative mb-4 size-36 rounded-full border-[14px] border-accent/30 bg-accent/15 shadow-[0_0_65px_var(--accent)]"/>:<svg viewBox="0 0 340 230" className="relative w-full"><path d="M0 190L80 80L130 145L190 22L270 150L315 95L340 130V230H0Z" fill="var(--accent)" opacity=".35"/><path d="M0 190L80 80L130 145L190 22L270 150L315 95L340 130" fill="none" stroke="var(--accent)" strokeWidth="3"/></svg>}</>}</div><h2 className="mt-7 text-[32px] font-semibold leading-tight">{h}</h2><p className="mt-3 text-sm leading-6 text-muted">{b}</p>{n===2&&<div className="mt-4"><InvestmentCalculator/></div>}</article>)}</div></div><div className="mt-auto pt-4"><div className="mb-5 flex justify-center gap-2">{slides.map((s,n)=><button key={s[0]} onClick={()=>api?.scrollTo(n)} aria-label={'Slide '+(n+1)} className={'h-1.5 rounded-full '+(i===n?'w-8 bg-accent':'w-2 bg-line')}/>)}</div>{i<slides.length-1?<div className="flex gap-3"><Button className="flex-1" onClick={()=>api?.scrollNext()}>{i===2?'Continue to lock period':'Continue'}</Button><Button variant="ghost" onClick={()=>api?.scrollTo(slides.length-1)}>Skip</Button></div>:<div className="grid gap-3"><Link className="flex min-h-12 items-center justify-center rounded-full bg-accent font-semibold text-accent-on" href="/signup">Create account</Link><Link className="flex min-h-12 items-center justify-center rounded-full border border-line" href="/login">Log in</Link></div>}</div></>}
 </main>;
}
