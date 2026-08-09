"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { UseCaseIllustration } from "@/components/ui/use-case-icon";
import { cn, getMediaUrl } from "@/lib/utils";

interface ImageWithFallbackProps {
  /** Raw (possibly relative/empty) image URL from the backend. */
  src?: string | null | undefined;
  alt: string;
  /** Raw or canonical use_case/profile string — drives the fallback illustration. */
  useCase?: string | null | undefined;
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
  // A resolved-but-broken URL (wrong host, deleted file, 404) must fall back to the same
  // illustration as a genuinely-missing URL — otherwise it silently renders next/image's
  // broken-image glyph instead of the intended default, which is what most items were doing.
  const [loadError, setLoadError] = useState(false);
  // Facebook-style skeleton: the card/grid itself never waits on this — only the image slot
  // shows a shimmer until the photo actually decodes, then cross-fades in.
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    setLoadError(false);
    setIsLoaded(false);
  }, [resolved]);

  if (!resolved || loadError) {
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

  const imageProps = {
    src: resolved,
    alt,
    onLoad: () => setIsLoaded(true),
    onError: () => setLoadError(true),
    className: cn(className, "transition-opacity duration-300", isLoaded ? "opacity-100" : "opacity-0"),
    ...(sizes ? { sizes } : {}),
    ...(priority ? { priority } : {}),
    ...(loading ? { loading } : {}),
  };

  if (fill) {
    return (
      <div className="absolute inset-0">
        {!isLoaded && <Skeleton className={cn("absolute inset-0 rounded-none", className)} />}
        <Image {...imageProps} fill />
      </div>
    );
  }

  return (
    <div className="relative inline-block" style={width && height ? { width, height } : undefined}>
      {!isLoaded && <Skeleton className={cn("absolute inset-0 rounded-none", className)} />}
      <Image {...imageProps} width={width ?? 64} height={height ?? 64} />
    </div>
  );
}
