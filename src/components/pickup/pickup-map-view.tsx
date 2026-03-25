"use client";

import { MapContainer } from "@bengo-hub/maps";
import maplibregl from "maplibre-gl";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Outlet } from "@/types/catalog";

interface PickupMapViewProps {
  outlets: Outlet[];
  userLocation?: { lat: number; lng: number };
  selectedOutletId?: string | null;
  onOutletSelect?: (outletId: string) => void;
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  className?: string;
}

export function PickupMapView({
  outlets,
  userLocation,
  selectedOutletId,
  onOutletSelect,
  onBoundsChange,
  className,
}: PickupMapViewProps) {
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [showSearchHere, setShowSearchHere] = useState(false);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  const center: [number, number] = userLocation
    ? [userLocation.lng, userLocation.lat]
    : [36.8219, -1.2921]; // Nairobi default

  const handleMapReady = useCallback(
    (map: maplibregl.Map) => {
      mapInstanceRef.current = map;

      // Show "Search here" after user pans
      map.on("moveend", () => {
        setShowSearchHere(true);
      });

      // Add user location marker
      if (userLocation) {
        const el = document.createElement("div");
        el.className = "w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg";
        new maplibregl.Marker({ element: el })
          .setLngLat([userLocation.lng, userLocation.lat])
          .addTo(map);
      }
    },
    [userLocation],
  );

  // Add/update outlet markers whenever outlets change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    outlets.forEach((outlet) => {
      if (!outlet.latitude || !outlet.longitude) return;

      const isSelected = outlet.id === selectedOutletId;

      // Create marker element
      const el = document.createElement("div");
      el.className = cn(
        "flex items-center justify-center rounded-full shadow-lg cursor-pointer transition-transform",
        isSelected ? "w-10 h-10 bg-primary scale-110" : "w-8 h-8 bg-white border-2 border-primary",
      );

      // Rating badge
      if (outlet.rating) {
        el.innerHTML = `<span class="text-xs font-bold ${isSelected ? "text-white" : "text-primary"}">${outlet.rating.toFixed(1)}</span>`;
      }

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([outlet.longitude, outlet.latitude])
        .addTo(map);

      // Popup on hover
      const popup = new maplibregl.Popup({ offset: 25, closeButton: false }).setHTML(
        `<div class="p-2 text-sm"><strong>${outlet.name}</strong><br/>${outlet.deliveryTime || ""}</div>`,
      );
      marker.setPopup(popup);

      el.addEventListener("click", () => {
        onOutletSelect?.(outlet.id);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all outlets
    if (outlets.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      outlets.forEach((o) => {
        if (o.latitude && o.longitude) bounds.extend([o.longitude, o.latitude]);
      });
      if (userLocation) bounds.extend([userLocation.lng, userLocation.lat]);
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
      }
    }
  }, [outlets, selectedOutletId, onOutletSelect, userLocation]);

  const handleSearchHere = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    setShowSearchHere(false);

    const bounds = map.getBounds();
    onBoundsChange?.({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    });
  };

  return (
    <div className={cn("relative", className)}>
      <MapContainer
        center={center}
        zoom={13}
        className="h-full w-full"
        showControls
        onMapReady={handleMapReady}
      />

      {/* Search here button */}
      {showSearchHere && (
        <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full bg-white shadow-lg"
            onClick={handleSearchHere}
          >
            Search here
          </Button>
        </div>
      )}
    </div>
  );
}
