"use client";

import { useOutlets } from "@/hooks/use-catalog";
import { useOrgSlug } from "@/providers/org-slug-provider";
import type { OutletFilters } from "@/types/catalog";

interface LocationParam {
  lat: number;
  lng: number;
}

/**
 * Parallel TanStack queries for each landing-page outlet section.
 * Each query runs independently so sections load as data arrives.
 */
export function useOutletSections(location?: LocationParam | null) {
  const orgSlug = useOrgSlug();

  const loc: Pick<OutletFilters, "lat" | "lng"> =
    location ? { lat: location.lat, lng: location.lng } : {};

  // Featured / promoted outlets
  const featured = useOutlets(orgSlug, { sort: "relevance", offers: true, ...loc }, 1, 6);

  // Most reviewed — sorted by rating (highest first)
  const mostReviewed = useOutlets(orgSlug, { sort: "rating", ...loc }, 1, 8);

  // Stores near you — sorted by distance
  const nearYou = useOutlets(orgSlug, { sort: "distance", ...loc }, 1, 8);

  // Popular in your area — high-rated only
  const popular = useOutlets(orgSlug, { sort: "rating", minRating: 4.0, ...loc }, 1, 8);

  // Today's offers
  const todaysOffers = useOutlets(orgSlug, { offers: true, ...loc }, 1, 8);

  // All stores (initial page, larger batch)
  const allStores = useOutlets(orgSlug, { sort: "relevance", ...loc }, 1, 50);

  return { featured, mostReviewed, nearYou, popular, todaysOffers, allStores };
}
