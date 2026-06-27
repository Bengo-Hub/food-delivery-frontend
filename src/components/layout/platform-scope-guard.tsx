"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { useAuthStore } from "@/store/auth";

/**
 * Platform separation guard (see plan: platform-owner-self-tenant-separation).
 *
 * Model = "Dedicated Platform section": the main app is the platform owner's OWN
 * business (own-tenant scope by default) and any cross-tenant drill-in is confined
 * to `/platform/*`. ordering-frontend has NO `?tenantId=` drill-in today — the
 * apiClient (`src/lib/api/base.ts`) always sends the owner's own `X-Tenant-ID` /
 * `X-Tenant-Slug` from the `tenantId`/`tenantSlug` written to localStorage at login,
 * and the /platform page reads cross-tenant data via backend admin endpoints only.
 *
 * This is a defensive belt-and-suspenders: whenever the route is NOT under
 * `/platform`, re-pin localStorage to the authenticated owner's own tenant so a
 * hypothetical future stray write cannot leak a foreign tenant into business pages.
 * If a real platform drill-in is ever added, it must write `tenantId` only while on
 * `/platform` — this effect still clears it on the way out.
 */
export function PlatformScopeGuard() {
  const pathname = usePathname() || "";
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (/\/platform(\/|$)/.test(pathname)) return;

    const ownTenantId = user?.tenant_id;
    const ownTenantSlug = user?.tenant_slug;

    if (ownTenantId && localStorage.getItem("tenantId") !== ownTenantId) {
      localStorage.setItem("tenantId", ownTenantId);
    }
    if (ownTenantSlug && localStorage.getItem("tenantSlug") !== ownTenantSlug) {
      localStorage.setItem("tenantSlug", ownTenantSlug);
    }
  }, [pathname, user?.tenant_id, user?.tenant_slug]);

  return null;
}
