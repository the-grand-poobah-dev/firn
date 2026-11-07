'use client';
import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import {Button} from '@/components/ui/Button';
export function VerifyForm(){
 const email=useSearchParams().get('email')||'your email address';
 return <div className="space-y-5">
  <div className="rounded-2xl border border-line bg-card2 p-4">
   <p className="text-sm font-semibold">Your confirmation link is on its way</p>
   <p className="mt-2 text-sm leading-relaxed text-muted">We sent a confirmation link to <strong className="text-fg">{email}</strong>. Open that email and select the confirmation link to activate your account. You do not need to enter a code.</p>
  </div>
  <p className="text-xs text-muted">If it is not in your inbox, check your spam or promotions folder. You can request another confirmation email from the sign-up screen.</p>
  <Link href="/login" className="block"><Button className="w-full">Continue to sign in</Button></Link>
  <p className="text-center text-xs text-muted">Having trouble? <a className="text-accent" href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL||'admin@firn.investing'}`}>Contact support</a>.</p>
 </div>;
}