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
 * Keyword → emoji fallback for categories the backend didn't tag with an icon/image at all
 * (e.g. a tenant that never set `ItemCategory.icon`). Matched by substring against the
 * lowercased category name, most-specific keywords first within each vertical so e.g. "wine
 * glass" resolves distinctly from plain "wine". Covers hospitality/food, retail, pharmacy, and
 * services categories seen across tenants — extend this table, don't build a second one, when a
 * new unmatched category name turns up.
 */
const CATEGORY_NAME_ICON_KEYWORDS: [pattern: RegExp, emoji: string][] = [
  // Hospitality / food — most-specific first
  [/wine\s*glass/, "🍷"],
  [/\bwine\b/, "🍾"],
  [/\bbeer/, "🍺"],
  [/\bspirit|whisk(e)?y|vodka|gin\b|cognac|brandy/, "🥃"],
  [/cocktail/, "🍸"],
  [/\balcohol/, "🍹"],
  [/\bbakery|bread|pastr(y|ies)/, "🥖"],
  [/\bcake|dessert|sweet/, "🍰"],
  [/\bpizza/, "🍕"],
  [/\bburger/, "🍔"],
  [/\bchicken/, "🍗"],
  [/\bsushi/, "🍣"],
  [/\bchinese/, "🥡"],
  [/\bindian/, "🍛"],
  [/\bbreakfast/, "🥞"],
  [/\bcoffee/, "☕"],
  [/\btea\b/, "🍵"],
  [/\bjuice|smoothie/, "🥤"],
  [/\bsoft\s*drink|soda|beverage/, "🥤"],
  [/\bsalad|healthy/, "🥗"],
  [/\bsoup/, "🍲"],
  [/\bside|add[\s-]?on|extra/, "➕"],
  [/\btot\b|fries|chips/, "🍟"],
  [/\bmain\s*dish|entr(e|é)e/, "🍽️"],
  [/\bgrill|bbq|barbecue/, "🍖"],
  [/\bseafood|fish/, "🐟"],
  [/\bvegan|vegetarian/, "🥦"],
  [/\bkids?\b/, "🧒"],
  [/\bfast\s*food/, "🍟"],
  // Retail / general merchandise
  [/electronic|phone|gadget/, "📱"],
  [/fashion|cloth(e|ing)|apparel/, "👕"],
  [/grocery|supermarket/, "🛒"],
  [/hardware|tool/, "🔧"],
  [/flower/, "💐"],
  [/gift/, "🎁"],
  // Pharmacy / health
  [/pharmac|medicine|drug/, "💊"],
  [/health|clinic|wellness/, "🏥"],
  [/cosmetic|beauty|skincare/, "💄"],
  // Services
  [/salon|hair/, "💇"],
  [/spa|massage/, "💆"],
  [/appointment|booking/, "🗓️"],
];

/** Best-effort emoji for a category name the backend gave no icon/image for. Returns
 *  undefined (never a hardcoded generic glyph) when nothing matches, so callers fall through
 *  to their own use-case-aware placeholder. */
export function guessCategoryEmoji(name: string | undefined | null): string | undefined {
  const n = name?.toLowerCase().trim();
  if (!n) return undefined;
  for (const [pattern, emoji] of CATEGORY_NAME_ICON_KEYWORDS) {
    if (pattern.test(n)) return emoji;
  }
  return undefined;
}

/**
 * Splits a category's raw `icon` field from a real image URL. inventory-api's
 * ItemCategory.icon is documented as "Emoji or icon class name for display" (see
 * internal/ent/schema/itemcategory.go) — i.e. usually a glyph like "🍕", NOT an image path.
 * Piping it straight through getMediaUrl() (as every category mapper used to) turns an emoji
 * into a nonsense "/media/🍕"-style path that always 404s, so categories fell back to the
 * generic default icon even when `icon` WAS set. A dedicated `imageUrl`/`image_url` always wins
 * when present; `icon` is only treated as an image path if it actually looks like one. When
 * neither is set, `categoryName` is matched against a keyword table (guessCategoryEmoji) so
 * distinct categories ("Wine", "BAKERY", "Tots") get distinct icons instead of all collapsing
 * onto the same generic use-case placeholder.
 */
export function resolveCategoryIcon(
  icon: string | undefined | null,
  imageUrl: string | undefined | null,
  categoryName?: string | undefined | null,
): { emoji?: string; image?: string } {
  if (imageUrl) {
    const resolved = getMediaUrl(imageUrl);
    if (resolved) return { image: resolved };
  }
  const trimmed = icon?.trim();
  if (trimmed) {
    const looksLikeImagePath =
      IMAGE_PATH_PATTERN.test(trimmed) || trimmed.startsWith("/") || IMAGE_EXTENSION_PATTERN.test(trimmed);
    if (looksLikeImagePath) {
      const resolved = getMediaUrl(trimmed);
      if (resolved) return { image: resolved };
    } else {
      return { emoji: trimmed };
    }
  }
  const guessed = guessCategoryEmoji(categoryName);
  return guessed ? { emoji: guessed } : {};
}
