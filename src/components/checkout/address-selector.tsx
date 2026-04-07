"use client";

import type { LatLngTuple } from "leaflet";
import { Calendar, Clock, Loader2, MapPin, Navigation, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { LocationSearchInput } from "@/components/location/location-search-input";
import { Button } from "@/components/ui/button";
import type { Address } from "@/lib/api/addresses";
import { cn } from "@/lib/utils";
import { useUserLocation } from "@/hooks/use-user-location";
import { useZoneCheck } from "@/hooks/use-zones";
import { useOrgSlug } from "@/providers/org-slug-provider";

interface AddressSelectorProps {
  addresses: Address[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Called when guest picks a location (no saved address). Returns the address details. */
  onGuestLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  /** The currently selected guest delivery location (displayed when no saved address is selected). */
  guestAddress?: { lat: number; lng: number; address: string } | null;
  /** Called when "Add new" is used by an authenticated user to save an address. */
  onAddNew: () => void;
  isGuest?: boolean;
  /** Schedule controls */
  scheduledTime?: { date: Date; label: string } | null;
  onSchedule?: (date: Date) => void;
}

export function AddressSelector({
  addresses,
  selectedId,
  onSelect,
  onGuestLocationSelect,
  guestAddress,
  onAddNew,
  isGuest = false,
  scheduledTime,
  onSchedule,
}: AddressSelectorProps) {
  const [showModal, setShowModal] = useState(false);

  // Current selected address display — saved address or guest-picked location
  const selectedAddress = addresses.find((a) => a.id === selectedId);
  const hasAddress = !!(selectedAddress || guestAddress);
  const displayLabel = selectedAddress?.label ?? "Delivery Location";
  const displayAddress = selectedAddress?.address ?? guestAddress?.address ?? "";

  return (
    <section className="rounded-xl border border-border p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <MapPin className="size-4 text-primary" />
        <span>Delivery Address</span>
      </div>

      {hasAddress ? (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex w-full items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3.5 text-left transition-colors hover:bg-primary/10"
        >
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="size-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{displayLabel}</p>
            <p className="truncate text-xs text-muted-foreground">{displayAddress}</p>
          </div>
          <span className="text-xs text-primary">Change</span>
        </button>
      ) : (
        <div className="py-3 text-center">
          <p className="mb-3 text-sm text-muted-foreground">No delivery address selected.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowModal(true)}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            Add Delivery Address
          </Button>
        </div>
      )}

      {/* Location selector modal */}
      {showModal && (
        <LocationSelectorModal
          addresses={addresses}
          selectedId={selectedId}
          isGuest={isGuest}
          scheduledTime={scheduledTime}
          onSelectSaved={(id) => {
            onSelect(id);
            setShowModal(false);
          }}
          onSelectLocation={(loc) => {
            onGuestLocationSelect?.(loc);
            setShowModal(false);
          }}
          onAddNew={onAddNew}
          onSchedule={onSchedule}
          onClose={() => setShowModal(false)}
        />
      )}
    </section>
  );
}

// ─── Location Selector Modal ────────────────────────────────────────

interface LocationSelectorModalProps {
  addresses: Address[];
  selectedId: string | null;
  isGuest: boolean;
  scheduledTime?: { date: Date; label: string } | null | undefined;
  onSelectSaved: (id: string) => void;
  onSelectLocation: (location: { lat: number; lng: number; address: string }) => void;
  onAddNew: () => void;
  onSchedule?: ((date: Date) => void) | undefined;
  onClose: () => void;
}

function LocationSelectorModal({
  addresses,
  selectedId,
  isGuest,
  scheduledTime,
  onSelectSaved,
  onSelectLocation,
  onAddNew,
  onSchedule,
  onClose,
}: LocationSelectorModalProps) {
  const orgSlug = useOrgSlug();
  const { coords, status, requestLocation } = useUserLocation();
  const [pickedLocation, setPickedLocation] = useState<{
    coords: LatLngTuple;
    label: string;
  } | null>(null);

  // Zone check for picked location
  const checkLat = pickedLocation?.coords[0] ?? null;
  const checkLng = pickedLocation?.coords[1] ?? null;
  const { data: zoneResult, isLoading: zoneLoading } = useZoneCheck(checkLat, checkLng);

  // Auto-detect current location on mount
  useEffect(() => {
    if (status === "idle") requestLocation();
  }, [status, requestLocation]);

  const handleSearchSelect = useCallback((coords: LatLngTuple, label: string) => {
    setPickedLocation({ coords, label });
  }, []);

  const handleConfirmLocation = () => {
    if (!pickedLocation) return;
    onSelectLocation({
      lat: pickedLocation.coords[0],
      lng: pickedLocation.coords[1],
      address: pickedLocation.label,
    });
  };

  const isInZone = zoneResult && !zoneLoading;
  const isOutOfZone = !zoneLoading && pickedLocation && !zoneResult;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-background shadow-xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-bold">Addresses</h2>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Location search */}
          <LocationSearchInput
            value={pickedLocation?.label ?? ""}
            status={status}
            error={null}
            helper={
              isOutOfZone
                ? "This location is outside our delivery area."
                : isInZone
                  ? `Delivery fee: KES ${zoneResult.delivery_fee} (${zoneResult.estimated_time} min)`
                  : null
            }
            onSelect={handleSearchSelect}
            onUseCurrent={() => {
              requestLocation();
              if (coords) {
                setPickedLocation({
                  coords,
                  label: "My current location",
                });
              }
            }}
            onClear={() => setPickedLocation(null)}
            canClear={!!pickedLocation}
            countryCodes="ke"
            orgSlug={orgSlug}
            userCoords={coords}
            placeholder="Search for address or landmark"
          />

          {/* Confirm picked location */}
          {pickedLocation && (
            <Button
              className="w-full"
              onClick={handleConfirmLocation}
              disabled={!!isOutOfZone || zoneLoading}
            >
              {zoneLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Checking delivery zone...
                </>
              ) : isOutOfZone ? (
                "Outside delivery area"
              ) : (
                <>
                  <Navigation className="mr-2 size-4" />
                  Deliver here
                </>
              )}
            </Button>
          )}

          {/* Deliver now / Schedule toggle */}
          {onSchedule && (
            <div>
              <p className="mb-2 text-sm font-medium">Time preference</p>
              <div className="flex gap-2">
                <Button
                  variant={!scheduledTime ? "default" : "outline"}
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => {/* already deliver now */}}
                >
                  <Clock className="size-4" />
                  Deliver now
                </Button>
                <Button
                  variant={scheduledTime ? "default" : "outline"}
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => onSchedule(new Date())}
                >
                  <Calendar className="size-4" />
                  Schedule
                </Button>
              </div>
            </div>
          )}

          {/* Saved addresses */}
          {addresses.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Saved addresses</p>
              <div className="space-y-2">
                {addresses.map((addr) => {
                  const selected = selectedId === addr.id;
                  return (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => onSelectSaved(addr.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50",
                      )}
                    >
                      <MapPin className={cn("size-4 shrink-0", selected ? "text-primary" : "text-muted-foreground")} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{addr.label}</p>
                        <p className="truncate text-xs text-muted-foreground">{addr.address}</p>
                      </div>
                      {addr.isDefault && (
                        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          Default
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* No saved addresses message for guests */}
          {addresses.length === 0 && !isGuest && (
            <div className="text-center">
              <p className="mb-2 text-sm text-muted-foreground">No saved addresses yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
