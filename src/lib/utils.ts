import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolves a media URL from the backend.
 * If the URL is relative (starts with /media), it prepends the backend base URL.
 *
 * Returns `undefined` when there is no real URL to resolve — callers MUST fall
 * through to a use-case-aware placeholder (see `ImageWithFallback` /
 * `UseCaseIllustration`) instead of assuming a string is always returned. This
 * function must NEVER default to a bundled tenant photo (it previously fell
 * back to Urban Loft's own logo/photo asset, which leaked onto every other
 * tenant's storefront whenever an item/outlet had no image).
 */
export function getMediaUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;

  // If it's already a full URL, return as is
  if (url.startsWith("http")) return url;

  // If it's a relative path from the app's public folder
  if (url.startsWith("/")) {
    if (url.startsWith("/media")) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1/";
      try {
        const urlObj = new URL(baseUrl);
        return `${urlObj.origin}${url}`;
      } catch (e) {
        return url;
      }
    }
    return url;
  }

  // Otherwise, assume it's a relative media path and prepend /media if needed
  // This handles cases where backend might return just the filename
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1/";
  try {
    const urlObj = new URL(baseUrl);
    const path = url.startsWith("media/") ? `/${url}` : `/media/${url}`;
    return `${urlObj.origin}${path}`;
  } catch (e) {
    return url;
  }
}
