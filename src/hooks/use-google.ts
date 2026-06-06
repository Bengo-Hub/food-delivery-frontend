"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  disconnectGoogle,
  getGoogleAuthUrl,
  getGoogleStatus,
  listGoogleLocations,
  listGoogleReviews,
  replyToGoogleReview,
  selectGoogleLocation,
  type GoogleLocation,
  type GoogleReview,
  type GoogleStatus,
  type SelectLocationRequest,
} from "@/lib/api/google";
import { useOrgSlug } from "@/providers/org-slug-provider";

// ─── Query Keys ──────────────────────────────────────────────────────

export const googleKeys = {
  all: ["google-integration"] as const,
  status: (slug: string) => [...googleKeys.all, "status", slug] as const,
  locations: (slug: string) => [...googleKeys.all, "locations", slug] as const,
  reviews: (slug: string) => [...googleKeys.all, "reviews", slug] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────

/** Read the GBP connection status (always answerable, even when unconfigured). */
export function useGoogleStatus() {
  const slug = useOrgSlug();
  return useQuery<GoogleStatus>({
    queryKey: googleKeys.status(slug),
    queryFn: () => getGoogleStatus(slug),
    enabled: !!slug,
    staleTime: 30_000,
  });
}

/**
 * List available Google locations. Only enabled when connected — listing requires
 * a valid token and would 503/502 otherwise.
 */
export function useGoogleLocations(enabled: boolean) {
  const slug = useOrgSlug();
  return useQuery<GoogleLocation[]>({
    queryKey: googleKeys.locations(slug),
    queryFn: () => listGoogleLocations(slug),
    enabled: !!slug && enabled,
    staleTime: 60_000,
    retry: false,
  });
}

/** List the connected location's reviews. Only enabled when connected. */
export function useGoogleReviews(enabled: boolean) {
  const slug = useOrgSlug();
  return useQuery<GoogleReview[]>({
    queryKey: googleKeys.reviews(slug),
    queryFn: () => listGoogleReviews(slug),
    enabled: !!slug && enabled,
    staleTime: 30_000,
    retry: false,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────

/** Fetch the OAuth consent URL (does not redirect — the caller decides). */
export function useGoogleConnect() {
  const slug = useOrgSlug();
  return useMutation<string>({
    mutationFn: () => getGoogleAuthUrl(slug),
  });
}

/** Select a location, invalidating status + reviews on success. */
export function useSelectGoogleLocation() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SelectLocationRequest) => selectGoogleLocation(slug, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: googleKeys.status(slug) });
      queryClient.invalidateQueries({ queryKey: googleKeys.reviews(slug) });
    },
  });
}

/** Reply to a review, invalidating the reviews list on success. */
export function useReplyToGoogleReview() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { reviewId: string; comment: string }) =>
      replyToGoogleReview(slug, args.reviewId, args.comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: googleKeys.reviews(slug) });
    },
  });
}

/** Disconnect, invalidating all GBP queries on success. */
export function useDisconnectGoogle() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => disconnectGoogle(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: googleKeys.all });
    },
  });
}
