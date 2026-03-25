"use client";

import { ChevronDown, MapPin, Search } from "lucide-react";
import { useState } from "react";

import type { LatLngTuple } from "leaflet";

import { LocationSearchInput } from "@/components/location/location-search-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTenantConfig } from "@/hooks/use-tenant-config";
import { useUserLocation } from "@/hooks/use-user-location";
import { cn } from "@/lib/utils";
import { useDiningModeStore } from "@/store/dining-mode";

export type HeroSectionProps = {
  onSearch?: (query: string) => void;
  className?: string;
};

export function HeroSection({
  onSearch,
  className,
}: HeroSectionProps) {
  const [locationOpen, setLocationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { copy } = useTenantConfig();

  const deliveryLocation = useDiningModeStore((s) => s.deliveryLocation);
  const setDeliveryLocation = useDiningModeStore((s) => s.setDeliveryLocation);

  const { coords, status, error, requestLocation } = useUserLocation();

  const displayAddress = deliveryLocation?.address ?? "Select delivery location";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const handleLocationSelect = (latlng: LatLngTuple, label: string) => {
    setDeliveryLocation({
      address: label,
      latitude: latlng[0],
      longitude: latlng[1],
    });
    setLocationOpen(false);
  };

  const handleUseCurrent = () => {
    requestLocation();
    if (status === "resolved") {
      setDeliveryLocation({
        address: `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`,
        latitude: coords[0],
        longitude: coords[1],
      });
    }
  };

  return (
    <>
      <section
        className={cn(
          "border-b border-border bg-gradient-to-b from-background to-muted/20 py-6 sm:py-8 md:py-12",
          className,
        )}
      >
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2 text-center sm:text-left">
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                {copy.heroTitle}
              </h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                {copy.heroSubtitle}
              </p>
            </div>

            {/* Location & Search */}
            <div className="space-y-3">
              {/* Location Selector */}
              <button
                onClick={() => setLocationOpen(true)}
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left shadow-sm transition hover:border-primary hover:shadow-md sm:w-auto"
              >
                <MapPin className="size-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{copy.deliverToLabel}</p>
                  <p className="truncate text-sm font-medium">{displayAddress}</p>
                </div>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
              </button>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder={copy.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card py-3 pl-12 pr-4 text-sm shadow-sm transition placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Location Selection Dialog */}
      <Dialog open={locationOpen} onOpenChange={setLocationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter your delivery address</DialogTitle>
            <DialogDescription>
              {copy.dialogDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <LocationSearchInput
              value={deliveryLocation?.address ?? null}
              status={status}
              error={error}
              onSelect={handleLocationSelect}
              onUseCurrent={handleUseCurrent}
              label="Delivery location"
              placeholder="Search for an address or landmark"
              autoFocus
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
