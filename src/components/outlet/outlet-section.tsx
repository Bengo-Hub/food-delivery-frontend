"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import { OutletCard, OutletGrid, type OutletCardProps } from "@/components/outlet/outlet-card";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

export type SectionVariant = "scroll" | "grid" | "numbered" | "logos";

export interface OutletSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  seeAllHref?: string;
  outlets: OutletCardProps[];
  isLoading?: boolean;
  variant?: SectionVariant;
  /** Favorites set (controlled by parent) */
  favorites?: Set<string>;
  onFavoriteToggle?: (id: string, isFavorite: boolean) => void;
  className?: string;
}

// =============================================================================
// SECTION HEADER (reusable)
// =============================================================================

function SectionHeader({
  title,
  subtitle,
  icon,
  seeAllHref,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  seeAllHref?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between sm:mb-4">
      <div className="flex items-center gap-2">
        {icon && <span className="text-primary">{icon}</span>}
        <div>
          <h2 className="text-base font-bold text-foreground sm:text-xl">{title}</h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
          )}
        </div>
      </div>
      {seeAllHref && (
        <Button variant="ghost" size="sm" className="h-9 text-primary" asChild>
          <Link href={seeAllHref as string}>See all</Link>
        </Button>
      )}
    </div>
  );
}

// =============================================================================
// SKELETON LOADERS
// =============================================================================

function OutletCardSkeleton() {
  return (
    <div className="w-[220px] shrink-0 overflow-hidden rounded-xl sm:w-[260px]">
      <Skeleton className="aspect-[16/10] w-full" />
      <div className="space-y-2 p-2 sm:p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

function OutletGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl">
          <Skeleton className="aspect-[16/10] w-full" />
          <div className="space-y-2 p-2 sm:p-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function LogosSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex shrink-0 flex-col items-center gap-2">
          <Skeleton className="size-16 rounded-full sm:size-20" />
          <Skeleton className="h-3 w-14" />
        </div>
      ))}
    </div>
  );
}

function NumberedSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex w-[200px] shrink-0 items-start gap-3 sm:w-[240px]">
          <Skeleton className="h-10 w-8 rounded" />
          <div className="flex-1">
            <Skeleton className="aspect-[16/10] w-full rounded-lg" />
            <div className="mt-2 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// HORIZONTAL SCROLL WRAPPER
// =============================================================================

