"use client";

import { MapPin, Star, Tag, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import {
  FeaturedItemCard,
  FeaturedItemsCarousel,
  type FeaturedItemProps,
} from "@/components/catalog/featured-item-card";
import {
  CategoryCarousel,
  defaultCategories,
  type Category,
} from "@/components/category/category-carousel";
import { PickupLayout } from "@/components/pickup/pickup-layout";
import { FilterBar, defaultFilters, type ActiveFilters } from "@/components/layout/filter-bar";
import { SiteShell } from "@/components/layout/site-shell";
import { OutletCard, type OutletCardProps } from "@/components/outlet/outlet-card";
import { OutletSection } from "@/components/outlet/outlet-section";
import { PromoBannerCarousel } from "@/components/promo/promo-banner-carousel";
import { Button } from "@/components/ui/button";
import { useCategories, useFeaturedItems, useInfiniteOutlets } from "@/hooks/use-catalog";
import { useOutletSections } from "@/hooks/use-outlet-sections";
import { orgRoute } from "@/lib/routes";
import { toast } from "@/lib/toast";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useCartStore } from "@/store/cart";
import { useDiningModeStore } from "@/store/dining-mode";
import type { OutletFilters } from "@/types/catalog";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** Convert ActiveFilters from the filter bar into OutletFilters for the API */
function toOutletFilters(
  f: ActiveFilters,
  location?: { latitude: number; longitude: number } | null,
): OutletFilters {
  const out: OutletFilters = {};
  if (f.sortBy) out.sort = f.sortBy;
  if (f.minRating) out.minRating = f.minRating;
  if (f.highestRated && !f.minRating) out.minRating = 4.0;
  if (f.maxTime) out.maxDeliveryTime = f.maxTime;
  if (f.offers) out.offers = true;
  if (f.pickupOnly) out.pickup = true;
  if (f.scheduledOnly) out.scheduled = true;
  if (f.categories.length > 0) out.cuisines = f.categories;
  if (f.maxDistance && location) {
    out.maxDistance = f.maxDistance;
    out.lat = location.latitude;
    out.lng = location.longitude;
  }
  if (f.deliveryFee) {
    if (f.deliveryFee === "free") out.maxDeliveryFee = 0;
    else if (f.deliveryFee === "under-50") out.maxDeliveryFee = 50;
    else if (f.deliveryFee === "under-100") out.maxDeliveryFee = 100;
  }
  return out;
}

/** Map API outlet to OutletCardProps */
function toCardProps(
  o: {
    id: string;
    name: string;
    rating: number;
    reviewCount: number;
    deliveryTime: string;
    deliveryFee: string;
    cuisines: string[];
    businessType: string;
    isOpen: boolean;
    promoted?: boolean;
    offerBadge?: string;
    image?: string;
    discount?: number;
  },
  orgSlug: string,
): OutletCardProps {
  return {
    id: o.id,
    name: o.name,
    rating: o.rating,
    reviewCount: o.reviewCount,
    deliveryTime: o.deliveryTime,
    deliveryFee: o.deliveryFee,
    cuisines: o.cuisines,
    businessType: o.businessType,
    isOpen: o.isOpen,
    href: orgRoute(orgSlug, `/outlet/${o.id}`),
    ...(o.promoted && { promoted: o.promoted }),
    ...(o.offerBadge && { offerBadge: o.offerBadge }),
    ...(o.image && { image: o.image }),
    ...(o.discount && { promoBadge: `-${o.discount}%` }),
  };
}

// =============================================================================
// HOME PAGE
// =============================================================================

