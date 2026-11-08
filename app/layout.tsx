import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const ui = localFont({
  src: '../node_modules/@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2',
  weight: '400 900',
  variable: '--font-ui',
  display: 'swap',
});
const mono = localFont({
  src: [
    { path: '../node_modules/@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff2', weight: '400' },
    { path: '../node_modules/@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff2', weight: '500' },
  ],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Firn', template: '%s · Firn' },
  description: 'A savings platform connecting users to property-backed investment opportunities. Targets are not guarantees; capital can be lost.',
  applicationName: 'Firn',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: '/icon-192.svg' },
  openGraph: {
    title: 'Firn',
    description: 'A savings platform connecting users to property-backed investment opportunities. Targets are not guarantees; capital can be lost.',
    images: ['/opengraph-image'],
    type: 'website',
  },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export const viewport: Viewport = {
  themeColor: '#08141D',
  colorScheme: 'dark light',
};

const themeScript = `(function(){try{var t=localStorage.getItem('firn-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t)}else{document.documentElement.removeAttribute('data-theme')}}catch(e){}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className={`${ui.variable} ${mono.variable}`}>
        {children}
      </body>
    </html>
  );
}
