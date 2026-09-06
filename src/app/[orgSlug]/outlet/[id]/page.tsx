"use client";

import { ArrowLeft, Clock, Heart, MapPin, Phone, Search, ShoppingCart, Star, Zap } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AddToCartModal, needsAddToCartModal, type AddToCartModalItem } from "@/components/catalog/add-to-cart-modal";
import { SiteShell } from "@/components/layout/site-shell";
import { FoodOutletView } from "@/components/outlet/food-outlet-view";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { Input } from "@/components/ui/input";
import { useOutlet, useOutletMenu } from "@/hooks/use-catalog";
import { useCountdown } from "@/hooks/use-countdown";
import { useOrderingConfig } from "@/hooks/use-ordering-config";
import { usePromoDeals } from "@/hooks/use-promo-deals";
import { applyDeal, resolveDealItems } from "@/lib/api/promo-deals";
import { orgRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useCartStore } from "@/store/cart";
import type { DietaryTag, MenuItem } from "@/types/catalog";

/** Foods/quick-service outlets get the Uber-Eats-style sidebar+map layout (FoodOutletView);
 *  every other vertical keeps today's single-column GenericOutletView. This dispatch has to
 *  live in a separate parent component (not a conditional return inside GenericOutletView
 *  itself) — the vertical is only known once the outlet finishes loading, and switching which
 *  hooks run mid-lifetime of one component would violate the Rules of Hooks. */
export default function OutletPage() {
  const params = useParams();
  const orgSlug = useOrgSlug();
  const outletId = (params?.id as string) ?? "";
  const { data: outlet } = useOutlet(orgSlug, outletId);
  const { config: cfg } = useOrderingConfig(outlet?.businessType);

  if (cfg.profile === "hospitality" || cfg.profile === "quick_service") {
    return <FoodOutletView orgSlug={orgSlug} outletId={outletId} />;
  }
  return <GenericOutletView orgSlug={orgSlug} outletId={outletId} />;
}

const dietaryLabels: Record<DietaryTag, string> = {
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  glutenFree: "GF",
  spicy: "Spicy",
  chefSpecial: "Chef's",
  halal: "Halal",
};

