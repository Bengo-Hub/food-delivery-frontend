"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";

import { CategoryCarousel, type Category } from "@/components/category/category-carousel";
import { FilterBar, type ActiveFilters, defaultFilters } from "@/components/layout/filter-bar";
import { OutletCard } from "@/components/outlet/outlet-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories, useOutlets } from "@/hooks/use-catalog";
import { useOrderingConfig } from "@/hooks/use-ordering-config";
import { cn } from "@/lib/utils";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useDiningModeStore } from "@/store/dining-mode";

const PickupMapView = dynamic(
  () => import("@/components/pickup/pickup-map-view").then((m) => ({ default: m.PickupMapView })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full rounded-none" />,
  },
);

export function PickupLayout() {
  const orgSlug = useOrgSlug();
  const [selectedOutletId, setSelectedOutletId] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActiveFilters>(defaultFilters);
  const [activeCategory, setActiveCategory] = useState("all");
  const [mobileShowMap, setMobileShowMap] = useState(false);
  const deliveryLocation = useDiningModeStore((s) => s.deliveryLocation);
  const { copy, profile } = useOrderingConfig();
  const { data: apiCategories } = useCategories(orgSlug, undefined, profile);
  // No hardcoded food-emoji fallback — an empty list renders as an empty (not
  // fake-food) carousel; CategoryCarousel supplies its own use-case-aware SVG
  // placeholder for categories without an icon.
  const categories: Category[] = useMemo(
    () =>
      (apiCategories ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        ...(c.emoji ? { emoji: c.emoji } : {}),
        ...(c.image ? { imageUrl: c.image } : {}),
      })),
    [apiCategories],
  );

  // Fetch outlets with pickup filter
  const { data: outletsData, isLoading } = useOutlets(orgSlug, {
    pickup: true,
    ...(activeCategory !== "all" ? { category: activeCategory } : {}),
    ...(deliveryLocation
      ? { lat: deliveryLocation.latitude, lng: deliveryLocation.longitude }
      : {}),
  });
  const outlets = outletsData?.data ?? [];

  const userLocation = deliveryLocation
    ? { lat: deliveryLocation.latitude, lng: deliveryLocation.longitude }
    : undefined;

  const handleFilterChange = useCallback((f: ActiveFilters) => {
    setFilters(f);
  }, []);

  const handleOutletSelect = useCallback((outletId: string) => {
    setSelectedOutletId(outletId);
    setMobileShowMap(false);
    // Scroll to outlet card in the list
    const el = document.getElementById(`outlet-card-${outletId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  return (
    <div className="flex min-h-[calc(100dvh-64px)] flex-col lg:h-[calc(100dvh-64px)] lg:flex-row">
      {/* Mobile: Map/List toggle */}
      <div className="flex border-b border-border bg-background lg:hidden">
        <button
          onClick={() => setMobileShowMap(false)}
          className={cn(
            "flex-1 py-2.5 text-center text-sm font-medium transition",
            !mobileShowMap
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground",
          )}
        >
          List ({outlets.length})
        </button>
        <button
          onClick={() => setMobileShowMap(true)}
          className={cn(
            "flex-1 py-2.5 text-center text-sm font-medium transition",
            mobileShowMap
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground",
          )}
        >
          Map
        </button>
      </div>

      {/* Left Panel: Outlet List */}
      <div
        className={cn(
          "flex flex-1 flex-col overflow-y-auto lg:max-w-[480px] lg:border-r lg:border-border",
          mobileShowMap && "hidden lg:flex",
        )}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 space-y-3 border-b border-border bg-background px-4 pb-3 pt-4">
          <h1 className="text-lg font-bold sm:text-xl">Pickup nearby</h1>

          {/* Filters */}
          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            className="!pb-0"
          />

          {/* Categories */}
          <CategoryCarousel
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            variant="icons"
            useCase={profile}
          />
        </div>

        {/* Outlet List */}
        <div className="flex-1 p-3 sm:p-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-lg sm:h-48" />
              ))}
            </div>
          ) : outlets.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <p className="font-medium">No pickup {copy.outletLabelPlural.toLowerCase()} found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or location.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {outlets.map((outlet) => (
                <div
                  key={outlet.id}
                  id={`outlet-card-${outlet.id}`}
                  className={cn(
                    "rounded-lg transition-shadow",
                    selectedOutletId === outlet.id && "ring-2 ring-primary shadow-md",
                  )}
                  onClick={() => setSelectedOutletId(outlet.id)}
                >
                  <OutletCard
                    id={outlet.id}
                    name={outlet.name}
                    {...(outlet.image != null ? { image: outlet.image } : {})}
                    businessType={outlet.businessType}
                    rating={outlet.rating}
                    reviewCount={outlet.reviewCount}
                    deliveryTime={outlet.deliveryTime}
                    deliveryFee={outlet.deliveryFee}
                    cuisines={outlet.cuisines}
                    isOpen={outlet.isOpen}
                    href={`/${orgSlug}/outlet/${outlet.id}`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Map */}
      <div
        className={cn(
          "lg:flex-1",
          mobileShowMap
            ? "flex-1"
            : "hidden lg:block",
          "min-h-[300px] lg:min-h-0",
        )}
      >
        <PickupMapView
          outlets={outlets}
          {...(userLocation != null ? { userLocation } : {})}
          selectedOutletId={selectedOutletId}
          onOutletSelect={handleOutletSelect}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
