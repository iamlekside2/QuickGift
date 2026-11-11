import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

// Fonts are downloaded at build time and served from the site itself.
const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
  // No size-adjusted backup font: characters these fonts lack (the naira sign,
  // arrows) must fall back to the plain system font, as on the original page.
  adjustFontFallback: false,
});
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.quickgift.ng'),
  title: 'QuickGift: Same-Day Gifts & Artisans in Nigeria',
  description:
    'Send same-day gifts and book verified artisans across Lagos & Abuja. Bakers, florists, nail techs, stylists and more: join the waitlist for first access when QuickGift launches.',
  authors: [{ name: 'QuickGift' }],
  icons: { icon: '/logo.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1F4A45',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${jakarta.variable}`}>
      <body>{children}</body>
    </html>
  );
}
