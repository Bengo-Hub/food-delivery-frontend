import { api } from "./base";

// ─── Google Business Profile ─────────────────────────────────────────

interface GoogleReviewUrlResponse {
  review_url: string;
}

/**
 * Fetch the tenant's "Review us on Google" deep link from service config.
 * Public endpoint (no auth) so guest post-rating pages can render the CTA.
 * Returns an empty string when the tenant has not configured a review URL.
 */
export async function getGoogleReviewUrl(tenantSlug: string): Promise<string> {
  const res = await api.get<GoogleReviewUrlResponse>(
    `${tenantSlug}/integrations/google/review-url`,
  );
  return res.data?.review_url ?? "";
}
