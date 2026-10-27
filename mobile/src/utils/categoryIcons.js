// Maps an occasion/category (by id or name) to an Ionicons outline name, so the
// UI always renders line icons regardless of what the backend stores (the live
// API currently returns emoji). Keeps the "no emoji" rule from the handoff.

const MAP = {
  // Occasions
  birthday: 'balloon-outline',
  anniversary: 'heart-outline',
  wedding: 'diamond-outline',
  graduation: 'school-outline',
  apology: 'flower-outline',
  'get well': 'medkit-outline',
  'get-well': 'medkit-outline',
  'just because': 'gift-outline',
  'just-because': 'gift-outline',
  christmas: 'snow-outline',
  eid: 'moon-outline',
  valentine: 'heart-circle-outline',
  "valentine's": 'heart-circle-outline',
  valentines: 'heart-circle-outline',

  // Gift categories
  cakes: 'cake-outline',
  'cakes & desserts': 'cake-outline',
  dessert: 'cake-outline',
  flowers: 'rose-outline',
  chocolates: 'candy-outline',
  'chocolates & snacks': 'candy-outline',
  snacks: 'candy-outline',
  hampers: 'basket-outline',
  'gift hampers': 'basket-outline',
  balloons: 'balloon-outline',
  'balloons & cards': 'balloon-outline',
  personalized: 'color-wand-outline',

  // Beauty / artisan categories
  nails: 'hand-left-outline',
  hair: 'cut-outline',
  'hair styling': 'cut-outline',
  makeup: 'brush-outline',
  barber: 'people-outline',
  waxing: 'sparkles-outline',
  massage: 'body-outline',
  tailoring: 'shirt-outline',
  photography: 'camera-outline',
  catering: 'restaurant-outline',
};

const FALLBACK = 'pricetag-outline';

// On-palette tint rotation for category/occasion tiles — used to give the row
// variety without depending on backend-stored colors (which are off-palette).
const PALETTE = ['#1F4A45', '#E8632F', '#7A5FA8', '#3E8E63', '#4C7CB0', '#B8862E', '#D24B4B', '#2F6E4C'];

export function colorFor(index = 0) {
  return PALETTE[index % PALETTE.length];
}

// Accepts a string (id or name) or an item {id, name, label, icon}.
// Resolves by id/name/label — deterministic line icons, ignoring any stored
// (possibly emoji) icon. Falls back to a stored ASCII Ionicons name, else FALLBACK.
export function iconFor(input) {
  if (!input) return FALLBACK;
  if (typeof input === 'object') {
    const byIdentity =
      MAP[String(input.id || '').toLowerCase()] ||
      MAP[String(input.name || '').toLowerCase()] ||
      MAP[String(input.label || '').toLowerCase()];
    if (byIdentity) return byIdentity;
    // Trust a stored icon only if it's a plain ASCII name (not emoji).
    if (typeof input.icon === 'string' && !/[^\x00-\x7F]/.test(input.icon) && input.icon.trim()) {
      return input.icon;
    }
    return FALLBACK;
  }
  return MAP[String(input).trim().toLowerCase()] || FALLBACK;
}
