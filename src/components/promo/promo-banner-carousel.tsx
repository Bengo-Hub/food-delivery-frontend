"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  priceBadge?: string;
  backgroundColor?: string;
  textColor?: string;
}

interface PromoBannerCarouselProps {
  banners: PromoBanner[];
  className?: string;
}

export function PromoBannerCarousel({ banners, className }: PromoBannerCarouselProps) {
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
    if (!scrollContainerRef.current) return;
    const scrollAmount = 400;
    const newScrollLeft =
      scrollContainerRef.current.scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount);
    scrollContainerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });
    setTimeout(checkScrollability, 300);
  };

  if (!banners || banners.length === 0) return null;

  return (
    <div className={cn("relative", className)}>
      {/* Left Arrow */}
      {canScrollLeft && (
        <Button
          variant="outline"
          size="icon"
          className="absolute -left-4 top-1/2 z-10 hidden size-10 -translate-y-1/2 rounded-full border-border bg-background shadow-lg hover:bg-muted md:flex"
          onClick={() => scroll("left")}
          aria-label="Previous banner"
        >
          <ChevronLeft className="size-5" />
        </Button>
      )}

      {/* Carousel Container */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScrollability}
        className="scrollbar-hide flex gap-4 overflow-x-auto scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {banners.map((banner) => (
          <PromoBannerCard key={banner.id} banner={banner} />
        ))}
      </div>

      {/* Right Arrow */}
      {canScrollRight && banners.length > 2 && (
        <Button
          variant="outline"
          size="icon"
          className="absolute -right-4 top-1/2 z-10 hidden size-10 -translate-y-1/2 rounded-full border-border bg-background shadow-lg hover:bg-muted md:flex"
          onClick={() => scroll("right")}
          aria-label="Next banner"
        >
          <ChevronRight className="size-5" />
        </Button>
      )}
    </div>
  );
}

interface PromoBannerCardProps {
  banner: PromoBanner;
}

function PromoBannerCard({ banner }: PromoBannerCardProps) {
  const bgColor = banner.backgroundColor || "#f87171"; // Default coral/red
  const textColor = banner.textColor || "#000000";

  return (
    <Link
      href={banner.ctaLink as any}
      className="group relative flex min-w-[280px] shrink-0 overflow-hidden rounded-xl transition-transform hover:scale-[1.02] sm:min-w-[340px] md:min-w-[400px]"
      style={{ backgroundColor: bgColor }}
    >
      {/* Text Content */}
      <div className="flex flex-1 flex-col justify-center p-3 sm:p-5" style={{ color: textColor }}>
        <h3 className="text-base font-bold leading-tight sm:text-xl">{banner.title}</h3>
        <p className="mt-0.5 text-xs opacity-90 sm:mt-1 sm:text-sm">{banner.subtitle}</p>
        {banner.priceBadge && (
          <div className="mt-3">
            <span className="inline-block rounded-full bg-black/90 px-3 py-1.5 text-xs font-semibold text-white">
              {banner.priceBadge}
            </span>
          </div>
        )}
        {banner.ctaText && (
          <Button
            variant="secondary"
            size="sm"
            className="mt-3 w-fit bg-white text-black hover:bg-white/90"
          >
            {banner.ctaText}
          </Button>
        )}
      </div>

      {/* Image */}
      <div className="relative aspect-square w-1/3 min-w-[120px] sm:w-2/5">
        <Image
          src={banner.imageUrl}
          alt={banner.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 120px, 180px"
        />
      </div>
    </Link>
  );
}

// Mock data for development
export const mockPromoBanners: PromoBanner[] = [
  {
    id: "promo-1",
    title: "Pizza Pleasures Await!",
    subtitle: "Classic Medium Everyday Offer!",
    imageUrl: "/images/promo-pizza.svg",
    ctaText: "Order Now",
    ctaLink: "/menu?category=pizza",
    priceBadge: "Now at Ksh. 690!",
    backgroundColor: "#f87171",
  },
  {
    id: "promo-2",
    title: "BOGO Alert! Pineapple Mint Cake",
    subtitle: "Buy one Java's Pineapple Mint cake slice & get 1 Free",
    imageUrl: "/images/promo-cake.svg",
    ctaText: "Order Now",
    ctaLink: "/menu?category=desserts",
    backgroundColor: "#86efac",
    textColor: "#000000",
  },
  {
    id: "promo-3",
    title: "Pay with your Mastercard card, enjoy up to 50% off",
    subtitle: "Step 1: Add card to Wallet. Step 2: Use Code MC50EATS",
    imageUrl: "/images/promo-mastercard.svg",
    ctaText: "",
    ctaLink: "/wallet",
    backgroundColor: "#fde047",
    textColor: "#000000",
  },
  {
    id: "promo-4",
    title: "New Year, New You",
    subtitle: "Fresh groceries and essentials to start strong",
    imageUrl: "/images/promo-fresh.svg",
    ctaText: "Order now",
    ctaLink: "/menu?category=grocery",
    backgroundColor: "#c4b5fd",
    textColor: "#000000",
  },
];
