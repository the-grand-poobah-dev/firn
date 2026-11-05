import{createServerClient,type CookieOptions}from'@supabase/ssr';import{NextResponse,type NextRequest}from'next/server';import type{Database}from'@/lib/database.types';
const guarded=['/home','/properties','/save','/analytics','/savings','/wallet','/tools','/learn','/settings','/profile','/kyc','/ready','/passcode'];const authPages=['/welcome','/login','/signup'];
export async function middleware(req:NextRequest){const res=NextResponse.next({request:req});const path=req.nextUrl.pathname;const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if(!url||!key){if(path==='/'||guarded.some(p=>path===p||path.startsWith(p+'/')))return NextResponse.redirect(new URL('/welcome',req.url));return res}
let sb;try{sb=createServerClient<Database>(url,key,{cookies:{get(n){return req.cookies.get(n)?.value},set(n,v,o:CookieOptions){req.cookies.set({name:n,value:v,...o});res.cookies.set({name:n,value:v,...o})},remove(n,o:CookieOptions){req.cookies.set({name:n,value:'',...o});res.cookies.set({name:n,value:'',...o})}}})}catch{return res}
let user=null;try{user=(await sb.auth.getUser()).data.user}catch{}
if(!user&&guarded.some(p=>path===p||path.startsWith(p+'/')))return NextResponse.redirect(new URL('/welcome',req.url));
if(user&&authPages.includes(path))return NextResponse.redirect(new URL('/home',req.url));
if(path==='/')return NextResponse.redirect(new URL(user?'/home':'/welcome',req.url));return res}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']};