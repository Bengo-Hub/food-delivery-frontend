"use client";

import { Clock, MapPin, Tag, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  CategoryCarousel,
  defaultCategories,
  type Category,
} from "@/components/category/category-carousel";
import { FilterBar } from "@/components/layout/filter-bar";
import { SiteShell } from "@/components/layout/site-shell";
import {
  FeaturedItemCard,
  FeaturedItemsCarousel,
  type FeaturedItemProps,
} from "@/components/menu/featured-item-card";
import { OutletCard, OutletGrid, type OutletCardProps } from "@/components/outlet/outlet-card";
import { PromoBannerCarousel } from "@/components/promo/promo-banner-carousel";
import { Button } from "@/components/ui/button";
import { useCategories, useFeaturedItems, useOutlets } from "@/hooks/use-menu";
import { orgRoute } from "@/lib/routes";
import { toast } from "@/lib/toast";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useCartStore } from "@/store/cart";
import { useDiningModeStore } from "@/store/dining-mode";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function filterOutletsByCategory(
  outlets: OutletCardProps[],
  categoryId: string,
): OutletCardProps[] {
  if (categoryId === "all" || categoryId === "restaurants") return outlets;
  return outlets.filter(
    (outlet) =>
      outlet.businessType === categoryId ||
      outlet.cuisines?.some((c) => c.toLowerCase().includes(categoryId.toLowerCase())),
  );
}

function getSpeedyDeliveryOutlets(outlets: OutletCardProps[]): OutletCardProps[] {
  return outlets.filter((outlet) => {
    const time = outlet.deliveryTime?.split("-")[0];
    return time && parseInt(time) <= 25;
  });
}

function getBudgetDeliveryOutlets(outlets: OutletCardProps[], maxFee = 100): OutletCardProps[] {
  return outlets.filter((outlet) => {
    if (!outlet.deliveryFee) return false;
    if (outlet.deliveryFee.toLowerCase() === "free") return true;
    const feeMatch = outlet.deliveryFee.match(/\d+/);
    return feeMatch ? parseInt(feeMatch[0]) <= maxFee : false;
  });
}

function getTodaysOffersOutlets(outlets: OutletCardProps[]): OutletCardProps[] {
  return outlets.filter((outlet) => outlet.offerBadge || outlet.discount);
}

// =============================================================================
// SECTION HEADER
// =============================================================================

function SectionHeader({
  title,
  subtitle,
  icon,
  seeAllHref,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  seeAllHref?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between sm:mb-4">
      <div className="flex items-center gap-2">
        {icon && <span className="text-primary">{icon}</span>}
        <div>
          <h2 className="text-base font-bold text-foreground sm:text-xl">{title}</h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
          )}
        </div>
      </div>
      {seeAllHref && (
        <Button variant="ghost" size="sm" className="h-9 text-primary" asChild>
          <Link href={seeAllHref as string}>See all</Link>
        </Button>
      )}
    </div>
  );
}

// =============================================================================
// HOME PAGE
// =============================================================================

