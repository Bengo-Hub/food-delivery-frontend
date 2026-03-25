import type { LatLngTuple } from "leaflet";

/**
 * Optional search bounds for biasing Nominatim results.
 * Previously hardcoded to Busia. Now configurable via `createBounds()`.
 * Pass `null` to search globally.
 */
export interface SearchBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/** Default bounds kept for backward-compat; consumers should migrate away. */
export const BUSIA_BOUNDS: SearchBounds = {
  minLat: -0.35,
  maxLat: 0.25,
  minLng: 33.95,
  maxLng: 34.75,
};

/**
 * Creates search bounds from a center point and a radius in degrees.
 */
export function createBounds(center: LatLngTuple, radiusDeg = 0.3): SearchBounds {
  return {
    minLat: center[0] - radiusDeg,
    maxLat: center[0] + radiusDeg,
    minLng: center[1] - radiusDeg,
    maxLng: center[1] + radiusDeg,
  };
}

/**
 * Check whether a coordinate falls within the given bounds.
 * If no bounds are provided, always returns true (global mode).
 */
export function isWithinBounds([lat, lng]: LatLngTuple, bounds?: SearchBounds | null): boolean {
  if (!bounds) return true;
  return (
    lat >= bounds.minLat &&
    lat <= bounds.maxLat &&
    lng >= bounds.minLng &&
    lng <= bounds.maxLng
  );
}

/**
 * @deprecated Use `isWithinBounds` with explicit bounds instead.
 */
export function isWithinBusia(coords: LatLngTuple): boolean {
  return isWithinBounds(coords, BUSIA_BOUNDS);
}
