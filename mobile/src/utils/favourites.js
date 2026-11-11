// Saved gifts ("hearts"), kept on this device.
//
//   @favorites        array of product ids (what the heart on a gift toggles)
//   @favorites_items  id → a small snapshot of the product, so the Favourites
//                     screen can list them without a network round trip
//
// Ids saved before snapshots existed are filled in from the API on demand.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { productsAPI } from '../services/api';

const IDS_KEY = '@favorites';
const ITEMS_KEY = '@favorites_items';

const readJson = async (key, fallback) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : fallback;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const snapshot = (gift) => ({
  id: gift.id,
  name: gift.name,
  price: gift.price,
  image_url: gift.image_url || null,
  vendor_name: gift.vendor_name || null,
  category: gift.category || gift.category_name || null,
  category_id: gift.category_id || null,
  rating: gift.rating ?? null,
});

export async function getFavouriteIds() {
  const ids = await readJson(IDS_KEY, []);
  return Array.isArray(ids) ? ids : [];
}

export async function isFavourite(id) {
  return (await getFavouriteIds()).includes(id);
}

/** Adds or removes a gift. Resolves to true when it is now a favourite. */
export async function toggleFavourite(gift) {
  if (!gift?.id) return false;
  const ids = await getFavouriteIds();
  const items = await readJson(ITEMS_KEY, {});
  const saved = ids.includes(gift.id);
  const nextIds = saved ? ids.filter((id) => id !== gift.id) : [...ids, gift.id];
  if (saved) delete items[gift.id];
  else items[gift.id] = snapshot(gift);
  await AsyncStorage.setItem(IDS_KEY, JSON.stringify(nextIds));
  await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  return !saved;
}

export async function removeFavourite(id) {
  const ids = await getFavouriteIds();
  const items = await readJson(ITEMS_KEY, {});
  delete items[id];
  await AsyncStorage.setItem(IDS_KEY, JSON.stringify(ids.filter((x) => x !== id)));
  await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

/** The saved gifts, newest first. */
export async function listFavourites() {
  const ids = await getFavouriteIds();
  const items = await readJson(ITEMS_KEY, {});
  let changed = false;

  // Fill in any id that has no snapshot yet (saved by an older build).
  await Promise.all(
    ids.filter((id) => !items[id]).map(async (id) => {
      try {
        const res = await productsAPI.get(id);
        if (res.data?.id) {
          items[id] = snapshot(res.data);
          changed = true;
        }
      } catch {
        // Leave it out of the list; it may have been removed from the store.
      }
    }),
  );
  if (changed) {
    AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(items)).catch(() => {});
  }
  return ids.map((id) => items[id]).filter(Boolean).reverse();
}