function MenuItemCard({
  item,
  onAddToCart,
  useCase,
}: {
  item: MenuItem;
  onAddToCart: () => void;
  useCase?: string;
}) {
  const orgSlug = useOrgSlug();
  const countdown = useCountdown(item.isFlashSale ? item.dealEndsAt : null);
  return (
    <div className="group flex gap-4 rounded-xl border border-border bg-card p-4 transition hover:shadow-md">
      {/* Content */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-foreground">{item.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
          </div>
        </div>

        {/* Tags */}
        <div className="mt-2 flex flex-wrap gap-1">
          {(item.dietary ?? []).slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
            >
              {dietaryLabels[tag]}
            </span>
          ))}
          {item.featured && (
            <span className="rounded-full bg-yellow-500/10 px-1.5 py-0.5 text-[10px] font-medium text-yellow-600">
              Featured
            </span>
          )}
        </div>

        {/* Price and Add Button */}
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              {item.currency} {item.price.toLocaleString()}
            </span>
            {item.originalPrice && item.originalPrice > item.price && (
              <span className="text-xs text-muted-foreground line-through">
                {item.currency} {item.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          <Button size="sm" onClick={onAddToCart}>
            <ShoppingCart className="mr-1 size-3" />
            Add
          </Button>
        </div>
      </div>

      {/* Image */}
      <Link
        href={orgRoute(orgSlug, `/catalog/${item.id}`)}
        className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-28"
      >
        <ImageWithFallback
          src={item.image}
          alt={item.name}
          useCase={useCase}
          fill
          className="object-cover transition group-hover:scale-105"
          sizes="112px"
          iconClassName="size-7"
        />
        {((item.discountPercent && item.discountPercent > 0) || (item.isFlashSale && countdown)) && (
          <div className="absolute left-1 top-1 flex flex-col items-start gap-0.5">
            {item.discountPercent && item.discountPercent > 0 && (
              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                -{item.discountPercent}%
              </span>
            )}
            {item.isFlashSale && countdown && (
              <span className="flex items-center gap-0.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                <Zap className="size-2 fill-white" /> {countdown}
              </span>
            )}
          </div>
        )}
      </Link>
    </div>
  );
}

function GenericOutletView({ orgSlug, outletId }: { orgSlug: string; outletId: string }) {
  const router = useRouter();

  const { data: outlet, isLoading: outletLoading, error: outletError } = useOutlet(orgSlug, outletId);
  const { data: menuData, isLoading: menuLoading } = useOutletMenu(orgSlug, outletId, undefined, 1, 100);
  const { data: deals } = usePromoDeals();
  // Apply active deals to this outlet's own menu — previously this page never called
  // resolveDealItems/applyDeal at all (only the home-page Top Deals grids did), so a matching
  // item's discountPercent/originalPrice here were always undefined and MenuItemCard's
  // strikethrough/badge UI silently never rendered even for a genuinely discounted item.
  const menuItems = useMemo(() => {
    const base = menuData?.data ?? [];
    if (!deals?.length) return base;
    const dealByItemId = new Map(resolveDealItems(base, deals).map(({ item, deal }) => [item.id, deal]));
    return base.map((item) => {
      const deal = dealByItemId.get(item.id);
      if (!deal) return item;
      const discounted = applyDeal(item.price, deal.rule);
      if (discounted >= item.price) return item;
      const percentOff = deal.rule?.discountType === "percentage" ? deal.rule.discountValue : undefined;
      return {
        ...item,
        price: discounted,
        originalPrice: item.price,
        ...(percentOff != null ? { discountPercent: percentOff } : {}),
        isFlashSale: deal.isFlashSale,
        dealEndsAt: deal.endAt,
      };
    });
  }, [menuData, deals]);
  // Adapt placeholders/copy to THIS outlet's vertical (not the tenant default).
  const { config: cfg } = useOrderingConfig(outlet?.businessType);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [isFavorite, setIsFavorite] = useState(false);
  const [modalItem, setModalItem] = useState<AddToCartModalItem | null>(null);

  const addItem = useCartStore((state) => state.addItem);

  // Get unique categories (filter out empty/falsy names)
  const categories = useMemo(() => {
    const unique = new Set(menuItems.map((item) => item.category).filter(Boolean));
    return ["All", ...Array.from(unique)];
  }, [menuItems]);

  // Filter items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesSearch =
        search.length === 0 ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategory, search]);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  const handleAddToCart = (item: MenuItem) => {
    if (needsAddToCartModal(item)) {
      setModalItem({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        currency: item.currency,
        image: item.image,
        outletId: item.outletId,
        outletName: item.outletName,
        hasVariants: item.hasVariants,
        variants: item.variants,
        modifierGroups: item.modifierGroups,
      });
      return;
    }
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      outletId: item.outletId,
      outletName: item.outletName,
    });
    toast.success(`Added ${item.name} to cart`);
  };

  if (outletLoading) {
    return (
      <SiteShell>
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          Loading outlet...
        </div>
      </SiteShell>
    );
  }
  if (outletError || !outlet) {
    return (
      <SiteShell>
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-muted-foreground">
          <p>{outletError ? "Failed to load outlet." : "Outlet not found."}</p>
          <Button variant="outline" onClick={() => router.back()}>
            Go back
          </Button>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      {/* Hero Section with Outlet Info */}
      <div className="relative">
        {/* Cover Image */}
        <div className="relative h-48 w-full bg-muted sm:h-64">
          <ImageWithFallback
            src={outlet.image}
            alt={outlet.name}
            useCase={outlet.businessType}
            fill
            className="object-cover"
            sizes="100vw"
            priority
            fallbackClassName="bg-gradient-to-br from-primary/20 to-primary/5"
            iconClassName="size-16"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-background/90 px-3 py-2 text-sm font-medium shadow-sm backdrop-blur-sm hover:bg-background"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>

          {/* Favorite Button */}
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className={cn(
              "absolute right-4 top-4 rounded-full bg-background/90 p-2 shadow-sm backdrop-blur-sm transition",
              isFavorite ? "text-red-500" : "text-muted-foreground hover:text-foreground",
            )}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={cn("size-5", isFavorite && "fill-current")} />
          </button>
        </div>

        {/* Outlet Info */}
        <div className="mx-auto w-full max-w-4xl px-4">
          <div className="relative -mt-16 rounded-2xl border border-border bg-card p-4 shadow-lg sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground sm:text-2xl">{outlet.name}</h1>
                  {outlet.offerBadge && (
                    <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs font-semibold text-white">
                      {outlet.offerBadge}
                    </span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">{outlet.description}</p>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-4 pt-2 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="size-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{outlet.rating}</span>
                    <span className="text-muted-foreground">({outlet.reviewCount}+)</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="size-4" />
                    <span>{outlet.deliveryTime} min</span>
                  </div>
                  <span
                    className={cn(
                      "font-medium",
                      outlet.deliveryFee === "Free" ? "text-green-600" : "text-muted-foreground",
                    )}
                  >
                    {outlet.deliveryFee === "Free" ? "Free Delivery" : outlet.deliveryFee}
                  </span>
                </div>

                {/* Cuisines */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {outlet.cuisines.map((cuisine) => (
                    <span
                      key={cuisine}
                      className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {cuisine}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div className="flex shrink-0 flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-4" />
                  <span>{outlet.address}</span>
                </div>
                {outlet.phone && (
                  <a
                    href={`tel:${outlet.phone}`}
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Phone className="size-4" />
                    <span>{outlet.phone}</span>
                  </a>
                )}
                <div
                  className={cn(
                    "mt-1 flex items-center gap-1 font-medium",
                    outlet.isOpen ? "text-green-600" : "text-destructive",
                  )}
                >
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      outlet.isOpen ? "bg-green-500" : "bg-destructive",
                    )}
                  />
                  {outlet.isOpen ? "Open Now" : "Closed"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <div className="mx-auto w-full max-w-4xl px-4 py-6">
        {/* Search and Filters */}
        <div className="sticky top-16 z-10 space-y-4 border-b border-border bg-background pb-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <Button
                key={category}
                size="sm"
                variant={activeCategory === category ? "default" : "outline"}
                onClick={() => setActiveCategory(category)}
                className="shrink-0"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="mt-6 space-y-8">
          {menuLoading && menuItems.length === 0 ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex gap-4 rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="mt-auto h-5 w-24 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="size-24 shrink-0 animate-pulse rounded-lg bg-muted sm:size-28" />
                </div>
              ))}
            </div>
          ) : (
          <>
          {Object.entries(itemsByCategory).map(([category, items]) => (
            <div key={category}>
              <h2 className="mb-4 text-lg font-semibold text-foreground">{category}</h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onAddToCart={() => handleAddToCart(item)}
                    useCase={cfg.profile}
                  />
                ))}
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-muted-foreground">
                {menuItems.length === 0
                  ? "This outlet has no items available right now."
                  : "No items match your search."}
              </p>
            </div>
          )}
          </>
          )}
        </div>
      </div>

      <AddToCartModal item={modalItem} onClose={() => setModalItem(null)} />
    </SiteShell>
  );
}
