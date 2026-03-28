"use client";

import { MapProvider } from "@bengo-hub/maps";
import type { ReactNode } from "react";

import { useAuthStore } from "@/store/auth";

const TILE_SERVER_URL =
  process.env.NEXT_PUBLIC_TILE_SERVER_URL || "https://tiles.codevertexitsolutions.com";
const MAPTILER_KEY =
  process.env.NEXT_PUBLIC_MAPTILER_API_KEY || "";
const MAPTILER_STYLE_URL = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`
  : undefined;
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://orderingapi.codevertexitsolutions.com/api/v1/";
const LOGISTICS_API_URL =
  process.env.NEXT_PUBLIC_LOGISTICS_API_URL || "https://logisticsapi.codevertexitsolutions.com/api/v1";

/**
 * Client-side wrapper around @bengo-hub/maps MapProvider.
 * Reads auth token from the auth store and provides tile/routing URLs.
 * Routing requests are directed to logistics-api (via routingApiUrl) for
 * tenant-based rate limiting, while other API calls go through ordering-api.
 */
export function MapProviderWrapper({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.session?.accessToken);

  return (
    <MapProvider
      tileServerUrl={TILE_SERVER_URL}
      {...(MAPTILER_STYLE_URL ? { styleUrl: MAPTILER_STYLE_URL } : {})}
      apiBaseUrl={API_BASE_URL.replace(/\/$/, "")}
      routingApiUrl={LOGISTICS_API_URL.replace(/\/$/, "")}
      authToken={token ?? ""}
    >
      {children}
    </MapProvider>
  );
}
