"use client";

import { ArrowLeft, Heart } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AddToCartModal, type AddToCartModalItem } from "@/components/catalog/add-to-cart-modal";
import { SiteShell } from "@/components/layout/site-shell";
import { categoryAnchorId, OutletMenuSection } from "@/components/outlet/outlet-menu-section";
import { OutletSidebar } from "@/components/outlet/outlet-sidebar";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { Skeleton } from "@/components/ui/skeleton";
import { useOutlet, useOutletMenu } from "@/hooks/use-catalog";
import { useOrderingConfig } from "@/hooks/use-ordering-config";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import type { MenuItem } from "@/types/catalog";

const OutletLocationMapCard = dynamic(
  () => import("@/components/outlet/outlet-location-map-card").then((m) => ({ default: m.OutletLocationMapCard })),
  { ssr: false, loading: () => <Skeleton className="h-48 w-full rounded-2xl" /> },
);

interface FoodOutletViewProps {
  orgSlug: string;
  outletId: string;
}

/** Uber-Eats-style restaurant-detail page for hospitality/quick_service outlets: a sticky
 *  left sidebar (identity, store info, jump-to-category nav) + hero/map card + a
 *  continuously-scrollable, category-anchored menu on the right. */
export function FoodOutletView({ orgSlug, outletId }: FoodOutletViewProps) {
  const router = useRouter();
  const { data: outlet, isLoading: outletLoading, error: outletError } = useOutlet(orgSlug, outletId);
  const { data: menuData, isLoading: menuLoading } = useOutletMenu(orgSlug, outletId, undefined, 1, 100);
  const menuItems = useMemo(() => menuData?.data ?? [], [menuData]);
  const { config: cfg } = useOrderingConfig(outlet?.businessType);

  const [search, setSearch] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [modalItem, setModalItem] = useState<AddToCartModalItem | null>(null);

  const addItem = useCartStore((state) => state.addItem);

  const categories = useMemo(() => {
    const unique = new Set(menuItems.map((item) => item.category).filter(Boolean));
    return Array.from(unique);
  }, [menuItems]);

  useEffect(() => {
    setActiveCategory((prev) => (prev && categories.includes(prev) ? prev : (categories[0] ?? null)));
  }, [categories]);

  // Scroll-spy: highlight whichever category section is nearest the top of the viewport as
  // the customer scrolls, so the sidebar nav stays in sync without another click.
  useEffect(() => {
    if (categories.length === 0) return;
    const sections = categories
      .map((c) => document.getElementById(categoryAnchorId(c)))
      .filter((el): el is HTMLElement => !!el);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const top = visible[0];
        if (!top) return;
        const match = categories.find((c) => categoryAnchorId(c) === top.target.id);
        if (match) setActiveCategory(match);
      },
      { rootMargin: "-180px 0px -60% 0px", threshold: 0 },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [categories, menuItems.length]);

  const handleAddToCart = (item: MenuItem) => {
    if (item.hasVariants || (item.modifierGroups?.length ?? 0) > 0) {
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
    addItem({ id: item.id, name: item.name, price: item.price, outletId: item.outletId, outletName: item.outletName });
    toast.success(`Added ${item.name} to cart`);
  };

  if (outletLoading) {
    return (
      <SiteShell>
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">Loading outlet...</div>
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
      <div className="relative h-40 w-full bg-muted sm:h-56">
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
        <button
          onClick={() => router.back()}
          className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-background/90 px-3 py-2 text-sm font-medium shadow-sm backdrop-blur-sm hover:bg-background"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
        <button
          onClick={() => setIsFavorite((v) => !v)}
          className={cn(
            "absolute right-4 top-4 rounded-full bg-background/90 p-2 shadow-sm backdrop-blur-sm transition",
            isFavorite ? "text-red-500" : "text-muted-foreground hover:text-foreground",
          )}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart className={cn("size-5", isFavorite && "fill-current")} />
        </button>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <OutletSidebar
            outlet={outlet}
            categories={categories}
            activeCategory={activeCategory}
            onCategorySelect={setActiveCategory}
            useCase={cfg.profile}
            className="hidden lg:sticky lg:top-24 lg:block lg:self-start"
          />

          <div className="space-y-6">
            <OutletLocationMapCard outlet={outlet} />

            {menuLoading && menuItems.length === 0 ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-4 rounded-xl border border-border bg-card p-4">
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
              <OutletMenuSection
                items={menuItems}
                search={search}
                onSearchChange={setSearch}
                onAddToCart={handleAddToCart}
                useCase={cfg.profile}
              />
            )}
          </div>
        </div>
      </div>

      <AddToCartModal item={modalItem} onClose={() => setModalItem(null)} />
    </SiteShell>
  );
}
