"use client";

import { Loader2, MapPin, Store } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { TenantCard, TenantCardSkeleton } from "@/components/marketplace/tenant-card";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { useMarketplaceTenants } from "@/hooks/use-marketplace-tenants";
import { getShortLocationName } from "@/lib/geocoding";
import { useDiningModeStore } from "@/store/dining-mode";

/**
 * Platform marketplace landing page — the root domain with NO tenant slug
 * (e.g. ordersapp.codevertexafrica.com). This is the Kilimall/Jiji.co.ke-style
 * generic shell listing every marketplace-visible tenant (ranked by
 * subscription tier by the backend); each tenant's OWN fully branded
 * storefront lives at /{slug} and is unchanged by this page.
 *
 * Location is captured here and written into the shared (non-tenant-scoped)
 * dining-mode store, so the tenant page the user clicks into opens straight
 * to "near you" sorted results instead of re-prompting for location.
 */
export default function MarketplaceLandingPage() {
  const deliveryLocation = useDiningModeStore((s) => s.deliveryLocation);
  const setDeliveryLocation = useDiningModeStore((s) => s.setDeliveryLocation);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "resolved" | "denied">(
    deliveryLocation ? "resolved" : "idle",
  );

  const requestLocation = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setLocationStatus("denied");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const address = await getShortLocationName(latitude, longitude);
        setDeliveryLocation({ address, latitude, longitude });
        setLocationStatus("resolved");
      },
      () => setLocationStatus("denied"),
    );
  };

  // Auto-request on first visit only (never re-prompt if a location is already saved).
  useEffect(() => {
    if (!deliveryLocation) requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: tenants, isLoading, isError } = useMarketplaceTenants();

  // "Top Stores" = the backend's own tier-desc ranking, taken as-is (no client re-sort).
  const topTenants = useMemo(() => tenants ?? [], [tenants]);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header — generic platform branding, never a tenant's */}
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-2 text-base font-bold text-foreground">
            <Image
              src={brand.assets.logo}
              alt={brand.name}
              width={28}
              height={28}
              className="h-7 w-7 rounded-full object-cover"
              priority
            />
            <span>{brand.name}</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-brand-surface/40 py-10 sm:py-16">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 text-center">
            <h1 className="text-2xl font-bold text-foreground sm:text-4xl">
              Order from your favourite local stores
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              Restaurants, retail shops, pharmacies, and more — all in one place.
            </p>

            {/* Location */}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              {locationStatus === "resolved" && deliveryLocation ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm">
                  <MapPin className="size-4 text-primary" />
                  {deliveryLocation.address}
                </span>
              ) : locationStatus === "loading" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-4 py-2 text-sm text-muted-foreground shadow-sm">
                  <Loader2 className="size-4 animate-spin" />
                  Finding your location&hellip;
                </span>
              ) : (
                <Button onClick={requestLocation} size="sm" variant="secondary">
                  <MapPin className="mr-1.5 size-4" />
                  Use my location
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Top Stores */}
        <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
          <div className="mb-4 flex items-center gap-2 sm:mb-6">
            <Store className="size-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground sm:text-2xl">Top Stores</h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <TenantCardSkeleton key={i} />
              ))}
            </div>
          ) : isError || topTenants.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
              <Store className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isError
                  ? "We couldn't load stores right now. Please try again shortly."
                  : "No stores are available yet. Check back soon."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {topTenants.map((tenant) => (
                <TenantCard key={tenant.id} tenant={tenant} />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-border py-6">
        <div className="mx-auto w-full max-w-6xl px-4 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {brand.name}. Powered by Codevertex.
        </div>
      </footer>
    </div>
  );
}
