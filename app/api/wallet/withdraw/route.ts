import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
const json=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(request:Request){
 const supabase=await createClient(); const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)return json({error:'Please sign in again.'},401);
 let body:unknown;try{body=await request.json()}catch{return json({error:'Invalid request.'},400)}
 if(!body||typeof body!=='object')return json({error:'Invalid request.'},400);
 const b=body as Record<string,unknown>; const amount=Number(b.amount);
 if(!Number.isFinite(amount)||amount<=0||amount>100000000)return json({error:'Enter a valid withdrawal amount.'},400);
 if(!['mpesa','bank','usdt_trc20'].includes(String(b.method)))return json({error:'Choose a valid payout method.'},400);
 if(typeof b.destination!=='string'||b.destination.trim().length<3||b.destination.length>300)return json({error:'Enter valid payout destination details.'},400);
 const {data,error}=await supabase.rpc('request_manual_withdrawal',{p_amount:amount,p_method:b.method as string,p_destination:b.destination.trim(),p_early_exit:b.early_exit===true});
 if(error){const msg=error.message.includes('Insufficient')?'Your available wallet balance is not enough for this request.':error.message;return json({error:msg},400);}
 return json({id:data,status:'pending'},201);
}