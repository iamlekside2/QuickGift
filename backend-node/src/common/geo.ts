/** Haversine distance in km — mirrors app/utils/geo.py. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371.0;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dlat = toRad(lat2 - lat1);
  const dlng = toRad(lng2 - lng1);
  const a =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dlng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