export default function HomePage() {
  const orgSlug = useOrgSlug();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("all");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<ActiveFilters>(defaultFilters);

  const diningMode = useDiningModeStore((s) => s.mode);
  const deliveryLocation = useDiningModeStore((state) => state.deliveryLocation);
  const addItem = useCartStore((state) => state.addItem);

  // Location for distance-based queries
  const location = useMemo(
    () =>
      deliveryLocation
        ? { lat: deliveryLocation.latitude, lng: deliveryLocation.longitude }
        : null,
    [deliveryLocation],
  );

  // Convert UI filters to API filters
  const outletFilters = useMemo(
    () => toOutletFilters(filters, deliveryLocation),
    [filters, deliveryLocation],
  );

  // ------- Section queries (parallel) -------
  const { featured, mostReviewed, nearYou, popular, todaysOffers, allStores } =
    useOutletSections(location);

  // ------- All Stores infinite scroll -------
  const allStoresInfinite = useInfiniteOutlets(orgSlug, { sort: "relevance", ...( location ? { lat: location.lat, lng: location.lng } : {}) }, 20);

  // ------- Featured items (menu items, not outlets) -------
  const firstOutletId = allStores.data?.data?.[0]?.id ?? "";
  const firstOutletName = allStores.data?.data?.[0]?.name ?? "";
  const { data: categoriesData } = useCategories(orgSlug, firstOutletId || undefined);
  const { data: featuredData } = useFeaturedItems(orgSlug, firstOutletId || undefined, 10);

  // ------- Derived data -------
  const categories: Category[] =
    categoriesData?.length
      ? categoriesData.map((c) => {
          const match = defaultCategories.find((dc) => dc.id === c.id);
          return {
            id: c.id,
            name: c.name,
            ...(match?.emoji ? { emoji: match.emoji } : {}),
            ...(c.image ? { imageUrl: c.image } : {}),
          };
        })
      : defaultCategories;

  const mapOutlets = useCallback(
    (data: typeof featured.data) =>
      data?.data?.map((o) => toCardProps(o, orgSlug)) ?? [],
    [orgSlug],
  );

  const featuredOutlets = useMemo(() => mapOutlets(featured.data), [featured.data, mapOutlets]);
  const mostReviewedOutlets = useMemo(() => mapOutlets(mostReviewed.data), [mostReviewed.data, mapOutlets]);
  const nearYouOutlets = useMemo(() => mapOutlets(nearYou.data), [nearYou.data, mapOutlets]);
  const popularOutlets = useMemo(() => mapOutlets(popular.data), [popular.data, mapOutlets]);
  const todaysOffersOutlets = useMemo(() => mapOutlets(todaysOffers.data), [todaysOffers.data, mapOutlets]);

  // All stores: combine infinite pages or fall back to section query
  const allStoresOutlets = useMemo(() => {
    if (allStoresInfinite.data?.pages) {
      return allStoresInfinite.data.pages.flatMap((page) =>
        page.data.map((o) => toCardProps(o, orgSlug)),
      );
    }
    return mapOutlets(allStores.data);
  }, [allStoresInfinite.data, allStores.data, mapOutlets, orgSlug]);

  const featuredItems: FeaturedItemProps[] = useMemo(
    () =>
      featuredData?.length
        ? featuredData
            .filter((item) => !!item.id)
            .map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            currency: item.currency ?? "KES",
            ...(item.image != null && item.image !== "" && { image: item.image }),
            outletId: item.outletId || firstOutletId,
            outletName: item.outletName || firstOutletName,
            category: item.category,
            href: orgRoute(orgSlug, `/catalog/${item.id}`),
            ...(item.discountPercent != null && { discountPercent: item.discountPercent }),
            ...(item.originalPrice != null && { originalPrice: item.originalPrice }),
          }))
        : [],
    [featuredData, firstOutletId, firstOutletName, orgSlug],
  );

  // ------- Handlers -------
  const handleFavoriteToggle = useCallback((id: string, isFavorite: boolean) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFavorite) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleAddToCart = useCallback(
    (itemId: string) => {
      const item = featuredItems.find((i) => i.id === itemId);
      if (item) {
        addItem({
          id: item.id,
          name: item.name,
          price: item.price,
          outletId: item.outletId,
          outletName: item.outletName,
        });
        toast.success(`Added ${item.name} to cart`);
      }
    },
    [featuredItems, addItem],
  );

  const handleLoadMore = useCallback(() => {
    if (allStoresInfinite.hasNextPage && !allStoresInfinite.isFetchingNextPage) {
      allStoresInfinite.fetchNextPage();
    }
  }, [allStoresInfinite]);

  if (diningMode === "pickup") {
    return (
      <SiteShell>
        <PickupLayout />
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      {/* Category Carousel - Sticky below header */}
      <section className="sticky top-[104px] z-20 border-b border-border bg-background/95 py-2 backdrop-blur-sm sm:py-3 md:top-16">
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-8">
          <CategoryCarousel
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={(id) => {
              if (id === "all") {
                router.push(orgRoute(orgSlug, "/catalog"));
              } else {
                router.push(orgRoute(orgSlug, `/catalog?category=${id}`));
              }
            }}
            variant="icons"
          />
        </div>
      </section>

      {/* Filter Bar */}
      <section className="border-b border-border bg-background py-2 sm:py-3">
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-8">
          <FilterBar filters={filters} onFilterChange={setFilters} />
        </div>
      </section>

      {/* Promo Banners */}
      <section className="bg-background py-4 sm:py-6">
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-8">
          <PromoBannerCarousel banners={[]} />
        </div>
      </section>

      {/* Featured Items (menu items carousel) */}
      {featuredItems.length > 0 && (
        <section className="py-4 sm:py-6">
          <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-8">
            <div className="mb-3 flex items-center justify-between sm:mb-4">
              <div>
                <h2 className="text-base font-bold text-foreground sm:text-xl">
                  Featured Items
                </h2>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Popular picks from our menu
                </p>
              </div>
              <Button variant="ghost" size="sm" className="h-9 text-primary" asChild>
                <Link href={orgRoute(orgSlug, "/catalog?featured=true")}>See all</Link>
              </Button>
            </div>
            <FeaturedItemsCarousel>
              {featuredItems.map((item) => (
                <FeaturedItemCard key={item.id} {...item} onAddToCart={handleAddToCart} />
              ))}
            </FeaturedItemsCarousel>
          </div>
        </section>
      )}

      {/* Featured on [Brand] */}
      <OutletSection
        title="Featured"
        subtitle="Promoted stores and top picks"
        icon={<Zap className="size-5" />}
        seeAllHref={orgRoute(orgSlug, "/catalog?filter=featured")}
        outlets={featuredOutlets}
        isLoading={featured.isLoading}
        variant="scroll"
        favorites={favorites}
        onFavoriteToggle={handleFavoriteToggle}
      />

      {/* Most reviewed */}
      <OutletSection
        title="Most reviewed"
        subtitle="Loved by the community"
        icon={<Star className="size-5" />}
        seeAllHref={orgRoute(orgSlug, "/catalog?sort=rating")}
        outlets={mostReviewedOutlets}
        isLoading={mostReviewed.isLoading}
        variant="scroll"
        favorites={favorites}
        onFavoriteToggle={handleFavoriteToggle}
        className="bg-muted/30"
      />

      {/* Stores near you */}
      <OutletSection
        title="Stores near you"
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
      />

      {/* Popular in your area */}
      <OutletSection
        title="Popular in your area"
        subtitle="Highest-rated stores nearby"
        icon={<TrendingUp className="size-5" />}
        seeAllHref={orgRoute(orgSlug, "/catalog?sort=rating&min_rating=4")}
        outlets={popularOutlets}
        isLoading={popular.isLoading}
        variant="scroll"
        favorites={favorites}
        onFavoriteToggle={handleFavoriteToggle}
        className="bg-muted/30"
      />

      {/* Today's offers */}
      <OutletSection
        title="Today's offers"
        subtitle="Special deals just for today"
        icon={<Tag className="size-5" />}
        seeAllHref={orgRoute(orgSlug, "/catalog?filter=offers")}
        outlets={todaysOffersOutlets}
        isLoading={todaysOffers.isLoading}
        variant="scroll"
        favorites={favorites}
        onFavoriteToggle={handleFavoriteToggle}
      />

      {/* Top 10 local spots */}
      <OutletSection
        title="Top 10 local spots"
        subtitle="Neighbourhood favourites"
        seeAllHref={orgRoute(orgSlug, "/catalog?sort=rating")}
        outlets={mostReviewedOutlets.slice(0, 10)}
        isLoading={mostReviewed.isLoading}
        variant="numbered"
        favorites={favorites}
        onFavoriteToggle={handleFavoriteToggle}
        className="bg-muted/30"
      />

      {/* All stores */}
      <section className="py-4 sm:py-6">
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-8">
          <div className="mb-3 flex items-center justify-between sm:mb-4">
            <div>
              <h2 className="text-base font-bold text-foreground sm:text-xl">All stores</h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Browse everything available
              </p>
            </div>
          </div>

          {allStores.isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl">
                  <div className="aspect-[16/10] w-full animate-pulse rounded-t-xl bg-muted" />
                  <div className="space-y-2 p-2 sm:p-3">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : allStoresOutlets.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {allStoresOutlets.map((o) => (
                  <div key={o.id}>
                    <AllStoresCard
                      outlet={o}
                      isFavorite={favorites.has(o.id)}
                      onFavoriteToggle={handleFavoriteToggle}
                    />
                  </div>
                ))}
              </div>
              {allStoresInfinite.hasNextPage && (
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    size="lg"
                    className="min-h-[48px] px-8"
                    onClick={handleLoadMore}
                    disabled={allStoresInfinite.isFetchingNextPage}
                  >
                    {allStoresInfinite.isFetchingNextPage ? "Loading..." : "Show more stores"}
                  </Button>
                </div>
              )}
            </>
          ) : null}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-muted/50 py-8 sm:py-12">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            Ready to start ordering?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Browse our full menu and enjoy fast delivery.
          </p>
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

function AllStoresCard({
  outlet,
  isFavorite,
  onFavoriteToggle,
}: {
  outlet: OutletCardProps;
  isFavorite: boolean;
  onFavoriteToggle: (id: string, isFav: boolean) => void;
}) {
  return (
    <OutletCard
      {...outlet}
      isFavorite={isFavorite}
      onFavoriteToggle={onFavoriteToggle}
    />
  );
}
