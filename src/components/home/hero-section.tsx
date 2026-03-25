"use client";

import { ChevronDown, MapPin, Search } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTenantConfig } from "@/hooks/use-tenant-config";
import { cn } from "@/lib/utils";

export type HeroSectionProps = {
  location?: string;
  onLocationChange?: (location: string) => void;
  onSearch?: (query: string) => void;
  className?: string;
};

export function HeroSection({
  location = "Select delivery location",
  onLocationChange: _onLocationChange,
  onSearch,
  className,
}: HeroSectionProps) {
  const [locationOpen, setLocationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { copy } = useTenantConfig();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
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
                  <p className="truncate text-sm font-medium">{location}</p>
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
          <div className="space-y-4 py-4">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Enter street address or area"
                className="w-full rounded-lg border border-border bg-background py-3 pl-11 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                defaultValue={location !== "Select delivery location" ? location : ""}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                // Handle location update
                setLocationOpen(false);
              }}
            >
              Confirm Location
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
