import { api } from "./base";

// ─── Types ───────────────────────────────────────────────────────────
//
// These match the ordering-backend Google Business Profile DTOs exactly:
//   - StatusResult  → internal/modules/googlebusiness/service.go  (json: configured,
//     connected, status, location_name, place_id)
//   - Location      → internal/modules/googlebusiness/client.go   (name, title,
//     storeCode, metadata.placeId/mapsUri/newReviewUri); list handler wraps in
//     { data, total } (handler.go ListLocations).
//   - Review        → internal/modules/googlebusiness/client.go   (name, reviewId,
//     comment, starRating, createTime, updateTime, reviewer.displayName/
//     profilePhotoUrl, reviewReply.comment/updateTime); list wrapped in { data, total }.
//   - SelectLocation request → handler.go selectLocationRequest
//     (json: location_name, place_id, display_name).
//   - Reply request → handler.go replyRequest (json: comment).
//   - Connect      → 200 { auth_url } or 503 { error } when OAuth env unset.
//
// Routes live under /api/v1/{tenant}/admin/integrations/google/* and the {tenant}
// segment is the org slug (resolved by TenantV2 middleware), like every other
// ordering route reached via useOrgSlug().

/** GET admin/integrations/google/status */
export interface GoogleStatus {
  configured: boolean;
  connected: boolean;
  status: string;
  location_name: string;
  place_id: string;
}

/** GET admin/integrations/google/connect → { auth_url } */
export interface GoogleAuthURL {
  auth_url: string;
}

/** A Google Business Profile location (client.go Location). */
export interface GoogleLocation {
  name: string;
  title: string;
  storeCode: string;
  metadata: {
    placeId: string;
    mapsUri: string;
    newReviewUri: string;
  };
}

/** A single Google review (client.go Review). */
export interface GoogleReview {
  name: string;
  reviewId: string;
  comment: string;
  starRating: string;
  createTime: string;
  updateTime: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl: string;
  };
  reviewReply: {
    comment: string;
    updateTime: string;
  } | null;
}

/** PUT admin/integrations/google/location request body (handler.go selectLocationRequest). */
export interface SelectLocationRequest {
  location_name: string;
  place_id: string;
  display_name: string;
}

// ─── API Functions ───────────────────────────────────────────────────

/** Read the GBP connection status. Always answerable (configured:false when OAuth env unset). */
export async function getGoogleStatus(slug: string): Promise<GoogleStatus> {
  const res = await api.get(`${slug}/admin/integrations/google/status`);
  const d = res.data ?? {};
  return {
    configured: !!d.configured,
    connected: !!d.connected,
    status: d.status ?? "disconnected",
    location_name: d.location_name ?? "",
    place_id: d.place_id ?? "",
  };
}

/** Begin the OAuth connect flow — returns the Google consent URL to redirect to. */
export async function getGoogleAuthUrl(slug: string): Promise<string> {
  const res = await api.get(`${slug}/admin/integrations/google/connect`);
  return res.data?.auth_url ?? "";
}

/** List the locations available on the connected Google account. Shape: { data, total }. */
export async function listGoogleLocations(slug: string): Promise<GoogleLocation[]> {
  const res = await api.get(`${slug}/admin/integrations/google/locations`);
  // Handle defensively: handler wraps in { data, total } but tolerate a bare array.
  const raw = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
  return (raw as Array<Record<string, unknown>>).map(normalizeLocation);
}

/** Persist the chosen location + place_id. */
export async function selectGoogleLocation(
  slug: string,
  body: SelectLocationRequest,
): Promise<void> {
  await api.put(`${slug}/admin/integrations/google/location`, body);
}

/** List the connected location's reviews. Shape: { data, total }. */
export async function listGoogleReviews(slug: string): Promise<GoogleReview[]> {
  const res = await api.get(`${slug}/admin/integrations/google/reviews`);
  const raw = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
  return (raw as Array<Record<string, unknown>>).map(normalizeReview);
}

/** Post an owner reply to a single review. */
export async function replyToGoogleReview(
  slug: string,
  reviewId: string,
  comment: string,
): Promise<void> {
  await api.post(
    `${slug}/admin/integrations/google/reviews/${encodeURIComponent(reviewId)}/reply`,
    { comment },
  );
}

/** Disconnect — clears stored tokens for the tenant. */
export async function disconnectGoogle(slug: string): Promise<void> {
  await api.delete(`${slug}/admin/integrations/google/connect`);
}

// ─── Defensive normalisers ────────────────────────────────────────────
//
// The locations/reviews payloads originate from Google's API and the backend
// passes the shapes through; field names "may vary", so normalise tolerantly
// (accepting a few alternate keys) into the typed shape the UI relies on.

function asString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function normalizeLocation(raw: Record<string, unknown>): GoogleLocation {
  const metadata = (raw.metadata as Record<string, unknown> | undefined) ?? {};
  return {
    name: asString(raw.name ?? raw.location_id ?? raw.locationId),
    title: asString(raw.title ?? raw.location_name ?? raw.locationName ?? raw.displayName),
    storeCode: asString(raw.storeCode ?? raw.store_code),
    metadata: {
      placeId: asString(metadata.placeId ?? metadata.place_id ?? raw.place_id ?? raw.placeId),
      mapsUri: asString(metadata.mapsUri ?? metadata.maps_uri),
      newReviewUri: asString(metadata.newReviewUri ?? metadata.new_review_uri),
    },
  };
}

function normalizeReview(raw: Record<string, unknown>): GoogleReview {
  const reviewer = (raw.reviewer as Record<string, unknown> | undefined) ?? {};
  const reply = (raw.reviewReply ?? raw.review_reply) as Record<string, unknown> | undefined | null;
  return {
    name: asString(raw.name),
    reviewId: asString(raw.reviewId ?? raw.review_id ?? raw.name),
    comment: asString(raw.comment),
    starRating: asString(raw.starRating ?? raw.star_rating),
    createTime: asString(raw.createTime ?? raw.create_time),
    updateTime: asString(raw.updateTime ?? raw.update_time),
    reviewer: {
      displayName: asString(reviewer.displayName ?? reviewer.display_name),
      profilePhotoUrl: asString(reviewer.profilePhotoUrl ?? reviewer.profile_photo_url),
    },
    reviewReply: reply
      ? {
          comment: asString(reply.comment),
          updateTime: asString(reply.updateTime ?? reply.update_time),
        }
      : null,
  };
}

/** Map Google's enum star rating ("FIVE", "FOUR", …) to a 1–5 number (0 when unknown). */
export function starRatingToNumber(rating: string): number {
  switch (rating.toUpperCase()) {
    case "ONE":
      return 1;
    case "TWO":
      return 2;
    case "THREE":
      return 3;
    case "FOUR":
      return 4;
    case "FIVE":
      return 5;
    default: {
      const n = Number(rating);
      return Number.isFinite(n) ? n : 0;
    }
  }
}
