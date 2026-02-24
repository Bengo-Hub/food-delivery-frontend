"use client";

import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  discountPercent?: number;
  originalPrice?: number;
  href?: string;
  className?: string;
  onAddToCart?: (id: string) => void;
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
  discountPercent,
  originalPrice,
  href,
  className,
  onAddToCart,
}: FeaturedItemProps) {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.(id);
  };

  const itemHref = href || `/outlet/${outletId}/item/${id}`;

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
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="240px"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <span className="text-4xl opacity-30">🍽️</span>
          </div>
        )}

        {/* Discount Badge */}
        {discountPercent && discountPercent > 0 && (
          <div className="absolute left-2 top-2">
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
              -{discountPercent}%
            </span>
          </div>
        )}

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
