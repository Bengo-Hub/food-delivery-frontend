"use client";

import { MapContainer } from "@bengo-hub/maps";
import maplibregl from "maplibre-gl";
import { Clock, MapPin, Phone } from "lucide-react";
import { useCallback, useRef } from "react";

import { cn } from "@/lib/utils";
import { useDiningModeStore } from "@/store/dining-mode";
import type { Outlet } from "@/types/catalog";

interface OutletLocationMapCardProps {
  outlet: Outlet;
  className?: string;
}

/** Single-marker outlet location card for the hospitality outlet-detail page — reuses the
 *  same @bengo-hub/maps MapContainer + maplibre-gl marker pattern already proven in
 *  pickup-map-view.tsx, just scoped to one outlet instead of a list. Must be loaded via
 *  next/dynamic({ ssr:false }) by the caller (maplibre-gl needs window). */
export function OutletLocationMapCard({ outlet, className }: OutletLocationMapCardProps) {
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const mode = useDiningModeStore((s) => s.mode);
  const hasCoords = !!outlet.latitude && !!outlet.longitude;
  const center: [number, number] = hasCoords ? [outlet.longitude, outlet.latitude] : [36.8219, -1.2921];

  const handleMapReady = useCallback(
    (map: maplibregl.Map) => {
      mapInstanceRef.current = map;
      if (!hasCoords) return;
      const el = document.createElement("div");
      el.className =
        "flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary bg-white shadow-lg";
      el.innerHTML = '<span class="block h-3 w-3 rounded-full bg-primary"></span>';
      new maplibregl.Marker({ element: el }).setLngLat([outlet.longitude, outlet.latitude]).addTo(map);
    },
    [hasCoords, outlet.latitude, outlet.longitude],
  );

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>
      <div className="h-36 w-full bg-muted sm:h-40">
        <MapContainer center={center} zoom={14} className="h-full w-full" onMapReady={handleMapReady} />
      </div>
      <div className="space-y-2 p-4 text-sm">
        {outlet.address && (
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            <span>{outlet.address}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="size-4 shrink-0" />
          <span>
            {mode === "pickup"
              ? `Ready for pickup in ~${outlet.deliveryTime} min`
              : `${outlet.deliveryTime} min delivery · ${outlet.deliveryFee}`}
          </span>
        </div>
        {outlet.phone && (
          <a href={`tel:${outlet.phone}`} className="flex items-center gap-2 text-primary hover:underline">
            <Phone className="size-4 shrink-0" />
            <span>{outlet.phone}</span>
          </a>
        )}
      </div>
    </div>
  );
}
