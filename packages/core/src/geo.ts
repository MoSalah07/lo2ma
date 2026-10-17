import { SERVICE_AREA } from './rules.ts';
import type { LocalizedText } from './schemas/common.ts';
import type { GeoPoint } from './schemas/location.ts';
import type { Workplace } from './schemas/prefs.ts';

const EARTH_RADIUS_METERS = 6_371_000;
const radians = (degrees: number) => (degrees * Math.PI) / 180;

/** The distance between two points along the earth's surface (the haversine formula), in meters. */
export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Whether Lo2ma delivers to a point. */
export function isInServiceArea(point: GeoPoint): boolean {
  return distanceMeters(point, SERVICE_AREA.center) <= SERVICE_AREA.radiusMeters;
}

/**
 * The point rounded to about a meter (5 decimals): what a map pin is precise to, and a stable key for caching
 * what is at that point.
 */
export function roundPoint({ lat, lng }: GeoPoint): GeoPoint {
  const round = (value: number) => Math.round(value * 1e5) / 1e5;
  return { lat: round(lat), lng: round(lng) };
}

/**
 * A workplace at a point: named after a place the search found, or after what the map says is at a pinned point.
 * The point is the user's own (where the pin is), never the place's center.
 */
export function workplaceAt(
  named: { name: LocalizedText; area: LocalizedText },
  point: GeoPoint,
  details = '',
): Workplace {
  return { name: named.name, area: named.area, point: roundPoint(point), details: details.trim() };
}
