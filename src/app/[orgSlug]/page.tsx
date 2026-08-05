"use client";

/**
 * Homepage thin shell — resolves the tenant/outlet's effective ordering profile
 * (useOrderingConfig) and renders the matching per-profile view. Mirrors the
 * pos-ui pattern: "thin shell selects a per-use-case view, shared building
 * blocks stay shared." Each view owns its own SiteShell wrapper (some profiles
 * need different SiteShell props, e.g. FoodHomeView's pickup-mode layout).
 */

import { FoodHomeView } from "@/components/home/food-home-view";
import { RetailHomeView } from "@/components/home/retail-home-view";
import { ServicesHomeView } from "@/components/home/services-home-view";
import { useOrderingConfig } from "@/hooks/use-ordering-config";

export default function HomePage() {
  const { profile } = useOrderingConfig();

  switch (profile) {
    case "hospitality":
    case "quick_service":
      return <FoodHomeView />;
    case "retail":
    case "pharmacy":
    case "wholesale":
      return <RetailHomeView />;
    case "services":
    case "ticketing":
    case "general":
    default:
      return <ServicesHomeView />;
  }
}
