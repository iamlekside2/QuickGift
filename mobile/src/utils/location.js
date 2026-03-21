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
    accuracy: Location.Accuracy.Balanced, // ~100m, fast
  });

  return {
    lat: location.coords.latitude,
    lng: location.coords.longitude,
  };
}

/**
 * Reverse geocode coordinates to an area name.
 * Returns a string like "Lekki" or null.
 */
export async function reverseGeocode(lat, lng) {
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });
    if (results.length > 0) {
      const { district, subregion, city, region } = results[0];
      // Prefer district (neighborhood) > subregion (LGA) > city
      return district || subregion || city || region || 'Unknown';
    }
  } catch (e) {
    console.log('Reverse geocode error:', e);
  }
  return null;
}
