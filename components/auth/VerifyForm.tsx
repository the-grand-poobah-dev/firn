'use client';
import{useEffect,useState,useTransition}from'react';
import{useRouter,useSearchParams}from'next/navigation';
import{createClient}from'@/lib/supabase/client';
import{saveSignupCountryAction}from'@/app/auth/actions';
import{OtpInput}from'@/components/ui/OtpInput';
import{Keypad}from'@/components/ui/Keypad';
import{Button}from'@/components/ui/Button';
export function VerifyForm(){
 const router=useRouter();const email=useSearchParams().get('email')||'';const[code,C]=useState('');const[seconds,S]=useState(30);const[error,E]=useState('');const[notice,N]=useState('');const[busy,T]=useTransition();
 useEffect(()=>{if(seconds<=0)return;const t=setTimeout(()=>S(v=>v-1),1000);return()=>clearTimeout(t)},[seconds]);
 function key(k:string){if(k==='⌫'){C(v=>v.slice(0,-1));return}if(k==='✓'){if(code.length===6)void verify();return}if(/^\\d$/.test(k))C(v=>(v+k).slice(0,6))}
 async function verify(){T(async()=>{const{error}=await createClient().auth.verifyOtp({email,token:code,type:'signup'});if(error)E(error.message);else{const saved=await saveSignupCountryAction();if(saved.error)E(saved.error);else router.push('/profile')}})}
 return <div className="space-y-5"><p className="text-sm text-muted">Enter the six-digit confirmation code sent to {email||'your email'}.</p><OtpInput value={code} onChange={C}/><Keypad onKey={key}/><Button className="w-full" disabled={code.length!==6||busy} onClick={verify}>Verify email</Button><button className="w-full text-xs text-accent disabled:text-muted" disabled={seconds>0} onClick={async()=>{const{error}=await createClient().auth.resend({type:'signup',email});if(error)E(error.message);else{E('');N('A new code has been sent.');S(30)}}}>{seconds?'Resend code in 00:'+String(seconds).padStart(2,'0'):'Resend code'}</button>{error&&<p role="alert" className="text-xs text-neg">{error}</p>}{notice&&<p role="status" className="text-xs text-pos">{notice}</p>}</div>;
}