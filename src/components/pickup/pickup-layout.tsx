"use client";

import { useCallback, useState } from "react";

import { CategoryCarousel, defaultCategories } from "@/components/category/category-carousel";
import { FilterBar, type ActiveFilters, defaultFilters } from "@/components/layout/filter-bar";
import { OutletCard } from "@/components/outlet/outlet-card";
import { PickupMapView } from "@/components/pickup/pickup-map-view";
import { Skeleton } from "@/components/ui/skeleton";
import { useOutlets } from "@/hooks/use-catalog";
import { useCategories } from "@/hooks/use-categories";
import { useTenantConfig } from "@/hooks/use-tenant-config";
import { cn } from "@/lib/utils";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useDiningModeStore } from "@/store/dining-mode";

export function PickupLayout() {
  const orgSlug = useOrgSlug();
  const [selectedOutletId, setSelectedOutletId] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActiveFilters>(defaultFilters);
  const [activeCategory, setActiveCategory] = useState("all");
  const deliveryLocation = useDiningModeStore((s) => s.deliveryLocation);
  const { copy } = useTenantConfig();
  const { data: apiCategories } = useCategories();
  const categories = apiCategories?.length ? apiCategories : defaultCategories;

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
    // Scroll to outlet card in the list
    const el = document.getElementById(`outlet-card-${outletId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col lg:flex-row">
      {/* Left Panel: Outlet List */}
      <div className="flex flex-1 flex-col overflow-y-auto border-r border-border lg:max-w-[480px]">
        {/* Header */}
        <div className="sticky top-0 z-10 space-y-3 border-b border-border bg-background px-4 pb-3 pt-4">
          <h1 className="text-xl font-bold">Pickup nearby</h1>

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
          />
        </div>

        {/* Outlet List */}
        <div className="flex-1 p-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-lg" />
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
            <div className="space-y-4">
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

      {/* Right Panel: Map (hidden on mobile by default, shown as bottom section) */}
      <div className="h-64 lg:h-full lg:flex-1">
        <PickupMapView
          outlets={outlets}
          {...(userLocation != null ? { userLocation } : {})}
          selectedOutletId={selectedOutletId}
          onOutletSelect={handleOutletSelect}
          className="h-full"
        />
      </div>
    </div>
  );
}
