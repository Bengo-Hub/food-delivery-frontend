"use client";

/**
 * RetailHomeView — the retail/pharmacy/wholesale homepage. Unlike FoodHomeView
 * (Uber-Eats-shaped, outlet-ranking sections), this leads with browsing the
 * catalog: a "Shop by Category" sidebar, Top Deals, New Arrivals, then a plain
 * store grid. No fork-and-knife outlet leaderboards ("Most reviewed" / "Top 10
 * local spots") — those read as food-delivery concepts that don't fit a
 * hardware/general-goods storefront.
 */

import { Headset, MapPin, ShieldCheck, Tag, Truck, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { CategorySidebar } from "@/components/category/category-sidebar";
import {
  FeaturedItemCard,
  FeaturedItemsCarousel,
  type FeaturedItemProps,
} from "@/components/catalog/featured-item-card";
import { toCardProps } from "@/components/home/home-helpers";
import { SiteShell } from "@/components/layout/site-shell";
import { OutletSection } from "@/components/outlet/outlet-section";
import { PromoBannerCarousel } from "@/components/promo/promo-banner-carousel";
import { Button } from "@/components/ui/button";
import { useCategories, useCatalogItems, useOutlets } from "@/hooks/use-catalog";
import { useOrderingConfig } from "@/hooks/use-ordering-config";
import { usePromoBanners } from "@/hooks/use-promo-banners";
import { usePromoDeals } from "@/hooks/use-promo-deals";
import { applyDeal, dealBadge, resolveDealItems } from "@/lib/api/promo-deals";
import { orgRoute } from "@/lib/routes";
import { useOrgSlug } from "@/providers/org-slug-provider";

const TRUST_BADGES = [
  { icon: Truck, label: "Fast Delivery" },
  { icon: ShieldCheck, label: "Secure Payment" },
  { icon: Tag, label: "Best Prices" },
  { icon: Headset, label: "24/7 Support" },
];

export function RetailHomeView() {
  const orgSlug = useOrgSlug();
  const router = useRouter();
  const { profile, useCase: effectiveUseCase, copy } = useOrderingConfig();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const { data: categoriesData } = useCategories(orgSlug, undefined, effectiveUseCase);
  const { data: itemsPage } = useCatalogItems(orgSlug, {}, 1, 60);
  const { data: newArrivalsPage } = useCatalogItems(orgSlug, { sort: "newest" }, 1, 10);
  const { data: promoBanners } = usePromoBanners(effectiveUseCase);
  const { data: deals } = usePromoDeals();
  const { data: outletsPage, isLoading: outletsLoading } = useOutlets(
    orgSlug,
    { sort: "relevance" },
    1,
    50,
  );

  const categories = categoriesData ?? [];
  const items = itemsPage?.data ?? [];

  const dealItems = useMemo(
    () => resolveDealItems(items, deals ?? []).slice(0, 12),
    [items, deals],
  );

  const topDeals: FeaturedItemProps[] = useMemo(
    () =>
      dealItems.map(({ item, deal }) => {
        const discounted = applyDeal(item.price, deal.rule);
        const badge = dealBadge(deal.rule);
        const percentOff =
          badge && deal.rule?.discountType === "percentage" ? deal.rule.discountValue : undefined;
        return {
          id: item.id,
          name: item.name,
          description: item.description,
          price: discounted,
          currency: item.currency ?? "KES",
          ...(item.image ? { image: item.image } : {}),
          outletId: item.outletId,
          outletName: item.outletName,
          category: item.category,
          useCase: profile,
          href: orgRoute(orgSlug, `/catalog/${item.id}`),
          ...(percentOff != null ? { discountPercent: percentOff } : {}),
          originalPrice: item.price,
          isFlashSale: deal.isFlashSale,
          dealEndsAt: deal.endAt,
        };
      }),
    [dealItems, orgSlug, profile],
  );

  // "New Arrivals" — fetched separately with sort=newest (inventory-api already
  // whitelists created_at for sorting; ordering-backend maps the opaque "newest" key
  // to it) rather than slicing the general item list, which has no defined order.
  const newArrivalItems = newArrivalsPage?.data ?? [];
  const newArrivals: FeaturedItemProps[] = useMemo(
    () =>
      newArrivalItems.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        currency: item.currency ?? "KES",
        ...(item.image ? { image: item.image } : {}),
        outletId: item.outletId,
        outletName: item.outletName,
        category: item.category,
        useCase: profile,
        href: orgRoute(orgSlug, `/catalog/${item.id}`),
      })),
    [newArrivalItems, orgSlug, profile],
  );

  const handleFavoriteToggle = (id: string, isFavorite: boolean) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFavorite) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleCategoryChange = (id: string) => {
    setActiveCategory(id);
    if (id === "all") {
      router.push(orgRoute(orgSlug, "/catalog"));
    } else {
      router.push(orgRoute(orgSlug, `/catalog?category=${id}`));
    }
  };

  const storeOutlets = useMemo(
    () => (outletsPage?.data ?? []).map((o) => toCardProps(o, orgSlug, effectiveUseCase)),
    [outletsPage, orgSlug, effectiveUseCase],
  );

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-4 sm:py-6 lg:px-8">
        <div className="md:grid md:grid-cols-[240px_1fr] md:gap-8">
          {/* Shop by Category — left rail on desktop, drill-in accordion on mobile */}
          {categories.length > 0 && (
            <aside className="mb-5 md:mb-0">
              <CategorySidebar
                categories={categories}
                activeCategory={activeCategory}
                onCategoryChange={handleCategoryChange}
                useCase={effectiveUseCase}
              />
            </aside>
          )}

          <div className="min-w-0">
            {/* Promo Banners */}
            {promoBanners != null && promoBanners.length > 0 && (
              <div className="mb-6">
                <PromoBannerCarousel banners={promoBanners} />
              </div>
            )}

            {/* Top Deals */}
            {topDeals.length > 0 && (
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between sm:mb-4">
                  <div className="flex items-center gap-2">
                    <Zap className="size-5 text-primary" />
                    <div>
                      <h2 className="text-base font-bold text-foreground sm:text-xl">Top Deals</h2>
                      <p className="text-xs text-muted-foreground sm:text-sm">
                        {copy.itemLabelPlural} on sale right now
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-9 text-primary" asChild>
                    <Link href={orgRoute(orgSlug, "/catalog?filter=deals")}>See all</Link>
                  </Button>
                </div>
                <FeaturedItemsCarousel>
                  {topDeals.map((item) => (
                    <FeaturedItemCard key={item.id} {...item} />
                  ))}
                </FeaturedItemsCarousel>
              </div>
            )}

            {/* New Arrivals */}
            {newArrivals.length > 0 && (
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between sm:mb-4">
                  <div>
                    <h2 className="text-base font-bold text-foreground sm:text-xl">New Arrivals</h2>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      Fresh {copy.itemLabelPlural.toLowerCase()} just added
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-9 text-primary" asChild>
                    <Link href={orgRoute(orgSlug, "/catalog")}>See all</Link>
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
                  {newArrivals.map((item) => (
                    <FeaturedItemCard key={item.id} {...item} className="w-full" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Browse stores */}
      <OutletSection
        title={`Browse ${copy.outletLabelPlural}`}
        subtitle={`All ${copy.outletLabelPlural.toLowerCase()} on ${copy.brandSuffix}`}
        icon={<MapPin className="size-5" />}
        outlets={storeOutlets}
        isLoading={outletsLoading}
        variant="grid"
        favorites={favorites}
        onFavoriteToggle={handleFavoriteToggle}
        className="bg-muted/30"
      />

      {/* Trust badge strip */}
      <section className="border-t border-border py-8 sm:py-10">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-4 px-3 sm:grid-cols-4 sm:gap-6 sm:px-4 lg:px-8">
          {TRUST_BADGES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <span className="flex size-11 items-center justify-center rounded-full bg-muted text-foreground">
                <Icon className="size-5" />
              </span>
              <span className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</span>
            </div>
          ))}
        </div>
      </section>

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