function HorizontalScroll({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    if (!ref.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = ref.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  const scroll = (dir: "left" | "right") => {
    if (!ref.current) return;
    const amount = 300;
    ref.current.scrollTo({
      left: ref.current.scrollLeft + (dir === "left" ? -amount : amount),
      behavior: "smooth",
    });
    setTimeout(checkScroll, 350);
  };

  return (
    <div className="relative">
      {canScrollLeft && (
        <Button
          variant="outline"
          size="icon"
          className="absolute -left-4 top-1/2 z-10 hidden size-9 -translate-y-1/2 rounded-full border-border bg-background shadow-lg hover:bg-muted md:flex"
          onClick={() => scroll("left")}
          aria-label="Scroll left"
        >
          <ChevronLeft className="size-4" />
        </Button>
      )}
      <div
        ref={ref}
        onScroll={checkScroll}
        className="scrollbar-hide flex gap-3 overflow-x-auto scroll-smooth sm:gap-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>
      {canScrollRight && (
        <Button
          variant="outline"
          size="icon"
          className="absolute -right-4 top-1/2 z-10 hidden size-9 -translate-y-1/2 rounded-full border-border bg-background shadow-lg hover:bg-muted md:flex"
          onClick={() => scroll("right")}
          aria-label="Scroll right"
        >
          <ChevronRight className="size-4" />
        </Button>
      )}
    </div>
  );
}

// =============================================================================
// VARIANT RENDERERS
// =============================================================================

function ScrollVariant({
  outlets,
  favorites,
  onFavoriteToggle,
}: {
  outlets: OutletCardProps[];
  favorites?: Set<string>;
  onFavoriteToggle?: (id: string, isFav: boolean) => void;
}) {
  return (
    <HorizontalScroll>
      {outlets.map((o) => (
        <div key={o.id} className="w-[220px] shrink-0 sm:w-[260px]">
          <OutletCard
            {...o}
            isFavorite={favorites?.has(o.id) ?? false}
            {...(onFavoriteToggle != null ? { onFavoriteToggle } : {})}
          />
        </div>
      ))}
    </HorizontalScroll>
  );
}

function GridVariant({
  outlets,
  favorites,
  onFavoriteToggle,
}: {
  outlets: OutletCardProps[];
  favorites?: Set<string>;
  onFavoriteToggle?: (id: string, isFav: boolean) => void;
}) {
  return (
    <OutletGrid>
      {outlets.map((o) => (
        <OutletCard
          key={o.id}
          {...o}
          isFavorite={favorites?.has(o.id) ?? false}
          {...(onFavoriteToggle != null ? { onFavoriteToggle } : {})}
        />
      ))}
    </OutletGrid>
  );
}

function LogosVariant({ outlets }: { outlets: OutletCardProps[] }) {
  return (
    <HorizontalScroll>
      {outlets.map((o) => (
        <Link
          key={o.id}
          href={(o.href ?? "#") as string}
          className="group flex shrink-0 flex-col items-center gap-2"
        >
          <div className="relative size-16 overflow-hidden rounded-full border-2 border-border bg-muted transition-shadow group-hover:shadow-md sm:size-20">
            <ImageWithFallback
              src={o.image}
              alt={o.name}
              useCase={o.businessType}
              fill
              className="object-cover"
              sizes="80px"
              iconClassName="size-7"
            />
          </div>
          <span className="max-w-[72px] truncate text-center text-[11px] font-medium text-foreground sm:max-w-[84px] sm:text-xs">
            {o.name}
          </span>
          {o.deliveryTime && (
            <span className="-mt-1 text-[10px] text-muted-foreground">
              {o.deliveryTime} min
            </span>
          )}
        </Link>
      ))}
    </HorizontalScroll>
  );
}

function NumberedVariant({
  outlets,
  favorites,
  onFavoriteToggle,
}: {
  outlets: OutletCardProps[];
  favorites?: Set<string>;
  onFavoriteToggle?: (id: string, isFav: boolean) => void;
}) {
  return (
    <HorizontalScroll>
      {outlets.slice(0, 10).map((o, idx) => (
        <div
          key={o.id}
          className="flex w-[200px] shrink-0 items-start gap-2 sm:w-[240px] sm:gap-3"
        >
          {/* Rank number */}
          <span className="mt-1 text-3xl font-black leading-none text-primary/20 sm:text-4xl">
            {idx + 1}
          </span>
          <div className="min-w-0 flex-1">
            <OutletCard
              {...o}
              isFavorite={favorites?.has(o.id) ?? false}
              {...(onFavoriteToggle != null ? { onFavoriteToggle } : {})}
            />
          </div>
        </div>
      ))}
    </HorizontalScroll>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function OutletSection({
  title,
  subtitle,
  icon,
  seeAllHref,
  outlets,
  isLoading = false,
  variant = "scroll",
  favorites,
  onFavoriteToggle,
  className,
}: OutletSectionProps) {
  // Hide section if not loading and no results
  if (!isLoading && outlets.length === 0) return null;

  return (
    <section className={cn("py-4 sm:py-6", className)}>
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-8">
        <SectionHeader
          title={title}
          {...(subtitle != null ? { subtitle } : {})}
          {...(icon != null ? { icon } : {})}
          {...(seeAllHref != null ? { seeAllHref } : {})}
        />

        {isLoading ? (
          variant === "grid" ? (
            <OutletGridSkeleton />
          ) : variant === "logos" ? (
            <LogosSkeleton />
          ) : variant === "numbered" ? (
            <NumberedSkeleton />
          ) : (
            <div className="flex gap-3 overflow-hidden sm:gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <OutletCardSkeleton key={i} />
              ))}
            </div>
          )
        ) : variant === "grid" ? (
          <GridVariant
            outlets={outlets}
            {...(favorites != null ? { favorites } : {})}
            {...(onFavoriteToggle != null ? { onFavoriteToggle } : {})}
          />
        ) : variant === "logos" ? (
          <LogosVariant outlets={outlets} />
        ) : variant === "numbered" ? (
          <NumberedVariant
            outlets={outlets}
            {...(favorites != null ? { favorites } : {})}
            {...(onFavoriteToggle != null ? { onFavoriteToggle } : {})}
          />
        ) : (
          <ScrollVariant
            outlets={outlets}
            {...(favorites != null ? { favorites } : {})}
            {...(onFavoriteToggle != null ? { onFavoriteToggle } : {})}
          />
        )}
      </div>
    </section>
  );
}
