'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/Button';
import {createClient} from '@/lib/supabase/client';
import {saveKycDetailsAction} from '@/app/auth/actions';
const countryCodes=[['Kenya','+254'],['Uganda','+256'],['Tanzania','+255'],['Rwanda','+250'],['Nigeria','+234'],['Ghana','+233'],['South Africa','+27'],['United Kingdom','+44'],['United States','+1'],['United Arab Emirates','+971'],['Italy','+39'],['Spain','+34'],['Portugal','+351'],['Switzerland','+41']];
const countries=['Kenya','Uganda','Tanzania','Rwanda','Nigeria','Ghana','South Africa','United Kingdom','United States','United Arab Emirates','Italy','Spain','Portugal','Switzerland','Canada','Australia','Germany','France','Netherlands','Singapore','Japan','Other'];
const sources=['Employment income','Business income','Savings','Investment proceeds','Rental income','Pension or retirement income','Family support or gift','Sale of assets','Other'];
export function KycChecklist({pending=false}:{pending?:boolean}){
 const[code,setCode]=useState('+254'),[phone,setPhone]=useState(''),[file,setFile]=useState<File|null>(null),[path,setPath]=useState(''),[city,setCity]=useState(''),[country,setCountry]=useState('Kenya'),[source,setSource]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[submitted,setSubmitted]=useState(pending);
 async function upload(){
  if(!file){setError('Choose an ID document first.');return}
  if(!['image/jpeg','image/png','application/pdf'].includes(file.type)){setError('Upload a JPG, PNG or PDF document.');return}
  if(file.size>10*1024*1024){setError('Your document must be 10 MB or smaller.');return}
  setBusy(true);setError('');
  try{
   const supabase=createClient();const{data:{user},error:authError}=await supabase.auth.getUser();
   if(authError||!user)throw new Error('Please sign in again.');
   const objectPath=user.id+'/'+crypto.randomUUID()+'-'+file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
   const{error:uploadError}=await supabase.storage.from('kyc-documents').upload(objectPath,file,{contentType:file.type,upsert:false});
   if(uploadError)throw uploadError;
   setPath(objectPath);
  }catch(e){setError(e instanceof Error?e.message:'Could not upload your document.')}
  finally{setBusy(false)}
 }
 async function submit(){
  setBusy(true);setError('');
  const phoneE164=code+phone.replace(/\D/g,'').replace(/^0/,'');
  const result=await saveKycDetailsAction({phone:phoneE164,idPath:path,city,country,sourceOfFunds:source});
  if(result.error)setError(result.error);else setSubmitted(true);
  setBusy(false);
 }
 if(submitted)return <div className="space-y-4"><div className="rounded-2xl border border-line bg-card2 p-5"><div className="mb-3 grid size-10 place-items-center rounded-full bg-accent/15 text-accent">✓</div><h2 className="font-semibold">Documents received</h2><p className="mt-2 text-sm leading-relaxed text-muted">Your details and ID document have been submitted. Your identity check is pending review. We will update your account when the review is complete.</p><p className="mt-3 text-xs text-muted">Uploading a document does not mean your identity has been approved.</p></div><a className="block text-center text-sm text-accent" href="mailto:admin@firn.investing">Contact support</a></div>;
 return <div className="space-y-5">
  <p className="text-sm text-muted">Complete the details below. Your ID is stored privately and can only be accessed by authorised verification staff.</p>
  <label className="block text-xs text-muted">Phone number<div className="mt-2 flex gap-2"><select aria-label="Country calling code" value={code} onChange={e=>setCode(e.target.value)} className="w-[116px] rounded-xl border border-line bg-card2 px-2 py-3 text-sm text-fg">{countryCodes.map(([n,c])=><option key={c} value={c}>{c} {n}</option>)}</select><input type="tel" required value={phone} onChange={e=>setPhone(e.target.value)} placeholder="712 345 678" className="min-w-0 flex-1 rounded-xl border border-line bg-card2 px-3 py-3 text-sm text-fg"/></div></label>
  <div><label className="block text-xs text-muted">Government-issued ID document<input type="file" accept="image/jpeg,image/png,application/pdf" onChange={e=>{setFile(e.target.files?.[0]??null);setPath('');setError('')}} className="mt-2 block w-full rounded-xl border border-line bg-card2 p-3 text-xs text-fg"/></label><div className="mt-2 flex items-center justify-between gap-3"><span className="text-[10px] text-muted">{path?'Uploaded — awaiting review':file?file.name:'JPG, PNG or PDF · max 10 MB'}</span><Button type="button" variant="ghost" disabled={!file||busy||!!path} onClick={upload}>{busy&&!path?'Uploading…':path?'Uploaded':'Upload ID'}</Button></div></div>
  <label className="block text-xs text-muted">City of residence<input list="firn-cities" value={city} onChange={e=>setCity(e.target.value)} placeholder="Search or enter your city" className="mt-2 w-full rounded-xl border border-line bg-card2 px-4 py-3 text-sm text-fg"/><datalist id="firn-cities">{['Nairobi','Mombasa','Kisumu','Nakuru','Kampala','Dar es Salaam','Kigali','Lagos','Accra','Johannesburg','London','Dubai','Milan','Madrid','Lisbon','Zurich','Toronto','New York','Singapore','Tokyo'].map(x=><option key={x} value={x}/>)}</datalist></label>
  <label className="block text-xs text-muted">Country of residence<input list="firn-countries" value={country} onChange={e=>{setCountry(e.target.value);const match=countryCodes.find(x=>x[0]===e.target.value);if(match)setCode(match[1])}} placeholder="Search country" className="mt-2 w-full rounded-xl border border-line bg-card2 px-4 py-3 text-sm text-fg"/><datalist id="firn-countries">{countries.map(x=><option key={x} value={x}/>)}</datalist></label>
  <label className="block text-xs text-muted">Source of funds<select value={source} onChange={e=>setSource(e.target.value)} className="mt-2 w-full rounded-xl border border-line bg-card2 px-4 py-3 text-sm text-fg"><option value="">Select source of funds</option>{sources.map(x=><option key={x}>{x}</option>)}</select></label>
  {error&&<p role="alert" className="text-xs text-neg">{error}</p>}
  <Button className="w-full" disabled={busy||!path||!phone||!city||!source} onClick={submit}>{busy?'Submitting…':'Submit for verification'}</Button>
 </div>;
}