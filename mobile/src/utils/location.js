import * as Location from 'expo-location';

/**
 * Request foreground location permission.
 * Returns true if granted.
 */
export async function requestLocationPermission() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

/**
 * Get the user's current GPS coordinates.
 * Returns { lat, lng } or null if permission denied.
 */
export async function getCurrentCoordinates() {
  const granted = await requestLocationPermission();
  if (!granted) return null;

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High, // High accuracy for precise area matching
  });

  return {
    lat: location.coords.latitude,
    lng: location.coords.longitude,
  };
}

/**
 * Reverse geocode coordinates to get the EXACT area/neighbourhood name.
 * Uses OpenStreetMap Nominatim for Nigerian-specific area names
 * (Bogije, Elemoro, Sangotedo, etc.) that Expo's built-in geocoder misses.
 *
 * Priority: neighbourhood > suburb > village > town > city_district > city
 *
 * @returns { areaName: string, fullAddress: string } or null
 */
export async function reverseGeocode(lat, lng) {
  // Try Nominatim first (gives neighbourhood-level names for Nigeria)
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'QuickGift/1.0 (contact@quickgift.ng)',
          'Accept-Language': 'en',
        },
      }
    );

    if (resp.ok) {
      const data = await resp.json();
      const addr = data.address || {};

      // Extract area name in priority order — most specific first
      const areaName =
        addr.neighbourhood ||   // "Bogije", "Elemoro"
        addr.suburb ||           // "Sangotedo"
        addr.village ||          // Small settlements
        addr.town ||             // "Ajah"
        addr.city_district ||    // "Eti-Osa"
        addr.city ||             // "Lagos"
        addr.state ||            // "Lagos State"
        null;

      // Build a readable location string
      const parts = [];
      if (addr.neighbourhood) parts.push(addr.neighbourhood);
      if (addr.suburb && addr.suburb !== addr.neighbourhood) parts.push(addr.suburb);
      if (addr.city_district && !parts.includes(addr.city_district)) parts.push(addr.city_district);
      if (addr.city && !parts.includes(addr.city)) parts.push(addr.city);
      if (addr.state && !parts.includes(addr.state)) parts.push(addr.state);

      const fullAddress = parts.join(', ') || data.display_name || '';

      if (areaName) {
        return areaName;
      }
    }
  } catch (e) {
    // Nominatim failed — fall back to Expo's geocoder
  }

  // Fallback: Expo's built-in reverse geocoder
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });
    if (results.length > 0) {
      const { name, street, district, subregion, city, region } = results[0];
      // name often has the street/area, district is LGA
      return name || street || district || subregion || city || region || 'Unknown';
    }
  } catch (e) {
    // Both failed
  }

  return null;
}
