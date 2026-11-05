import type { Metadata } from 'next';
import { Schibsted_Grotesk, DM_Mono } from 'next/font/google';
import './globals.css';
const ui = Schibsted_Grotesk({ subsets:['latin'], weight:['400','500','600','700','800'], variable:'--font-ui', display:'swap' });
const mono = DM_Mono({ subsets:['latin'], weight:['400','500'], variable:'--font-mono', display:'swap' });
export const metadata: Metadata = { title: 'Firn', description: 'Savings simulation. Targets are not guarantees.' };
const themeScript = `(function(){try{var t=localStorage.getItem('firn-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t)}else{document.documentElement.removeAttribute('data-theme')}}catch(e){}})()`;
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:themeScript}} /></head><body className={`${ui.variable} ${mono.variable}`}>{children}</body></html>;
}
