"use client";

import Image from "next/image";

import { UseCaseIllustration } from "@/components/ui/use-case-icon";
import { cn, getMediaUrl } from "@/lib/utils";

interface ImageWithFallbackProps {
  /** Raw (possibly relative/empty) image URL from the backend. */
  src?: string | null;
  alt: string;
  /** Raw or canonical use_case/profile string — drives the fallback illustration. */
  useCase?: string | null;
  className?: string;
  /** Background/layout classes for the fallback placeholder container. */
  fallbackClassName?: string;
  iconClassName?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  loading?: "eager" | "lazy";
}

/**
 * Single choke point for rendering an item/outlet/category image with a
 * use-case-aware SVG fallback when no real image exists. Replaces three
 * previously-inconsistent mechanisms across this app: a hardcoded tenant photo
 * fallback baked into getMediaUrl, an ad-hoc emoji switch in OutletCard, and a
 * single hardcoded food emoji in FeaturedItemCard/ItemImageGallery. Never
 * falls back to a bundled photo — only a neutral vector icon.
 */
export function ImageWithFallback({
  src,
  alt,
  useCase,
  className,
  fallbackClassName,
  iconClassName = "size-10 sm:size-14",
  fill,
  width,
  height,
  sizes,
  priority,
  loading,
}: ImageWithFallbackProps) {
  const resolved = getMediaUrl(src);

  if (!resolved) {
    return (
      <div
        className={cn(
          fill && "absolute inset-0",
          "flex items-center justify-center bg-gradient-to-br from-muted to-muted/50",
          !fill && "size-full",
          fallbackClassName,
        )}
        style={!fill && width && height ? { width, height } : undefined}
      >
        <UseCaseIllustration useCase={useCase} className={iconClassName} />
      </div>
    );
  }

  if (fill) {
    return (
      <Image
        src={resolved}
        alt={alt}
        fill
        className={className}
        {...(sizes ? { sizes } : {})}
        {...(priority ? { priority } : {})}
        {...(loading ? { loading } : {})}
      />
    );
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      width={width ?? 64}
      height={height ?? 64}
      className={className}
      {...(sizes ? { sizes } : {})}
      {...(priority ? { priority } : {})}
      {...(loading ? { loading } : {})}
    />
  );
}
