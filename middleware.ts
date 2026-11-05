import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/database.types';
export async function middleware(request: NextRequest) {
 const response = NextResponse.next({ request });
 const supabase = createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { get(name: string) { return request.cookies.get(name)?.value; }, set(name: string, value: string, options: any) { request.cookies.set({ name, value, ...options }); response.cookies.set({ name, value, ...options }); }, remove(name: string, options: any) { request.cookies.set({ name, value: '', ...options }); response.cookies.set({ name, value: '', ...options }); } } });
 const { data: { user } } = await supabase.auth.getUser(); const path = request.nextUrl.pathname;
 const guarded = ['/home','/properties','/save','/analytics','/savings','/wallet','/tools','/learn','/settings','/profile','/kyc','/ready'];
 if (!user && guarded.some(p => path === p || path.startsWith(p + '/'))) return NextResponse.redirect(new URL('/welcome', request.url));
 if (user && ['/welcome','/login','/signup'].includes(path)) return NextResponse.redirect(new URL('/home', request.url));
 if (path === '/') return NextResponse.redirect(new URL(user ? '/home' : '/welcome', request.url));
 return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'] };
