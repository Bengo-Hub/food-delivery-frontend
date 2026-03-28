"use client";

import type { LatLngTuple } from "leaflet";
import { useEffect, useMemo, useState } from "react";

import { LocationMap } from "@/components/location/location-map";
import { LocationSearchInput } from "@/components/location/location-search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useUserLocation } from "@/hooks/use-user-location";
import { BUSIA_BOUNDS, isWithinBusia } from "@/lib/geofence";
import { getActiveLocation, useCustomerLocationStore } from "@/store/location";

const FALLBACK: LatLngTuple = [-0.0607, 34.2855];

export function CustomerLocationPicker() {
  const defaultLocation = useCustomerLocationStore((state) => state.defaultLocation);
  const defaultLabel = useCustomerLocationStore((state) => state.defaultLabel);
  const customLocation = useCustomerLocationStore((state) => state.customLocation);
  const customLabel = useCustomerLocationStore((state) => state.customLabel);
  const setDefaultLocation = useCustomerLocationStore((state) => state.setDefaultLocation);
  const setCustomLocation = useCustomerLocationStore((state) => state.setCustomLocation);
  const clearCustomLocation = useCustomerLocationStore((state) => state.clearCustomLocation);

  const { coords, status, error, requestLocation } = useUserLocation({
    fallback: defaultLocation ?? FALLBACK,
  });
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (status === "idle") {
      requestLocation();
    }
  }, [requestLocation, status]);

  useEffect(() => {
    if (status === "resolved") {
      setDefaultLocation(coords, "My current location");
      if (!customLocation) {
        setCustomLocation(coords, "My current location");
      }
    }
  }, [coords, customLocation, setCustomLocation, setDefaultLocation, status]);

  const activeLocation = useCustomerLocationStore(getActiveLocation);

  const pinLabel = useMemo(() => formatCoord(activeLocation), [activeLocation]);

  const handleSelect = (coords: LatLngTuple, label: string) => {
    if (!isWithinBusia(coords)) {
      setFeedback("Please pick a spot within Busia County.");
      return;
    }
    setFeedback(null);
    setCustomLocation(coords, label);
  };

  const handleMapChange = (coords: LatLngTuple) => {
    if (!isWithinBusia(coords)) {
      setFeedback("That pin is outside our current delivery radius.");
      return;
    }
    setFeedback(null);
    setCustomLocation(coords, formatCoord(coords));
  };

  return (
    <Card className="h-full">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">
            Delivery location
          </p>
          <h2 className="text-2xl font-semibold text-foreground">Choose where we deliver</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          We save a default pin from your current location. Drag the marker or search for a Busia
          landmark to refine your preferred drop-off point.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <LocationSearchInput
          value={customLabel ?? defaultLabel}
          status={status}
          error={error}
          helper={feedback}
          onSelect={handleSelect}
          onUseCurrent={requestLocation}
          onClear={() => {
            clearCustomLocation();
            setFeedback(null);
          }}
          canClear={!!customLocation}
          searchBounds={BUSIA_BOUNDS}
          countryCodes="ke"
          placeholder="Search Busia streets, estates, or landmarks"
        />
        <LocationMap
          value={activeLocation}
          defaultCenter={defaultLocation ?? FALLBACK}
          onChange={handleMapChange}
          height={260}
        />
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span>Current pin: {pinLabel}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              clearCustomLocation();
              setFeedback(null);
            }}
          >
            Use saved default
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function formatCoord([lat, lng]: LatLngTuple) {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}
