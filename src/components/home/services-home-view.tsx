"use client";

/**
 * ServicesHomeView — the services/ticketing homepage. Lighter touch than
 * FoodHomeView: outlets are still outlets to browse (salons, spas, event
 * venues/providers), so this reuses the same outlet-section rail structure,
 * but drops food-specific chrome (CategoryCarousel icon rail, FilterBar's
 * hardcoded cuisine chips) and routes all copy through use-case-copy.ts
 * instead of hardcoded "restaurants"/"stores" strings.
 */

import { MapPin, Star, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { toCardProps } from "@/components/home/home-helpers";
import { SiteShell } from "@/components/layout/site-shell";
import { OutletSection } from "@/components/outlet/outlet-section";
import { PromoBannerCarousel } from "@/components/promo/promo-banner-carousel";
import { Button } from "@/components/ui/button";
import { useOrderingConfig } from "@/hooks/use-ordering-config";
import { useOutletSections } from "@/hooks/use-outlet-sections";
import { usePromoBanners } from "@/hooks/use-promo-banners";
import { orgRoute } from "@/lib/routes";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useDiningModeStore } from "@/store/dining-mode";

export function ServicesHomeView() {
  const orgSlug = useOrgSlug();
  const { useCase: effectiveUseCase, copy } = useOrderingConfig();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const deliveryLocation = useDiningModeStore((state) => state.deliveryLocation);
  const location = useMemo(
    () =>
      deliveryLocation
        ? { lat: deliveryLocation.latitude, lng: deliveryLocation.longitude }
        : null,
    [deliveryLocation],
  );

  const { featured, nearYou, popular, allStores } = useOutletSections(location);
  const { data: promoBanners } = usePromoBanners(effectiveUseCase);

  const mapOutlets = useCallback(
    (data: typeof featured.data) =>
      data?.data?.map((o) => toCardProps(o, orgSlug, effectiveUseCase)) ?? [],
    [orgSlug, effectiveUseCase],
  );

  const featuredOutlets = useMemo(() => mapOutlets(featured.data), [featured.data, mapOutlets]);
  const nearYouOutlets = useMemo(() => mapOutlets(nearYou.data), [nearYou.data, mapOutlets]);
  const popularOutlets = useMemo(() => mapOutlets(popular.data), [popular.data, mapOutlets]);
  const allStoresOutlets = useMemo(() => mapOutlets(allStores.data), [allStores.data, mapOutlets]);

  const handleFavoriteToggle = useCallback((id: string, isFavorite: boolean) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFavorite) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  return (
    <SiteShell>
      {/* Promo Banners */}
      {promoBanners != null && promoBanners.length > 0 && (
        <section className="bg-background py-4 sm:py-6">
          <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-8">
            <PromoBannerCarousel banners={promoBanners} />
          </div>
        </section>
      )}

      {/* Featured */}
      <OutletSection
        title={`Featured ${copy.outletLabelPlural}`}
        subtitle="Promoted picks and top rated"
        icon={<Zap className="size-5" />}
        seeAllHref={orgRoute(orgSlug, "/catalog?filter=featured")}
        outlets={featuredOutlets}
        isLoading={featured.isLoading}
        variant="scroll"
        favorites={favorites}
        onFavoriteToggle={handleFavoriteToggle}
      />

      {/* Near you */}
      <OutletSection
        title={`${copy.outletLabelPlural} near you`}
        subtitle={
          deliveryLocation?.address
            ? `Near ${deliveryLocation.address}`
            : "Based on your location"
        }
        icon={<MapPin className="size-5" />}
        seeAllHref={orgRoute(orgSlug, "/catalog?sort=distance")}
        outlets={nearYouOutlets}
        isLoading={nearYou.isLoading}
        variant="logos"
        favorites={favorites}
        onFavoriteToggle={handleFavoriteToggle}
        className="bg-muted/30"
      />

      {/* Popular */}
      <OutletSection
        title="Popular in your area"
        subtitle="Highest-rated near you"
        icon={<Star className="size-5" />}
        seeAllHref={orgRoute(orgSlug, "/catalog?sort=rating&min_rating=4")}
        outlets={popularOutlets}
        isLoading={popular.isLoading}
        variant="scroll"
        favorites={favorites}
        onFavoriteToggle={handleFavoriteToggle}
      />

      {/* All providers/outlets */}
      <OutletSection
        title={`All ${copy.outletLabelPlural.toLowerCase()}`}
        subtitle="Browse everything available"
        icon={<TrendingUp className="size-5" />}
        outlets={allStoresOutlets}
        isLoading={allStores.isLoading}
        variant="grid"
        favorites={favorites}
        onFavoriteToggle={handleFavoriteToggle}
        className="bg-muted/30"
      />

      {/* CTA Section */}
      <section className="border-t border-border bg-muted/50 py-8 sm:py-12">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">{copy.heroTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">{copy.heroSubtitle}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="min-h-[48px] sm:px-8">
              <Link href={orgRoute(orgSlug, "/catalog")}>Browse Catalog</Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="min-h-[48px] sm:px-8">
              <Link href={orgRoute(orgSlug, "/auth")}>Sign in</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
