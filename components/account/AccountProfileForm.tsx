'use client';
import {useState,useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {saveAccountProfileAction} from '@/app/auth/actions';
import {Button} from '@/components/ui/Button';
export function AccountProfileForm({initialName,email}:{initialName:string;email:string}){
 const [name,setName]=useState(initialName);const [error,setError]=useState('');const [saved,setSaved]=useState(false);const [pending,start]=useTransition();const router=useRouter();
 return <form className="space-y-5" onSubmit={e=>{e.preventDefault();setError('');setSaved(false);start(async()=>{const r=await saveAccountProfileAction({fullName:name});if(r.error)setError(r.error);else{setSaved(true);router.refresh();}})}}>
  <label className="block"><span className="mb-2 block text-xs font-medium text-muted">Full name</span><input value={name} onChange={e=>setName(e.target.value)} autoComplete="name" maxLength={80} required className="h-12 w-full rounded-xl border border-line bg-card2 px-4 text-sm outline-none focus:border-accent"/></label>
  <label className="block"><span className="mb-2 block text-xs font-medium text-muted">Sign-in email</span><input value={email} readOnly className="h-12 w-full rounded-xl border border-line bg-card2 px-4 text-sm text-muted"/></label>
  <p className="text-[11px] leading-5 text-muted">Your email is used to sign in. Contact support if you need to change it.</p>
  {error&&<p role="alert" className="text-xs text-neg">{error}</p>}{saved&&<p role="status" className="text-xs text-pos">Profile updated.</p>}
  <Button className="w-full" disabled={pending}>{pending?'Saving…':'Save changes'}</Button>
 </form>;
}
