'use client';
import {useState} from 'react';
import Link from 'next/link';
import {signOutAction} from '@/app/auth/actions';
import {Icon} from '@/components/ui/Icon';
import Image from 'next/image';
export function HomeAccountMenu({name,avatarUrl}:{name:string;avatarUrl:string|null}){
 const [open,setOpen]=useState(false);
 const initial=name.trim().charAt(0).toUpperCase()||'F';
 return <div className="relative">
  <button type="button" aria-expanded={open} aria-haspopup="menu" onClick={()=>setOpen(v=>!v)} className="flex min-w-0 items-center gap-3 rounded-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
   <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-accent text-base font-semibold text-accent-on">{avatarUrl?<Image src={avatarUrl} alt="Profile picture" fill sizes="44px" unoptimized className="object-cover"/>:initial}</span>
   <span className="min-w-0"><span className="block text-xs text-muted">Welcome back</span><span className="block max-w-[145px] truncate text-base font-semibold">{name||'Investor'}</span></span>
   <Icon name="down" size={15} className="text-muted"/>
  </button>
  {open&&<><button aria-label="Close account menu" className="fixed inset-0 z-40 cursor-default" onClick={()=>setOpen(false)}/><div role="menu" className="absolute left-0 top-[calc(100%+10px)] z-50 w-[min(290px,calc(100vw-48px))] overflow-hidden rounded-2xl border border-line bg-card p-2 shadow-2xl">
   <div className="border-b border-line px-3 py-3"><p className="text-[10px] uppercase tracking-[.14em] text-muted">Your account</p><p className="mt-1 truncate text-sm font-semibold">{name||'Investor'}</p></div>
   <Link role="menuitem" onClick={()=>setOpen(false)} href="/account/profile" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-card2"><Icon name="user" size={17}/>Profile details</Link>
   <Link role="menuitem" onClick={()=>setOpen(false)} href="/account/security" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-card2"><Icon name="lock" size={17}/>Create or change app PIN</Link>
   <a role="menuitem" href="mailto:admin@firn.investing" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-card2"><Icon name="help" size={17}/>Help & support</a>
   <form action={signOutAction}><button role="menuitem" type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-neg hover:bg-neg/10"><Icon name="arrow" size={17}/>Log out</button></form>
  </div></>}
 </div>;
}
