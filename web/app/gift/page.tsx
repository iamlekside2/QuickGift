import type { Metadata } from 'next';
import GiftClaim from '@/components/GiftClaim';

// A personal link: keep it out of search results and out of referrers.
export const metadata: Metadata = {
  title: 'Someone sent you a gift | QuickGift',
  description: 'Tell us where to deliver your gift.',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function GiftPage() {
  return <GiftClaim />;
}
