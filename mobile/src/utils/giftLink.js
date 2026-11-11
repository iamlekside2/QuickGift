import { Share } from 'react-native';

/**
 * Opens the share sheet with the "tell us where to deliver" link for a gift
 * that was ordered without an address. Returns false if there is no link.
 */
export async function shareGiftLink(order) {
  if (!order?.claim_url) return false;
  const first = String(order.recipient_name || '').trim().split(/\s+/)[0];
  try {
    await Share.share({
      message:
        `${first ? `Hi ${first}, a` : 'A'} gift is waiting for you on QuickGift. ` +
        `Tap this link and tell us where to deliver it:\n\n${order.claim_url}`,
    });
    return true;
  } catch {
    // The share sheet was dismissed or is unavailable.
    return false;
  }
}
