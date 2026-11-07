'use client';
import {useEffect,useState} from 'react';
import {Button} from '@/components/ui/Button';
async function hash(pin:string){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(pin));return Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('');}
export function AppPinForm(){
 const [enabled,setEnabled]=useState(false);const [current,setCurrent]=useState('');const [next,setNext]=useState('');const [confirm,setConfirm]=useState('');const [error,setError]=useState('');const [saved,setSaved]=useState(false);
 useEffect(()=>setEnabled(localStorage.getItem('firn-app-lock-enabled')==='true'&&!!localStorage.getItem('firn-app-lock-hash')),[]);
 async function submit(e:React.FormEvent){e.preventDefault();setError('');setSaved(false);if(!/^\d{4}$/.test(next)||!/^\d{4}$/.test(confirm)){setError('Choose and confirm a four-digit PIN.');return;}if(next!==confirm){setError('The new PINs do not match.');return;}const existing=localStorage.getItem('firn-app-lock-hash');if(existing&&await hash(current)!==existing){setError('Your current PIN is incorrect.');return;}localStorage.setItem('firn-app-lock-hash',await hash(next));localStorage.setItem('firn-app-lock-enabled','true');setEnabled(true);setCurrent('');setNext('');setConfirm('');setSaved(true);}
 function remove(){localStorage.removeItem('firn-app-lock-hash');localStorage.removeItem('firn-app-lock-enabled');setEnabled(false);setCurrent('');setNext('');setConfirm('');setSaved(true);}
 return <div className="space-y-5">
  <div className="rounded-2xl border border-line bg-card2 p-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-accent/15 text-accent">⌑</span><div><p className="text-sm font-semibold">{enabled?'App PIN is enabled on this device':'No app PIN on this device'}</p><p className="mt-1 text-xs text-muted">A local convenience lock, not your account password.</p></div></div></div>
  <form onSubmit={submit} className="space-y-4">
   {enabled&&<label className="block"><span className="mb-2 block text-xs font-medium text-muted">Current PIN</span><input type="password" inputMode="numeric" autoComplete="current-password" maxLength={4} pattern="[0-9]{4}" value={current} onChange={e=>setCurrent(e.target.value.replace(/\D/g,'').slice(0,4))} required className="h-12 w-full rounded-xl border border-line bg-card2 px-4 text-center text-lg tracking-[.5em]"/></label>}
   <label className="block"><span className="mb-2 block text-xs font-medium text-muted">New 4-digit PIN</span><input type="password" inputMode="numeric" autoComplete="new-password" maxLength={4} pattern="[0-9]{4}" value={next} onChange={e=>setNext(e.target.value.replace(/\D/g,'').slice(0,4))} required className="h-12 w-full rounded-xl border border-line bg-card2 px-4 text-center text-lg tracking-[.5em]"/></label>
   <label className="block"><span className="mb-2 block text-xs font-medium text-muted">Confirm new PIN</span><input type="password" inputMode="numeric" autoComplete="new-password" maxLength={4} pattern="[0-9]{4}" value={confirm} onChange={e=>setConfirm(e.target.value.replace(/\D/g,'').slice(0,4))} required className="h-12 w-full rounded-xl border border-line bg-card2 px-4 text-center text-lg tracking-[.5em]"/></label>
   {error&&<p role="alert" className="text-xs text-neg">{error}</p>}{saved&&<p role="status" className="text-xs text-pos">App PIN settings updated on this device.</p>}
   <Button className="w-full">{enabled?'Change PIN':'Create PIN'}</Button>
  </form>
  {enabled&&<button type="button" onClick={remove} className="w-full rounded-full border border-line py-3 text-xs font-medium text-neg">Turn off app PIN</button>}
  <p className="text-[11px] leading-5 text-muted">This PIN is stored only in this browser on this device. It does not change your FIRN sign-in password and will not sync to other devices. Use your account password and sign-in security to protect your account.</p>
 </div>;
}
