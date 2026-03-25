"use client";

import { MapProvider } from "@bengo-hub/maps";
import type { ReactNode } from "react";

import { useAuthStore } from "@/store/auth";

const TILE_SERVER_URL =
  process.env.NEXT_PUBLIC_TILE_SERVER_URL || "https://tiles.codevertexitsolutions.com";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://orderingapi.codevertexitsolutions.com/api/v1/";

/**
 * Client-side wrapper around @bengo-hub/maps MapProvider.
 * Reads auth token from the auth store and provides tile/routing URLs.
 * All routing requests go through logistics-api for rate limiting per tenant plan.
 */
export function MapProviderWrapper({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.session?.accessToken);

  return (
    <MapProvider
      tileServerUrl={TILE_SERVER_URL}
      apiBaseUrl={API_BASE_URL.replace(/\/$/, "")}
      authToken={token ?? ""}
    >
      {children}
    </MapProvider>
  );
}
