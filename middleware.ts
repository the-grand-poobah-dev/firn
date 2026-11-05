import {createServerClient,type CookieOptions} from '@supabase/ssr';
import {NextResponse,type NextRequest} from 'next/server';
import type {Database} from '@/lib/database.types';
const guarded=['/home','/properties','/save','/analytics','/savings','/wallet','/tools','/learn','/settings','/profile','/kyc','/ready'];
const authPages=['/welcome','/login','/signup'];
export async function middleware(request:NextRequest){
 const response=NextResponse.next({request});
 const path=request.nextUrl.pathname;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key){
  if(path==='/')return NextResponse.redirect(new URL('/welcome',request.url));
  if(guarded.some(p=>path===p||path.startsWith(p+'/')))return NextResponse.redirect(new URL('/welcome',request.url));
  return response;
 }
 const supabase=createServerClient<Database>(url,key,{cookies:{
  get(name:string){return request.cookies.get(name)?.value;},
  set(name:string,value:string,options:CookieOptions){request.cookies.set({name,value,...options});response.cookies.set({name,value,...options});},
  remove(name:string,options:CookieOptions){request.cookies.set({name,value:'',...options});response.cookies.set({name,value:'',...options});}
 }});
 let user=null;
 try{const result=await supabase.auth.getUser();user=result.data.user;}catch{user=null;}
 if(!user&&guarded.some(p=>path===p||path.startsWith(p+'/')))return NextResponse.redirect(new URL('/welcome',request.url));
 if(user&&authPages.includes(path))return NextResponse.redirect(new URL('/home',request.url));
 if(path==='/')return NextResponse.redirect(new URL(user?'/home':'/welcome',request.url));
 return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']};