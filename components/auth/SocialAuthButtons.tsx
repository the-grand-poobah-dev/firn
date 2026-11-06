'use client';
import {useState} from 'react';
import {createClient} from '@/lib/supabase/client';
export function SocialAuthButtons(){
 const[busy,setBusy]=useState('');
 const[error,setError]=useState('');
 async function start(provider:'google'|'facebook'){
  setBusy(provider);setError('');
  const {error}=await createClient().auth.signInWithOAuth({provider,options:{redirectTo:window.location.origin+'/auth/confirm?next=/profile'}});
  if(error){setError(error.message);setBusy('');}
 }
 return <div className="space-y-3">
  <button type="button" disabled={!!busy} onClick={()=>start('google')} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-line bg-card px-4 text-sm font-semibold text-fg disabled:opacity-60"><span aria-hidden="true" className="font-bold text-base">G</span>{busy==='google'?'Connecting…':'Continue with Google'}</button>
  <button type="button" disabled={!!busy} onClick={()=>start('facebook')} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-line bg-card px-4 text-sm font-semibold text-fg disabled:opacity-60"><span aria-hidden="true" className="font-bold text-base text-[#1877F2]">f</span>{busy==='facebook'?'Connecting…':'Continue with Facebook'}</button>
  {error&&<p role="alert" className="text-xs text-neg">{error}</p>}
 </div>;
}