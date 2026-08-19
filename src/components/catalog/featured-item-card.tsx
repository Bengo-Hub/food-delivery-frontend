"use client";

import React, { useState } from "react";
import { Heart, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { cn } from "@/lib/utils";
import { useOrgSlug } from "@/providers/org-slug-provider";
import type { CatalogVariant, ModifierGroup } from "@/types/catalog";

export interface FeaturedItemProps {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  image?: string;
  outletId: string;
  outletName: string;
  category?: string;
  /** Outlet/tenant use_case — drives the SVG placeholder when there's no image. */
  useCase?: string;
  discountPercent?: number;
  originalPrice?: number;
  href?: string;
  className?: string;
  onAddToCart?: (id: string) => void;
  /** Not rendered by the card itself — carried through so the parent's add-to-cart
   *  handler can decide whether to open the modifier/variant modal. */
  hasVariants?: boolean | undefined;
  variants?: CatalogVariant[] | undefined;
  modifierGroups?: ModifierGroup[] | undefined;
}

export function FeaturedItemCard({
  id,
  name,
  description,
  price,
  currency = "KES",
  image,
  outletId,
  outletName,
  category: _category,
  useCase,
  discountPercent,
  originalPrice,
  href,
  className,
  onAddToCart,
}: FeaturedItemProps) {
  const orgSlug = useOrgSlug();
  const [isWhitelisted, setIsWhitelisted] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.(id);
  };

  const handleWhitelist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWhitelisted(!isWhitelisted);
  };

  const itemHref = href || (id ? `/${orgSlug}/catalog/${id}` : "#");

  return (
    <Link
      href={itemHref as any}
      className={cn(
        "group flex w-44 shrink-0 flex-col overflow-hidden rounded-xl bg-card transition-all hover:shadow-lg sm:w-60",
        className,
      )}
    >
      {/* Image */}
      <div className="relative h-44 w-full overflow-hidden bg-muted sm:h-60">
        <ImageWithFallback
          src={image}
          alt={name}
          useCase={useCase}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="240px"
          iconClassName="size-10"
        />

        {/* Discount Badge */}
        {discountPercent && discountPercent > 0 && (
          <div className="absolute left-2 top-2">
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
              -{discountPercent}%
            </span>
          </div>
        )}

        {/* Whitelist Toggle */}
        <button
          onClick={handleWhitelist}
          className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-all hover:scale-110 sm:size-9"
          aria-label="Add to whitelist"
        >
          <Heart className={cn("size-4 transition-colors", isWhitelisted ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
        </button>

        {/* Add to Cart Button */}
        <Button
          size="icon"
          className="absolute bottom-2 right-2 size-8 rounded-full opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
          onClick={handleAddToCart}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-2 sm:p-3">
        <h3 className="line-clamp-1 text-xs font-semibold text-foreground sm:text-sm">{name}</h3>

        {description && (
          <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground sm:line-clamp-2 sm:text-xs">{description}</p>
        )}

        <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground sm:mt-1 sm:text-xs">{outletName}</p>

        {/* Price */}
        <div className="mt-auto flex items-center gap-2 pt-2">
          <span className="text-sm font-bold text-foreground">
            {currency} {price.toLocaleString()}
          </span>
          {originalPrice && originalPrice > price && (
            <span className="text-xs text-muted-foreground line-through">
              {currency} {originalPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// Horizontal scrollable grid for featured items
export function FeaturedItemsCarousel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("scrollbar-hide flex gap-4 overflow-x-auto pb-2", className)}
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {children}
    </div>
  );
}
