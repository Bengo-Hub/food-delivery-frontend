/**
 * Storefront promotions banner API client.
 *
 * Thin read-through: ordering-backend proxies pos-api's Promotion records (the platform's
 * discount source of truth) flagged `show_on_storefront` in their metadata. This module owns no
 * discount data — see GET /{tenant}/promotions/banners on ordering-backend.
 */

import type { PromoBanner } from "@/components/promo/promo-banner-carousel";
import { api } from "./base";

/** Backend banner shape (ordering-backend -> pos-api S2S response, passed through as-is). */
interface BackendPromoBanner {
  promo_id: string;
  name?: string;
  banner_title?: string;
  banner_subtitle?: string;
  banner_image_url?: string;
  cta_label?: string;
  cta_link?: string;
  banner_color?: string;
  text_color?: string;
  outlet_id?: string | null;
  /** True when this promotion is a time-boxed flash sale — drives the countdown + badge. */
  is_flash_sale?: boolean;
  /** ISO timestamp the flash sale ends at (only meaningful when is_flash_sale is true). */
  end_at?: string | null;
}

function backendBannerToPromoBanner(b: BackendPromoBanner, useCase?: string): PromoBanner {
  return {
    id: b.promo_id,
    title: b.banner_title || b.name || "",
    subtitle: b.banner_subtitle ?? "",
    ...(b.banner_image_url ? { imageUrl: b.banner_image_url } : {}),
    ctaText: b.cta_label ?? "",
    ctaLink: b.cta_link || "#",
    ...(b.banner_color ? { backgroundColor: b.banner_color } : {}),
    ...(b.text_color ? { textColor: b.text_color } : {}),
    ...(useCase ? { useCase } : {}),
    ...(b.is_flash_sale ? { isFlashSale: true } : {}),
    ...(b.is_flash_sale && b.end_at ? { endAt: b.end_at } : {}),
  };
}

/** Fetch active storefront promotion banners for a tenant, optionally filtered by use_case. */
export async function fetchPromoBanners(
  tenantSlug: string,
  useCase?: string,
): Promise<PromoBanner[]> {
  const qs = useCase ? `?use_case=${encodeURIComponent(useCase)}` : "";
  try {
    const res = await api.get<BackendPromoBanner[]>(`${tenantSlug}/promotions/banners${qs}`);
    const items = Array.isArray(res.data) ? res.data : [];
    return items
      .filter((b) => !!b.banner_title || !!b.name)
      .map((b) => backendBannerToPromoBanner(b, useCase));
  } catch {
    // A promotions integration hiccup must never break the storefront homepage.
    return [];
  }
}
