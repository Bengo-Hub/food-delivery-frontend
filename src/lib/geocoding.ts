/**
 * OpenStreetMap Nominatim reverse geocoding utility
 * Converts lat/lng coordinates to human-readable address
 */

interface NominatimResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  boundingbox: string[];
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` +
        `format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent": "Codevertex-Ordering-App/1.0",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: NominatimResponse = await response.json();

    // Extract meaningful location name
    const { address } = data;
    const parts: string[] = [];

    // Priority: road/neighbourhood, suburb/city
    if (address.road) parts.push(address.road);
    else if (address.neighbourhood) parts.push(address.neighbourhood);

    if (address.suburb) parts.push(address.suburb);
    else if (address.city) parts.push(address.city);

    // Return formatted location or fallback to display_name
    return parts.length > 0 ? parts.join(", ") : data.display_name;
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return null;
  }
}

/**
 * Get short location name (e.g., "Kinoo Road, Nairobi")
 */
export async function getShortLocationName(latitude: number, longitude: number): Promise<string> {
  const location = await reverseGeocode(latitude, longitude);

  if (!location) {
    // Fallback to coordinates
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }

  // Extract first two meaningful parts for short name
  const parts = location.split(",").slice(0, 2);
  return parts.join(",").trim();
}
