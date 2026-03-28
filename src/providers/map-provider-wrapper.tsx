"use client";

import { MapProvider } from "@bengo-hub/maps";
import type { ReactNode } from "react";

import { useAuthStore } from "@/store/auth";

const TILE_SERVER_URL =
  process.env.NEXT_PUBLIC_TILE_SERVER_URL || "https://tiles.codevertexitsolutions.com";
const TILE_STYLE_URL = `${TILE_SERVER_URL}/styles/basic-preview/style.json`;
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://orderingapi.codevertexitsolutions.com/api/v1/";
const LOGISTICS_API_URL =
  process.env.NEXT_PUBLIC_LOGISTICS_API_URL || "https://logisticsapi.codevertexitsolutions.com/api/v1";

/**
 * Client-side wrapper around @bengo-hub/maps MapProvider.
 * Tiles are self-hosted via Planetiler + TileServer-GL at tiles.codevertexitsolutions.com.
 * Routing requests go through logistics-api for tenant-based rate limiting.
 */
export function MapProviderWrapper({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.session?.accessToken);

  return (
    <MapProvider
      tileServerUrl={TILE_SERVER_URL}
      styleUrl={TILE_STYLE_URL}
      apiBaseUrl={API_BASE_URL.replace(/\/$/, "")}
      routingApiUrl={LOGISTICS_API_URL.replace(/\/$/, "")}
      authToken={token ?? ""}
    >
      {children}
    </MapProvider>
  );
}
