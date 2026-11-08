import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {revalidatePath} from 'next/cache';
type Context={params:Promise<{id:string}>};
export async function POST(_request:Request,{params}:Context){const {id}=await params;const supabase=await createClient();const {data:{user},error:authError}=await supabase.auth.getUser();if(authError||!user)return NextResponse.json({error:'Please sign in.'},{status:401});const {data,error}=await supabase.rpc('early_exit',{p_position:id});if(error){const message=error.message||'Unable to start early exit.';const status=message.includes('day 90')?409:message.includes('Savings not found')?404:400;return NextResponse.json({error:message},{status});}revalidatePath('/savings');revalidatePath('/wallet');revalidatePath('/home');return NextResponse.json({received:Number(data)});}
