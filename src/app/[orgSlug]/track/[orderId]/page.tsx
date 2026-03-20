"use client";

import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect } from "react";

import { SiteShell } from "@/components/layout/site-shell";

/**
 * Order Tracking Page — Redirects to the centralized logistics tracking service.
 *
 * All real-time tracking (rider location, ETA, status timeline) is handled by
 * the logistics-service at logistics.codevertexitsolutions.com/track/{orderId}.
 * This page simply redirects with the order ID.
 */
export default function TrackOrderPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;

  const logisticsUrl =
    process.env.NEXT_PUBLIC_LOGISTICS_UI_URL ??
    "https://logistics.codevertexitsolutions.com";

  useEffect(() => {
    if (orderId) {
      window.location.href = `${logisticsUrl}/track/${orderId}`;
    }
  }, [orderId, logisticsUrl]);

  return (
    <SiteShell>
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Redirecting to live tracking...
        </p>
      </div>
    </SiteShell>
  );
}