export default function HomePage() {
  const orgSlug = useOrgSlug();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("all");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const deliveryLocation = useDiningModeStore((state) => state.deliveryLocation);
  const addItem = useCartStore((state) => state.addItem);

  // Fetch outlets first; use first outlet id for categories and featured items (backend requires outlet_id for categories)
  const { data: outletsData } = useOutlets(orgSlug, undefined, 1, 20);
  const firstOutletId = outletsData?.data?.[0]?.id ?? "";
  const firstOutletName = outletsData?.data?.[0]?.name ?? "";

  const { data: categoriesData } = useCategories(orgSlug, firstOutletId || undefined);
  const { data: featuredData } = useFeaturedItems(
    orgSlug,
    firstOutletId || undefined,
    10,
  );

  const categories: Category[] =
    categoriesData?.length ?
      categoriesData.map((c) => {
        const match = defaultCategories.find((dc) => dc.id === c.id);
        return {
          id: c.id,
          name: c.name,
          ...(match?.emoji ? { emoji: match.emoji } : {}),
          ...(c.image ? { imageUrl: c.image } : {}),
        };
      })
    : defaultCategories;

  const outlets: OutletCardProps[] =
    outletsData?.data?.length ?
      outletsData.data.map((o) => ({
        id: o.id,
        name: o.name,
        rating: o.rating,
        reviewCount: o.reviewCount,
        deliveryTime: o.deliveryTime,
        deliveryFee: o.deliveryFee,
        cuisines: o.cuisines,
        businessType: o.businessType,
        href: orgRoute(orgSlug, `/outlet/${o.id}`),
        ...(o.promoted && { promoted: o.promoted }),
        ...(o.offerBadge && { offerBadge: o.offerBadge }),
        ...(o.image && { image: o.image }),
      }))
    : [];

  const featuredItems: FeaturedItemProps[] =
    featuredData?.length
      ? featuredData.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          currency: item.currency ?? "KES",
          ...(item.image != null && item.image !== "" && { image: item.image }),
          outletId: item.outletId || firstOutletId,
          outletName: item.outletName || firstOutletName,
          category: item.category,
          href: orgRoute(
            orgSlug,
            `/menu/${item.id}`,
          ),
          ...(item.discountPercent != null && {
            discountPercent: item.discountPercent,
          }),
          ...(item.originalPrice != null && {
            originalPrice: item.originalPrice,
          }),
        }))
      : [];

  const handleFavoriteToggle = (id: string, isFavorite: boolean) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFavorite) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleAddToCart = (itemId: string) => {
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
  };

  const filteredOutlets = filterOutletsByCategory(outlets, activeCategory);
  const speedyOutlets = getSpeedyDeliveryOutlets(outlets);
  const budgetDeliveryOutlets = getBudgetDeliveryOutlets(outlets, 100);
  const todaysOffersOutlets = getTodaysOffersOutlets(outlets);

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
                router.push(orgRoute(orgSlug, "/menu"));
              } else {
                router.push(orgRoute(orgSlug, `/menu?category=${id}`));
              }
            }}
            variant="icons"
          />
        </div>
      </section>

      {/* Filter Bar */}
      <section className="border-b border-border bg-background py-2 sm:py-3">
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-8">
          <FilterBar />
        </div>
      </section>

      {/* Promo Banners - from backend when available */}
      <section className="bg-background py-4 sm:py-6">
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-8">
          <PromoBannerCarousel banners={[]} />
        </div>
      </section>

      {/* Featured Items */}
      <section className="py-4 sm:py-6">
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-8">
          <SectionHeader
            title="Featured Items"
            subtitle="Popular picks from our menu"
            seeAllHref={orgRoute(orgSlug, "/menu?featured=true")}
          />
          <FeaturedItemsCarousel>
            {featuredItems.map((item) => (
              <FeaturedItemCard key={item.id} {...item} onAddToCart={handleAddToCart} />
            ))}
          </FeaturedItemsCarousel>
        </div>
      </section>

      {/* Outlets Near You */}
      <section className="bg-muted/30 py-4 sm:py-6">
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-8">
          <SectionHeader
            title="Outlets Near You"
            subtitle={
              deliveryLocation?.address
                ? `Near ${deliveryLocation.address}`
                : "Based on your location"
            }
            icon={<MapPin className="size-5" />}
            seeAllHref={orgRoute(orgSlug, "/menu")}
          />
          <OutletGrid>
            {filteredOutlets.map((outlet) => (
              <OutletCard
                key={outlet.id}
                {...outlet}
                isFavorite={favorites.has(outlet.id)}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </OutletGrid>
        </div>
      </section>

      {/* Speedy Deliveries */}
      {speedyOutlets.length > 0 && (
        <section className="py-4 sm:py-6">
          <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-8">
            <SectionHeader
              title="Speedy Deliveries"
              subtitle="Get it fast - under 30 minutes"
              icon={<Zap className="size-5" />}
              seeAllHref={orgRoute(orgSlug, "/menu?filter=speedy")}
            />
            <OutletGrid>
              {speedyOutlets.map((outlet) => (
                <OutletCard
                  key={outlet.id}
                  {...outlet}
                  isFavorite={favorites.has(outlet.id)}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </OutletGrid>
          </div>
        </section>
      )}

      {/* Budget Delivery */}
      {budgetDeliveryOutlets.length > 0 && (
        <section className="bg-muted/30 py-4 sm:py-6">
          <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-8">
            <SectionHeader
              title="Under 100 KES Delivery"
              subtitle="Budget-friendly delivery options"
              icon={<Clock className="size-5" />}
              seeAllHref={orgRoute(orgSlug, "/menu?filter=budget-delivery")}
            />
            <OutletGrid>
              {budgetDeliveryOutlets.map((outlet) => (
                <OutletCard
                  key={outlet.id}
                  {...outlet}
                  isFavorite={favorites.has(outlet.id)}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </OutletGrid>
          </div>
        </section>
      )}

      {/* Today's Offers */}
      {todaysOffersOutlets.length > 0 && (
        <section className="py-4 sm:py-6">
          <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-8">
            <SectionHeader
              title="Today's Offers"
              subtitle="Special deals just for today"
              icon={<Tag className="size-5" />}
              seeAllHref={orgRoute(orgSlug, "/menu?filter=offers")}
            />
            <OutletGrid>
              {todaysOffersOutlets.map((outlet) => (
                <OutletCard
                  key={outlet.id}
                  {...outlet}
                  isFavorite={favorites.has(outlet.id)}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </OutletGrid>
          </div>
        </section>
      )}

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
              <Link href={orgRoute(orgSlug, "/menu")}>Browse Menu</Link>
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
