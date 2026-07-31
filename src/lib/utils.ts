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

const IMAGE_PATH_PATTERN = /^https?:\/\//i;
const IMAGE_EXTENSION_PATTERN = /\.(png|jpe?g|gif|svg|webp|avif)$/i;

/**
 * Splits a category's raw `icon` field from a real image URL. inventory-api's
 * ItemCategory.icon is documented as "Emoji or icon class name for display" (see
 * internal/ent/schema/itemcategory.go) — i.e. usually a glyph like "🍕", NOT an image path.
 * Piping it straight through getMediaUrl() (as every category mapper used to) turns an emoji
 * into a nonsense "/media/🍕"-style path that always 404s, so categories fell back to the
 * generic default icon even when `icon` WAS set. A dedicated `imageUrl`/`image_url` always wins
 * when present; `icon` is only treated as an image path if it actually looks like one.
 */
export function resolveCategoryIcon(
  icon: string | undefined | null,
  imageUrl: string | undefined | null,
): { emoji?: string; image?: string } {
  if (imageUrl) {
    const resolved = getMediaUrl(imageUrl);
    if (resolved) return { image: resolved };
  }
  const trimmed = icon?.trim();
  if (!trimmed) return {};
  const looksLikeImagePath =
    IMAGE_PATH_PATTERN.test(trimmed) || trimmed.startsWith("/") || IMAGE_EXTENSION_PATTERN.test(trimmed);
  if (looksLikeImagePath) {
    const resolved = getMediaUrl(trimmed);
    return resolved ? { image: resolved } : {};
  }
  return { emoji: trimmed };
}
