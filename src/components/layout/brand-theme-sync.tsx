"use client";

import { useEffect } from "react";
import { useBrandConfig } from "@/hooks/use-brand";

/** Converts hex (#rrggbb or rrggbb) to space-separated "r g b" for CSS variables. */
function hexToRgbTriplet(hex: string): string {
  const trimmed = hex.replace(/^#/, "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(trimmed)) return "107 42 27"; // fallback
  const r = parseInt(trimmed.slice(0, 2), 16);
  const g = parseInt(trimmed.slice(2, 4), 16);
  const b = parseInt(trimmed.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/**
 * Applies tenant brand colors from GET /api/v1/{tenant}/config to CSS variables
 * when available. Runs client-side only; static brand from layout remains until
 * config loads.
 */
export function BrandThemeSync() {
  const { data } = useBrandConfig();

  useEffect(() => {
    if (!data?.primaryColor) return;
    const root = document.documentElement;
    root.style.setProperty("--brand-primary", hexToRgbTriplet(data.primaryColor));
    if (data.secondaryColor) {
      root.style.setProperty("--brand-emphasis", hexToRgbTriplet(data.secondaryColor));
    }
    return () => {
      root.style.removeProperty("--brand-primary");
      root.style.removeProperty("--brand-emphasis");
    };
  }, [data?.primaryColor, data?.secondaryColor]);

  return null;
}
