import type { Metadata } from 'next';
import GroupGift from '@/components/GroupGift';

// A personal link: keep it out of search results and out of referrers.
export const metadata: Metadata = {
  title: 'Chip in for a gift | QuickGift',
  description: 'Friends are putting money together for a gift. Add your share.',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function GroupPage() {
  return <GroupGift />;
}
