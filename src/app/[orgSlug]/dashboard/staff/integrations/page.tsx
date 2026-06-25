"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  MapPin,
  MessageSquare,
  Star,
  Unplug,
} from "lucide-react";

import { RequireAuth } from "@/components/auth/require-auth";
import { SiteShell } from "@/components/layout/site-shell";
import {
  useDisconnectGoogle,
  useGoogleConnect,
  useGoogleLocations,
  useGoogleReviews,
  useGoogleStatus,
  useReplyToGoogleReview,
  useSelectGoogleLocation,
} from "@/hooks/use-google";
import {
  starRatingToNumber,
  type GoogleLocation,
  type GoogleReview,
  type GoogleStatus,
} from "@/lib/api/google";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { apiErrorMessage } from "@/lib/api/error-message";

// ── Status card ───────────────────────────────────────────────────────────────

function StatusCard({ status }: { status: GoogleStatus }) {
  const connect = useGoogleConnect();
  const disconnect = useDisconnectGoogle();

  const handleConnect = () => {
    connect.mutate(undefined, {
      onSuccess: (authUrl) => {
        if (authUrl) {
          window.location.href = authUrl;
        } else {
          toast.error("Could not start the Google connection.");
        }
      },
      onError: async (err) => toast.error(await apiErrorMessage(err, "Could not start the Google connection.")),
    });
  };

  const handleDisconnect = () => {
    if (!confirm("Disconnect this Google Business Profile? Reviews will no longer sync.")) {
      return;
    }
    disconnect.mutate(undefined, {
      onSuccess: () => toast.success("Google Business Profile disconnected"),
      onError: async (err) => toast.error(await apiErrorMessage(err, "Failed to disconnect")),
    });
  };

  // Platform hasn't enabled the integration — inert friendly state, no connect button.
  if (!status.configured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="size-5" />
            Google Business Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Google Business Profile isn&apos;t enabled by the platform yet. Once the
            platform operator configures it, you&apos;ll be able to connect your
            business here to manage your Google reviews.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Configured + connected — show the linked location + disconnect.
  if (status.connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="size-5" />
            Google Business Profile
            <Badge variant="soft" className="ml-1 gap-1 text-[10px]">
              <CheckCircle2 className="size-3" /> Connected
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-muted-foreground">Location: </span>
              <span className="font-medium">
                {status.location_name || "No location selected yet"}
              </span>
            </p>
            {status.place_id ? (
              <p className="text-xs text-muted-foreground">
                Place ID: <code className="font-mono">{status.place_id}</code>
              </p>
            ) : null}
          </div>
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            disabled={disconnect.isPending}
            onClick={handleDisconnect}
          >
            {disconnect.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Unplug className="mr-2 size-4" />
            )}
            Disconnect
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Configured + not connected — offer the connect button.
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="size-5" />
          Google Business Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Connect your Google Business Profile to view and reply to your Google
          reviews from here.
        </p>
        <Button disabled={connect.isPending} onClick={handleConnect}>
          {connect.isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <MapPin className="mr-2 size-4" />
          )}
          Connect Google Business Profile
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Location picker ─────────────────────────────────────────────────────────────

function LocationPicker({ status }: { status: GoogleStatus }) {
  const { data: locations = [], isLoading, isError } = useGoogleLocations(status.connected);
  const select = useSelectGoogleLocation();
  const [selectingName, setSelectingName] = useState<string | null>(null);

  const handleSelect = (loc: GoogleLocation) => {
    setSelectingName(loc.name);
    select.mutate(
      {
        location_name: loc.name,
        place_id: loc.metadata.placeId,
        display_name: loc.title,
      },
      {
        onSuccess: () => toast.success(`Location set to ${loc.title || loc.name}`),
        onError: async (err) => toast.error(await apiErrorMessage(err, "Failed to select location")),
        onSettled: () => setSelectingName(null),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Couldn&apos;t load your Google locations. Try again shortly.
      </p>
    );
  }

  if (locations.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No locations found on this Google account.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {locations.map((loc) => {
        const isCurrent = !!status.location_name && status.location_name === loc.name;
        return (
          <div
            key={loc.name}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{loc.title || loc.name}</p>
              {loc.metadata.placeId ? (
                <p className="truncate text-xs text-muted-foreground">
                  Place ID: <code className="font-mono">{loc.metadata.placeId}</code>
                </p>
              ) : null}
            </div>
            {isCurrent ? (
              <Badge variant="soft" className="gap-1 text-[10px]">
                <CheckCircle2 className="size-3" /> Selected
              </Badge>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={selectingName === loc.name}
                onClick={() => handleSelect(loc)}
              >
                {selectingName === loc.name ? (
                  <Loader2 className="mr-1 size-3.5 animate-spin" />
                ) : null}
                {status.location_name ? "Switch to this" : "Select"}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Star rating ─────────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: string }) {
  const n = starRatingToNumber(rating);
  return (
    <div className="flex items-center gap-0.5" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={
            i <= n
              ? "size-4 fill-yellow-400 text-yellow-400"
              : "size-4 text-muted-foreground/40"
          }
        />
      ))}
    </div>
  );
}

// ── Single review row ─────────────────────────────────────────────────────────

function ReviewRow({ review }: { review: GoogleReview }) {
  const reply = useReplyToGoogleReview();
  const [draft, setDraft] = useState("");

  const handleReply = () => {
    const comment = draft.trim();
    if (!comment) {
      toast.error("Enter a reply first.");
      return;
    }
    reply.mutate(
      { reviewId: review.reviewId, comment },
      {
        onSuccess: () => {
          toast.success("Reply posted");
          setDraft("");
        },
        onError: async (err) => toast.error(await apiErrorMessage(err, "Failed to post reply")),
      },
    );
  };

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">{review.reviewer.displayName || "Anonymous"}</p>
        <span className="text-xs text-muted-foreground">
          {review.createTime ? new Date(review.createTime).toLocaleDateString() : ""}
        </span>
      </div>
      <div className="mt-1">
        <StarRating rating={review.starRating} />
      </div>
      {review.comment ? (
        <p className="mt-2 text-sm">{review.comment}</p>
      ) : (
        <p className="mt-2 text-sm italic text-muted-foreground">No comment left.</p>
      )}

      {review.reviewReply ? (
        <div className="mt-3 rounded-md border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your reply
          </p>
          <p className="mt-1 text-sm">{review.reviewReply.comment}</p>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <Textarea
            placeholder="Write a public reply…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
          />
          <Button size="sm" disabled={reply.isPending} onClick={handleReply}>
            {reply.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <MessageSquare className="mr-2 size-4" />
            )}
            Reply
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Reviews section ─────────────────────────────────────────────────────────────

function ReviewsSection({ enabled }: { enabled: boolean }) {
  const { data: reviews = [], isLoading, isError } = useGoogleReviews(enabled);

  if (!enabled) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="size-5" />
          Reviews
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Couldn&apos;t load reviews. Select a location, then try again.
          </p>
        ) : reviews.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No reviews yet.
          </p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <ReviewRow key={r.reviewId || r.name} review={r} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Content (inside RequireAuth) ────────────────────────────────────────────────

function IntegrationsContent() {
  const { data: status, isLoading } = useGoogleStatus();
  const searchParams = useSearchParams();
  const toastedRef = useRef(false);

  // Handle the post-callback return. The backend callback redirects to
  // GOOGLE_FRONTEND_INTEGRATIONS_URL with ?integration=google&status=<status>
  // (see service.go FrontendRedirect). Surface a toast once on mount.
  useEffect(() => {
    if (toastedRef.current) return;
    const integration = searchParams.get("integration");
    const callbackStatus = searchParams.get("status");
    // Also tolerate the simpler markers mentioned in the spec.
    const connectedFlag =
      searchParams.get("connected") === "1" || searchParams.get("google") === "connected";

    if (integration === "google" && callbackStatus) {
      toastedRef.current = true;
      if (callbackStatus === "connected") {
        toast.success("Google Business Profile connected");
      } else if (callbackStatus === "denied") {
        toast.error("Google connection was denied.");
      } else if (callbackStatus === "not_configured") {
        toast.error("Google integration isn't configured.");
      } else {
        toast.error("Google connection failed. Please try again.");
      }
    } else if (connectedFlag) {
      toastedRef.current = true;
      toast.success("Google Business Profile connected");
    }
  }, [searchParams]);

  if (isLoading || !status) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatusCard status={status} />

      {status.configured && status.connected ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-5" />
              {status.location_name ? "Switch location" : "Choose a location"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LocationPicker status={status} />
          </CardContent>
        </Card>
      ) : null}

      <ReviewsSection enabled={status.configured && status.connected} />
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────────

export default function GoogleIntegrationsPage() {
  return (
    <RequireAuth
      roles={["admin", "superuser", "manager"]}
      permissions={["ordering.config.manage"]}
      permissionOperator="or"
    >
      <SiteShell>
        <div className="mx-auto w-full max-w-3xl px-4 py-6">
          <header className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Integrations
            </p>
            <h1 className="text-2xl font-bold">Google Business Profile</h1>
            <p className="text-sm text-muted-foreground">
              Connect your Google Business Profile to view and reply to customer
              reviews.
            </p>
          </header>

          <IntegrationsContent />
        </div>
      </SiteShell>
    </RequireAuth>
  );
}
