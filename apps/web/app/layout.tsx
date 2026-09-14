import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import type { ReactNode } from 'react';
import { StoreProvider } from '@/lib/store';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'foodplanr',
  description: 'Madplan og indkøb på tværs af kæder. Svar på 5 spørgsmål, få ugens plan og en indkøbsliste pr. butik.',
  applicationName: 'foodplanr',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'foodplanr', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#7d3cd6',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="da" className={manrope.variable}>
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
