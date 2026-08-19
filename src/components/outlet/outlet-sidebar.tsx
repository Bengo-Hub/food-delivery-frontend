"use client";

import { Clock, MapPin, Phone, Star } from "lucide-react";
import { useState } from "react";

import { categoryAnchorId } from "@/components/outlet/outlet-menu-section";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { cn } from "@/lib/utils";
import type { Outlet } from "@/types/catalog";

interface OutletSidebarProps {
  outlet: Outlet;
  categories: string[];
  activeCategory: string | null;
  onCategorySelect: (category: string) => void;
  useCase?: string | undefined;
  className?: string;
}

/** Left sidebar for the hospitality outlet-detail page: outlet identity/rating, an
 *  expandable "Store info" block, and a jump-to-category menu nav — mirrors the Uber Eats
 *  restaurant page's left rail. */
export function OutletSidebar({
  outlet,
  categories,
  activeCategory,
  onCategorySelect,
  useCase,
  className,
}: OutletSidebarProps) {
  const [showStoreInfo, setShowStoreInfo] = useState(false);

  const handleJump = (category: string) => {
    onCategorySelect(category);
    document.getElementById(categoryAnchorId(category))?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <aside className={cn("space-y-4", className)}>
      <div className="relative size-16 overflow-hidden rounded-2xl border border-border bg-card">
        <ImageWithFallback src={outlet.image} alt={outlet.name} useCase={useCase} fill className="object-cover" sizes="64px" />
      </div>

      <div>
        <h1 className="text-lg font-bold text-foreground">{outlet.name}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="size-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-foreground">{outlet.rating}</span>
            <span>({outlet.reviewCount}+)</span>
          </span>
          {outlet.cuisines.length > 0 && <span>{outlet.cuisines.join(" · ")}</span>}
        </div>
        <div
          className={cn(
            "mt-2 flex items-center gap-1 text-sm font-medium",
            outlet.isOpen ? "text-green-600" : "text-destructive",
          )}
        >
          <span className={cn("size-2 rounded-full", outlet.isOpen ? "bg-green-500" : "bg-destructive")} />
          {outlet.isOpen ? "Open Now" : "Closed"}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowStoreInfo((v) => !v)}
        className="w-full rounded-full border border-border px-4 py-2 text-left text-sm font-medium text-foreground transition hover:bg-muted"
      >
        Store info
      </button>
      {showStoreInfo && (
        <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          {outlet.address && (
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              <span>{outlet.address}</span>
            </div>
          )}
          {outlet.phone && (
            <a href={`tel:${outlet.phone}`} className="flex items-center gap-2 text-primary hover:underline">
              <Phone className="size-4 shrink-0" />
              <span>{outlet.phone}</span>
            </a>
          )}
          <div className="flex items-center gap-2">
            <Clock className="size-4 shrink-0" />
            <span>{outlet.deliveryTime} min · {outlet.deliveryFee}</span>
          </div>
        </div>
      )}

      {categories.length > 0 && (
        <nav className="space-y-1 border-t border-border pt-4">
          <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Menu</p>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleJump(category)}
              className={cn(
                "block w-full rounded-lg px-2 py-2 text-left text-sm font-medium transition",
                activeCategory === category
                  ? "bg-brand-muted text-brand-emphasis"
                  : "text-foreground hover:bg-muted",
              )}
            >
              {category}
            </button>
          ))}
        </nav>
      )}
    </aside>
  );
}
