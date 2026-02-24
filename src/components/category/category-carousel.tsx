"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Category = {
  id: string;
  name: string;
  icon?: string;
  emoji?: string;
  imageUrl?: string;
};

export type CategoryCarouselProps = {
  categories: Category[];
  activeCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
  className?: string;
  /** Display mode: 'chips' for pill buttons, 'icons' for Uber Eats style with emoji/image above text */
  variant?: "chips" | "icons";
};

export function CategoryCarousel({
  categories,
  activeCategory,
  onCategoryChange,
  className,
  variant = "icons",
}: CategoryCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      const newScrollLeft =
        scrollContainerRef.current.scrollLeft +
        (direction === "left" ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
      setTimeout(checkScrollability, 300);
    }
  };

  // Check scrollability on mount and when categories change
  useEffect(() => {
    checkScrollability();
    // Also check after a short delay to account for layout rendering
    const timer = setTimeout(checkScrollability, 100);
    return () => clearTimeout(timer);
  }, [categories, checkScrollability]);

  if (variant === "chips") {
    return (
      <div className={cn("relative", className)}>
        {/* Left scroll button - hidden on mobile */}
        {canScrollLeft && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-background/80 shadow-md backdrop-blur-sm hover:bg-background md:flex"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
          >
            <ChevronLeft className="size-4" />
          </Button>
        )}

        {/* Scrollable container */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollability}
          className="scrollbar-hide flex gap-2 overflow-x-auto scroll-smooth pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categories.map((category) => {
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange?.(category.id)}
                className={cn(
                  "flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all active:scale-95 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm",
                  isActive
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-foreground hover:border-foreground/50",
                )}
              >
                {category.emoji && <span className="text-base">{category.emoji}</span>}
                {category.icon && <span className="text-base">{category.icon}</span>}
                <span className="whitespace-nowrap">{category.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right scroll button - hidden on mobile */}
        {canScrollRight && categories.length > 6 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-background/80 shadow-md backdrop-blur-sm hover:bg-background md:flex"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
          >
            <ChevronRight className="size-4" />
          </Button>
        )}
      </div>
    );
  }

  // Icon variant - Uber Eats style with emoji/image above text
  return (
    <div className={cn("relative", className)}>
      {/* Left scroll button */}
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

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScrollability}
        className="scrollbar-hide flex gap-1 overflow-x-auto scroll-smooth px-1 py-2 sm:gap-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange?.(category.id)}
              className={cn(
                "group flex shrink-0 flex-col items-center gap-0.5 rounded-lg p-1.5 transition-all active:scale-95 sm:min-w-[72px] sm:gap-1 sm:p-3",
                isActive ? "bg-muted" : "hover:bg-muted/50",
              )}
            >
              {/* Emoji/Image container */}
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-full text-xl transition-transform group-hover:scale-110 sm:size-14 sm:text-3xl",
                  isActive && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
                )}
              >
                {category.emoji ? (
                  <span>{category.emoji}</span>
                ) : category.imageUrl ? (
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="size-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-muted-foreground">?</span>
                )}
              </div>
              {/* Label */}
              <span
                className={cn(
                  "max-w-[56px] truncate text-center text-[10px] font-medium sm:max-w-[72px] sm:text-xs",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {category.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right scroll button */}
      {canScrollRight && categories.length > 8 && (
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

/**
 * Default categories for multi-business ordering platform.
 * These are fallback categories when API is unavailable.
 * The platform supports various business types: food, grocery, retail, pharmacy, flowers, etc.
 * Actual categories should be loaded from the backend API: GET /api/v1/menu/categories
 */
export const defaultCategories: Category[] = [
  // Food & Restaurants
  { id: "restaurants", name: "Restaurants", emoji: "🍽️" },
  { id: "grocery", name: "Grocery", emoji: "🛒" },
  { id: "pizza", name: "Pizza", emoji: "🍕" },
  { id: "chicken", name: "Chicken", emoji: "🍗" },
  { id: "sushi", name: "Sushi", emoji: "🍣" },
  { id: "fast-food", name: "Fast Food", emoji: "🍟" },
  { id: "chinese", name: "Chinese", emoji: "🥡" },
  { id: "indian", name: "Indian", emoji: "🍛" },
  { id: "burgers", name: "Burgers", emoji: "🍔" },
  { id: "healthy", name: "Healthy", emoji: "🥗" },
  { id: "breakfast", name: "Breakfast", emoji: "🥞" },
  { id: "desserts", name: "Desserts", emoji: "🍰" },
  { id: "coffee", name: "Coffee & Tea", emoji: "☕" },
  // Retail & Shopping
  { id: "retail", name: "Retail", emoji: "🛍️" },
  { id: "electronics", name: "Electronics", emoji: "📱" },
  { id: "fashion", name: "Fashion", emoji: "👕" },
  // Health & Wellness
  { id: "pharmacy", name: "Pharmacy", emoji: "💊" },
  { id: "health", name: "Health", emoji: "🏥" },
  // Specialty
  { id: "flowers", name: "Flowers", emoji: "💐" },
  { id: "gifts", name: "Gifts", emoji: "🎁" },
  { id: "alcohol", name: "Alcohol", emoji: "🍺" },
  { id: "convenience", name: "Convenience", emoji: "🏪" },
];

// Alias for backward compatibility
export const uberEatsCategories = defaultCategories;

// Add scrollbar hiding to global CSS
export const categoryCarouselStyles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;
