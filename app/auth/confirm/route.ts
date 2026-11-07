import{type EmailOtpType}from'@supabase/supabase-js';
import{NextRequest,NextResponse}from'next/server';
import{createClient}from'@/lib/supabase/server';
import{onboardingDestination}from'@/lib/auth';
export async function GET(request:NextRequest){
 const url=new URL(request.url);const tokenHash=url.searchParams.get('token_hash');const type=url.searchParams.get('type') as EmailOtpType|null;const code=url.searchParams.get('code');const nextParam=url.searchParams.get('next')||'/profile';const next=nextParam.startsWith('/')&&!nextParam.startsWith('//')?nextParam:'/profile';const supabase=await createClient();let verified=false;
 if(tokenHash&&type){const{error}=await supabase.auth.verifyOtp({token_hash:tokenHash,type});verified=!error}
 else if(code){const{error}=await supabase.auth.exchangeCodeForSession(code);verified=!error}
 if(verified){const{data:{user}}=await supabase.auth.getUser();if(user&&typeof user.user_metadata?.country==='string')await supabase.from('profiles').update({country:user.user_metadata.country}).eq('id',user.id);const destination=user?await onboardingDestination(user.id):next;return NextResponse.redirect(new URL(destination||next,request.url))}
 return NextResponse.redirect(new URL('/login?error=confirmation',request.url));
}