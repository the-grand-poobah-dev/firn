'use client';
import{useState,useTransition}from'react';import Link from'next/link';import{signUpAction}from'@/app/auth/actions';import{Button}from'@/components/ui/Button';import{SocialAuthButtons}from'@/components/auth/SocialAuthButtons';
const countries=['Kenya','Uganda','Tanzania','Rwanda','Nigeria','Ghana','South Africa','United States','United Kingdom','Other'];
export function SignupForm(){
 const[f,S]=useState({fullName:'',email:'',password:'',country:'Kenya',adult:false,terms:false});const[e,E]=useState('');const[p,T]=useTransition();const u=(k:keyof typeof f,v:string|boolean)=>S(x=>({...x,[k]:v}));
 return <div className="space-y-4">
  <div className="flex items-center gap-3 text-[10px] text-muted"><span className="h-px flex-1 bg-line"/>SIGN UP WITH<span className="h-px flex-1 bg-line"/></div>
  <SocialAuthButtons/>
  <div className="flex items-center gap-3 text-[10px] text-muted"><span className="h-px flex-1 bg-line"/>OR USE EMAIL<span className="h-px flex-1 bg-line"/></div>
  <form className="space-y-4" onSubmit={ev=>{ev.preventDefault();T(async()=>{const r=await signUpAction({...f,adult:f.adult?'yes':'',terms:f.terms?'yes':''});if(r.error)E(r.error);else location.href='/verify?email='+encodeURIComponent(f.email)})}}>
   {[['Full name','fullName','text'],['Email','email','email'],['Password','password','password']].map(([label,key,type])=><label key={key} className="block text-xs text-muted">{label}<input required type={type} minLength={key==='password'?10:undefined} value={f[key as 'fullName'|'email'|'password']} onChange={ev=>u(key as 'fullName'|'email'|'password',ev.target.value)} className="mt-2 w-full rounded-2xl border border-line bg-card2 px-4 py-3 text-sm text-fg"/></label>)}
   <label className="block text-xs text-muted">Country<select value={f.country} onChange={ev=>u('country',ev.target.value)} className="mt-2 w-full rounded-2xl border border-line bg-card2 px-4 py-3 text-sm">{countries.map(c=><option key={c}>{c}</option>)}</select></label>
   <label className="flex gap-3 text-xs text-muted"><input type="checkbox" checked={f.adult} onChange={ev=>u('adult',ev.target.checked)}/>I confirm I am 18 or older.</label>
   <label className="flex gap-3 text-xs text-muted"><input type="checkbox" checked={f.terms} onChange={ev=>u('terms',ev.target.checked)}/>I agree to the Terms and understand targets are not guarantees.</label>
   {e&&<p role="alert" className="text-xs text-neg">{e}</p>}<Button className="w-full" disabled={p}>{p?'Creating…':'Create account'}</Button>
  </form>
  <p className="text-center text-xs text-muted">Already registered? <Link href="/login" className="text-accent">Log in</Link></p>
 </div>;
}