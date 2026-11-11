import type { Metadata } from 'next';
import { RoleProvider } from '@/components/RoleContext';
import TopBar from '@/components/landing/TopBar';
import Nav from '@/components/landing/Nav';
import Hero from '@/components/landing/Hero';
import Stats from '@/components/landing/Stats';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import Providers from '@/components/landing/Providers';
import FoundingPerks from '@/components/landing/FoundingPerks';
import Apply from '@/components/landing/Apply';
import Moments from '@/components/landing/Moments';
import WaitlistCta from '@/components/landing/WaitlistCta';
import Footer from '@/components/landing/Footer';

const TITLE = 'QuickGift: Same-Day Gifts & Artisans in Nigeria';
const SITE = 'https://www.quickgift.ng';

export const metadata: Metadata = {
  title: TITLE,
  keywords:
    'gifts Nigeria, same day delivery, gift delivery Lagos, artisans, beauty services, cakes, flowers, nail tech, hair stylist, tailor, photographer, QuickGift',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: `${SITE}/`,
    title: TITLE,
    description:
      'Send same-day gifts and book verified artisans across Lagos & Abuja. Cakes, flowers, hampers, nail techs, stylists and more.',
    images: [`${SITE}/logo.png`],
    siteName: 'QuickGift',
    locale: 'en_NG',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: 'Send same-day gifts and book verified artisans across Nigeria.',
    images: [`${SITE}/logo.png`],
  },
};

// Structured data for search engines.
const JSON_LD = [
  {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: 'QuickGift',
    operatingSystem: 'iOS, Android',
    applicationCategory: 'ShoppingApplication',
    description: 'Same-day gift delivery and artisan services marketplace in Nigeria',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'NGN' },
    provider: {
      '@type': 'Organization',
      name: 'QuickGift',
      url: SITE,
      logo: `${SITE}/logo.png`,
      sameAs: [],
      address: { '@type': 'PostalAddress', addressCountry: 'NG', addressLocality: 'Lagos' },
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'QuickGift',
    url: SITE,
    description: 'Same-day gift delivery and artisan services in Nigeria',
  },
];

export default function HomePage() {
  return (
    <RoleProvider>
      {JSON_LD.map((data) => (
        <script
          key={data['@type']}
          type="application/ld+json"
          // Static data defined above: nothing here comes from a visitor.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
      <TopBar />
      <Nav />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Providers />
      <FoundingPerks />
      <Apply />
      <Moments />
      <WaitlistCta />
      <Footer />
    </RoleProvider>
  );
}
