"use client";

import type { LatLngTuple } from "leaflet";
import { ArrowLeft, Clock, Edit2, MapPin, Star } from "lucide-react";
import { useMemo, useState } from "react";

import { LocationSearchInput } from "@/components/location/location-search-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAddresses } from "@/hooks/use-addresses";
import type { Address } from "@/lib/api/addresses";
import { cn } from "@/lib/utils";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useDiningModeStore } from "@/store/dining-mode";

export interface SavedAddress {
  id: string;
  label: string;
  address: string;
  fullAddress: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
  buildingType?: string;
  additionalInfo?: string;
  aptSuiteFloor?: string;
  businessName?: string;
  dropoffOption?: string;
  deliveryInstructions?: string;
}

interface LocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Map API Address to our SavedAddress shape */
function toSavedAddress(addr: Address): SavedAddress {
  return {
    id: addr.id,
    label: addr.label,
    address: addr.address,
    fullAddress: addr.address,
    latitude: addr.lat,
    longitude: addr.lng,
    isDefault: addr.isDefault,
  };
}

type DialogView = "main" | "edit";

export function LocationDialog({ open, onOpenChange }: LocationDialogProps) {
  const orgSlug = useOrgSlug();
  const [view, setView] = useState<DialogView>("main");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);

  // Form state for edit view
  const [buildingType, setBuildingType] = useState("other");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [aptSuiteFloor, setAptSuiteFloor] = useState("");
  const [businessName, setBusinessName] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [dropoffOption, setDropoffOption] = useState("meet_at_door");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [addressLabel, setAddressLabel] = useState("");

  const diningMode = useDiningModeStore((state) => state.mode);
  const deliveryLocation = useDiningModeStore((state) => state.deliveryLocation);
  const setDeliveryLocation = useDiningModeStore((state) => state.setDeliveryLocation);
  const isScheduled = useDiningModeStore((state) => state.isScheduled);
  const setIsScheduled = useDiningModeStore((state) => state.setIsScheduled);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "resolved" | "error">("idle");

  // Load saved addresses from API
  const { data: apiAddresses = [], isLoading: addressesLoading } = useAddresses();
  const savedAddresses = useMemo(() => apiAddresses.map(toSavedAddress), [apiAddresses]);

  // Filter addresses by search query
  const filteredAddresses = useMemo(() => {
    if (!searchQuery.trim()) return savedAddresses;
    const q = searchQuery.toLowerCase();
    return savedAddresses.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.address.toLowerCase().includes(q),
    );
  }, [savedAddresses, searchQuery]);

  const handleSelectAddress = (address: SavedAddress) => {
    setSelectedAddress(address);
    setDeliveryLocation({
      address: address.address,
      latitude: address.latitude || 0,
      longitude: address.longitude || 0,
    });
    onOpenChange(false);
  };

  const handleEditAddress = (address: SavedAddress) => {
    setSelectedAddress(address);
    setBuildingType(address.buildingType || "other");
    setAdditionalInfo(address.additionalInfo || "");
    setAptSuiteFloor(address.aptSuiteFloor || "");
    setBusinessName(address.businessName || "");
    setDropoffOption(address.dropoffOption || "meet_at_door");
    setDeliveryInstructions(address.deliveryInstructions || "");
    setAddressLabel(address.label || "");
    setView("edit");
  };

  const handleSaveAddress = () => {
    if (selectedAddress) {
      setDeliveryLocation({
        address: selectedAddress.address,
        latitude: selectedAddress.latitude || 0,
        longitude: selectedAddress.longitude || 0,
      });
    }
    setView("main");
    onOpenChange(false);
  };

  const handleBack = () => {
    setView("main");
  };

  const handleSchedule = () => {
    setIsScheduled(!isScheduled);
  };

  const handleGeocodedSelect = (coords: LatLngTuple, label: string) => {
    setDeliveryLocation({
      address: label,
      latitude: coords[0],
      longitude: coords[1],
    });
    setLocationStatus("resolved");
    onOpenChange(false);
  };

  const handleUseCurrent = () => {
    if (!navigator.geolocation) return;
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDeliveryLocation({
          address: "Current location",
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLocationStatus("resolved");
        onOpenChange(false);
      },
      () => setLocationStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Reset view when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setView("main");
      setSearchQuery("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        {view === "main" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Addresses</DialogTitle>
            </DialogHeader>

            {/* Search Input — Nominatim geocoding */}
            <div className="mt-2">
              <LocationSearchInput
                value={deliveryLocation?.address ?? null}
                status={locationStatus}
                onSelect={handleGeocodedSelect}
                onUseCurrent={handleUseCurrent}
                placeholder="Search for an address or business"
                label=""
                countryCodes="ke,ug"
                orgSlug={orgSlug || undefined}
                searchBounds={
                  deliveryLocation
                    ? {
                        minLng: deliveryLocation.longitude - 0.5,
                        maxLng: deliveryLocation.longitude + 0.5,
                        minLat: deliveryLocation.latitude - 0.5,
                        maxLat: deliveryLocation.latitude + 0.5,
                      }
                    : null
                }
                autoFocus
              />
            </div>

            {/* Deliver Now / Schedule Toggle */}
            <div className="mt-4 flex gap-2">
              <Button
                variant={!isScheduled ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setIsScheduled(false)}
              >
                {diningMode === "pickup" ? "Pick up now" : "Deliver now"}
              </Button>
              <Button
                variant={isScheduled ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setIsScheduled(true)}
              >
                <Clock className="mr-1.5 size-4" />
                Schedule
              </Button>
            </div>

            {/* Saved Addresses */}
            <div className="mt-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Saved addresses</h3>
              {addressesLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Loading addresses...
                </div>
              ) : savedAddresses.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No saved addresses yet.
                </div>
              ) : (
                <div className="space-y-1">
                  {savedAddresses.map((address) => (
                    <div
                      key={address.id}
                      className={cn(
                        "flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted",
                        deliveryLocation?.address === address.address && "bg-muted",
                      )}
                    >
                      <button
                        onClick={() => handleSelectAddress(address)}
                        className="flex flex-1 items-center gap-3 text-left"
                      >
                        <div className="flex size-10 items-center justify-center rounded-full bg-foreground">
                          <MapPin className="size-5 text-background" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{address.label}</p>
                            {address.isDefault && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                <Star className="size-2.5" />
                                Default
                              </span>
                            )}
                          </div>
                          <p className="truncate text-sm text-muted-foreground">{address.address}</p>
                        </div>
                      </button>
                      <button
                        onClick={() => handleEditAddress(address)}
                        className="p-2 text-muted-foreground hover:text-foreground"
                        aria-label="Edit address"
                      >
                        <Edit2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Time Preference */}
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Time preference</h3>
              <div className="flex items-center justify-between rounded-lg p-3 hover:bg-muted">
                <div className="flex items-center gap-3">
                  <Clock className="size-5 text-muted-foreground" />
                  <span className="font-medium">
                    {isScheduled
                      ? "Scheduled"
                      : diningMode === "pickup"
                        ? "Pick up now"
                        : "Deliver now"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSchedule}
                  className={cn(isScheduled && "bg-foreground text-background")}
                >
                  {isScheduled ? "Deliver now" : "Schedule"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Edit Address View */}
            <DialogHeader className="flex-row items-center gap-2">
              <button
                onClick={handleBack}
                className="rounded-full p-1 hover:bg-muted"
                aria-label="Go back"
              >
                <ArrowLeft className="size-5" />
              </button>
              <DialogTitle className="text-xl font-bold">Address info</DialogTitle>
            </DialogHeader>

            {/* Map Preview */}
            <div className="relative mt-2 h-32 overflow-hidden rounded-lg bg-muted">
              <div className="flex size-full items-center justify-center">
                <div className="text-center">
                  <MapPin className="mx-auto size-6 text-foreground" />
                  <button className="mt-1 text-xs text-muted-foreground hover:underline">
                    Adjust pin
                  </button>
                </div>
              </div>
            </div>

            {/* Address Display */}
            <p className="mt-2 text-sm text-muted-foreground">
              {selectedAddress?.fullAddress || "No address selected"}
            </p>

            {/* Building Type */}
            <div className="mt-4 space-y-2">
              <Label htmlFor="buildingType">Building type</Label>
              <Select value={buildingType} onValueChange={setBuildingType}>
                <SelectTrigger id="buildingType">
                  <SelectValue placeholder="Select building type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Additional Address Info */}
            <div className="mt-4 space-y-2">
              <Label htmlFor="additionalInfo">Additional address information (required)</Label>
              <Input
                id="additionalInfo"
                placeholder="e.g. Street address, building name"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
              />
            </div>

            {/* Apt / Suite / Floor */}
            <div className="mt-4 space-y-2">
              <Label htmlFor="aptSuiteFloor">Apt / Suite / Floor</Label>
              <Input
                id="aptSuiteFloor"
                placeholder="e.g. 1208"
                value={aptSuiteFloor}
                onChange={(e) => setAptSuiteFloor(e.target.value)}
              />
            </div>

            {/* Business / Building Name */}
            <div className="mt-4 space-y-2">
              <Label htmlFor="businessName">Business / Building name</Label>
              <Input
                id="businessName"
                placeholder="e.g. Central Tower"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>

            {/* Dropoff Options */}
            <div className="mt-6">
              <h3 className="mb-3 font-medium">Dropoff options</h3>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {/* door emoji replaced with text for build safety */}
                    <MapPin className="size-6" />
                  </span>
                  <div>
                    <p className="font-medium">Meet at my door</p>
                    <button className="text-sm text-green-600 hover:underline">
                      More options available
                    </button>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
            </div>

            {/* Delivery Instructions */}
            <div className="mt-4 space-y-2">
              <Label htmlFor="instructions">Instructions for delivery person</Label>
              <Textarea
                id="instructions"
                placeholder="Example: Please knock instead of using the doorbell"
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                rows={2}
              />
            </div>

            {/* Address Label */}
            <div className="mt-4 space-y-2">
              <Label htmlFor="addressLabel">Address label</Label>
              <Input
                id="addressLabel"
                placeholder="Add a label (e.g. school)"
                value={addressLabel}
                onChange={(e) => setAddressLabel(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Back
              </Button>
              <Button onClick={handleSaveAddress} className="flex-1">
                Save
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
