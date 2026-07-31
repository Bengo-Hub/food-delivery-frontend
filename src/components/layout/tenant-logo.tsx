"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

interface TenantLogoProps {
  src: string;
  alt: string;
  /** Tailwind height class for this placement, e.g. "h-8" — width follows the logo's own
   *  aspect ratio (see below), so callers only need to pick a height per breakpoint. */
  className?: string;
  priority?: boolean;
}

/**
 * Renders a tenant's brand logo/wordmark at its own aspect ratio — never force-cropped into a
 * circle. Tenant logos aren't user avatars: some are square app-icons, many are wide wordmarks,
 * and a hard `rounded-full object-cover` crop mangles either shape (this replaced exactly that
 * bug, copy-pasted across the header, the mobile drawer, and the admin brand-summary card).
 *
 * Only the height is fixed via `className`; width is left to `w-auto` so the browser derives it
 * from the image's real intrinsic aspect ratio rather than the fixed width/height props below
 * (which exist only to give next/image a starting box and avoid layout shift).
 *
 * Falls back to the platform default mark if the tenant's own logo URL 404s, instead of leaving
 * next/image's broken-image icon in the header.
 */
export function TenantLogo({ src, alt, className, priority = false }: TenantLogoProps) {
  const [imgSrc, setImgSrc] = useState(src);
  useEffect(() => setImgSrc(src), [src]);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={160}
      height={40}
      priority={priority}
      className={cn("h-8 w-auto max-w-[10rem] object-contain", className)}
      onError={() => setImgSrc(brand.assets.logo)}
    />
  );
}
