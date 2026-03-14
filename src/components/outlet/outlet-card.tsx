"use client";

import { Heart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { cn, getMediaUrl } from "@/lib/utils";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useIsPickupMode } from "@/store/dining-mode";

export type OutletCardProps = {
  id: string;
  name: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
  deliveryTime?: string;
  deliveryFee?: string;
  distance?: string;
  cuisines?: string[];
  promoted?: boolean;
  discount?: string;
  offerBadge?: string;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string, isFavorite: boolean) => void;
  href?: string;
  className?: string;
  /** Business type for customizing display (food, retail, pharmacy, etc.) */
  businessType?: string;
};

export function OutletCard({
  id,
  name,
  image,
  rating = 4.5,
  reviewCount = 0,
  deliveryTime = "25-35",
  deliveryFee = "Free",
  distance,
  cuisines = [],
  promoted = false,
  discount,
  offerBadge,
  isFavorite: initialFavorite = false,
  onFavoriteToggle,
  href,
  className,
  businessType,
}: OutletCardProps) {
  const orgSlug = useOrgSlug();
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const isPickupMode = useIsPickupMode();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = !isFavorite;
    setIsFavorite(newState);
    onFavoriteToggle?.(id, newState);
  };

  const outletUrl = href || `/${orgSlug}/outlet/${id}`;

  // Format delivery fee display
  const formatDeliveryFee = (fee: string) => {
    if (fee.toLowerCase() === "free") return "Free delivery";
    if (fee.match(/^\d+$/)) return `KES${fee} Delivery Fee`;
    return fee;
  };

  // Format review count
  const formatReviewCount = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k+`;
    if (count > 0) return `(${count})`;
    return "";
  };

  return (
    <Link
      href={outletUrl as any}
      className={cn(
        "group block overflow-hidden rounded-xl bg-card transition-all hover:shadow-lg",
        className,
      )}
    >
      {/* Image Section */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {image ? (
          <Image
            src={getMediaUrl(image)}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <span className="text-4xl opacity-30">
              {businessType === "pharmacy"
                ? "💊"
                : businessType === "flowers"
                  ? "💐"
                  : businessType === "retail"
                    ? "🛍️"
                    : businessType === "grocery"
                      ? "🛒"
                      : "🍽️"}
            </span>
          </div>
        )}

        {/* Offer Badge - Top Left (Uber Eats style) */}
        {(offerBadge || discount) && (
          <div className="absolute left-0 top-3">
            <Badge
              className={cn(
                "rounded-l-none rounded-r-full px-3 py-1 text-xs font-semibold shadow-md",
                offerBadge?.toLowerCase().includes("top offer")
                  ? "bg-red-500 text-white"
                  : "bg-green-500 text-white",
              )}
            >
              {offerBadge || discount}
            </Badge>
          </div>
        )}

        {/* Promoted Badge - Top Left under offer */}
        {promoted && !offerBadge && !discount && (
          <div className="absolute left-2 top-2">
            <Badge className="bg-black/70 text-xs font-medium text-white backdrop-blur-sm">
              Sponsored
            </Badge>
          </div>
        )}

        {/* Favorite Heart - Top Right */}
        <button
          onClick={handleFavoriteClick}
          className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-white/90 shadow-md transition-all hover:scale-110 hover:bg-white sm:right-2 sm:top-2 sm:size-8"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            className={cn(
              "size-3.5 transition-colors sm:size-4",
              isFavorite ? "fill-red-500 text-red-500" : "text-gray-600",
            )}
          />
        </button>
      </div>

      {/* Content Section - Uber Eats Style */}
      <div className="space-y-1 p-2 sm:space-y-1.5 sm:p-3">
        {/* Name */}
        <h3 className="line-clamp-1 text-xs font-semibold text-foreground sm:text-sm">{name}</h3>

        {/* Delivery Fee Badge + Rating Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Delivery info or distance for pickup */}
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground sm:text-xs">
            {isPickupMode ? (
              <>{distance && <span className="font-medium">{distance}</span>}</>
            ) : (
              <>
                <span className="inline-flex size-4 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-[10px]">🛵</span>
                </span>
                <span>{formatDeliveryFee(deliveryFee)}</span>
              </>
            )}
          </div>
        </div>

        {/* Rating + Time Row */}
        <div className="flex flex-wrap items-center gap-1 text-[10px] sm:gap-2 sm:text-xs">
          {/* Rating */}
          {rating > 0 && (
            <div className="flex items-center gap-0.5">
              <Star className="size-3.5 fill-current text-foreground" />
              <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
              {reviewCount > 0 && (
                <span className="text-muted-foreground">{formatReviewCount(reviewCount)}</span>
              )}
            </div>
          )}

          {/* Separator */}
          {rating > 0 && deliveryTime && <span className="text-muted-foreground">•</span>}

          {/* Time */}
          {deliveryTime && (
            <span className="text-muted-foreground">
              {isPickupMode ? `${deliveryTime} min` : `${deliveryTime} min`}
            </span>
          )}

          {/* Distance for delivery mode */}
          {!isPickupMode && distance && (
            <>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{distance}</span>
            </>
          )}
        </div>

        {/* Cuisines/Categories - Only if provided */}
        {cuisines.length > 0 && (
          <p className="line-clamp-1 hidden text-xs text-muted-foreground sm:block">
            {cuisines.slice(0, 3).join(" • ")}
          </p>
        )}
      </div>
    </Link>
  );
}

// Grid wrapper component for outlet cards
export function OutletGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4", className)}>
      {children}
    </div>
  );
}
