"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import type { LatLngTuple } from "leaflet";
import { CheckCircle2Icon, ShieldCheckIcon } from "lucide-react";
import { PhoneInputField } from "@bengo-hub/shared-ui-lib/contact";

import { RequireAuth } from "@/components/auth/require-auth";
import { SiteShell } from "@/components/layout/site-shell";
import { LocationMap } from "@/components/location/location-map";
import { LocationSearchInput } from "@/components/location/location-search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { brand } from "@/config/brand";
import { useCreateAddress } from "@/hooks/use-addresses";
import { useUserLocation } from "@/hooks/use-user-location";
import { isWithinBusia } from "@/lib/geofence";
import { orgRoute } from "@/lib/routes";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useAuthStore } from "@/store/auth";
import { getActiveLabel, getActiveLocation, useCustomerLocationStore } from "@/store/location";

const FALLBACK: LatLngTuple = [-0.0607, 34.2855];

export default function CustomerSignupPage() {
  return (
    <RequireAuth>
      <SaveDeliveryAddressPage />
    </RequireAuth>
  );
}

function SaveDeliveryAddressPage() {
  const orgSlug = useOrgSlug();
  const user = useAuthStore((state) => state.user);
  const createAddress = useCreateAddress();

  const [label, setLabel] = useState("Home");
  const [contactName, setContactName] = useState(user?.fullName ?? "");
  const [contactPhone, setContactPhone] = useState(user?.phone ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [locationFeedback, setLocationFeedback] = useState<string | null>(null);

  useEffect(() => {
    setContactName(user?.fullName ?? "");
    setContactPhone(user?.phone ?? "");
  }, [user?.fullName, user?.phone]);

  const defaultLocation = useCustomerLocationStore((state) => state.defaultLocation);
  const customLocation = useCustomerLocationStore((state) => state.customLocation);
  const setDefaultLocation = useCustomerLocationStore((state) => state.setDefaultLocation);
  const setCustomLocation = useCustomerLocationStore((state) => state.setCustomLocation);
  const clearCustomLocation = useCustomerLocationStore((state) => state.clearCustomLocation);

  const activeLocation = useCustomerLocationStore(getActiveLocation);
  const activeLabel = useCustomerLocationStore(getActiveLabel);

  const { coords, status, error, requestLocation } = useUserLocation({
    fallback: defaultLocation ?? FALLBACK,
  });

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

  const pinLabel = useMemo(() => formatCoord(activeLocation), [activeLocation]);

  const handleSelect = (coords: LatLngTuple, label: string) => {
    if (!isWithinBusia(coords)) {
      setLocationFeedback("Please choose a delivery point within Busia County.");
      return;
    }
    setLocationFeedback(null);
    setCustomLocation(coords, label);
  };

  const handleMapChange = (coords: LatLngTuple) => {
    if (!isWithinBusia(coords)) {
      setLocationFeedback("That pin is outside our delivery radius.");
      return;
    }
    setLocationFeedback(null);
    setCustomLocation(coords, formatCoord(coords));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!customLocation) {
      setLocationFeedback("Please pick a delivery point on the map or search for your address.");
      return;
    }
    setLocationFeedback(null);
    try {
      await createAddress.mutateAsync({
        label: label.trim() || "Home",
        addressLine1: activeLabel ?? formatCoord(activeLocation),
        city: "Busia",
        country: "KE",
        latitude: activeLocation[0],
        longitude: activeLocation[1],
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        isDefault: true,
      });
      setSubmitted(true);
    } catch {
      // useCreateAddress surfaces its own error via isError below
    }
  };

  return (
    <SiteShell>
      <section className="border-b border-border bg-brand-surface/60 py-12">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 text-center">
          <h1 className="text-4xl font-semibold text-foreground md:text-5xl">
            Save your delivery address
          </h1>
          <p className="text-base text-muted-foreground">
            Add a delivery point within Busia so checkout is one tap next time you order from{" "}
            {brand.shortName}.
          </p>
        </div>
      </section>

      <section className="bg-background py-12">
        <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-semibold text-foreground">Delivery details</h2>
              <p className="text-sm text-muted-foreground">
                We&apos;ll use these to reach you and find your door faster.
              </p>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contactName"
                      className="mb-1 block text-xs font-semibold uppercase text-muted-foreground"
                    >
                      Contact name
                    </label>
                    <Input
                      id="contactName"
                      value={contactName}
                      onChange={(event) => setContactName(event.target.value)}
                      placeholder="Mary Atieno"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="addressLabel"
                      className="mb-1 block text-xs font-semibold uppercase text-muted-foreground"
                    >
                      Label
                    </label>
                    <Input
                      id="addressLabel"
                      value={label}
                      onChange={(event) => setLabel(event.target.value)}
                      placeholder="Home"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="contactPhone"
                    className="mb-1 block text-xs font-semibold uppercase text-muted-foreground"
                  >
                    Phone number
                  </label>
                  <PhoneInputField
                    value={contactPhone}
                    onChange={setContactPhone}
                    placeholder="07xx xxx xxx"
                  />
                </div>
                <div className="space-y-3">
                  <LocationSearchInput
                    value={activeLabel}
                    status={status}
                    error={error}
                    helper={locationFeedback}
                    onSelect={handleSelect}
                    onUseCurrent={requestLocation}
                    onClear={() => {
                      clearCustomLocation();
                      setLocationFeedback(null);
                    }}
                    canClear={!!customLocation}
                    placeholder="Search within Busia (estate, street, landmark)"
                  />
                  <LocationMap
                    value={activeLocation}
                    defaultCenter={defaultLocation ?? FALLBACK}
                    onChange={handleMapChange}
                    height={240}
                  />
                  <div className="text-xs text-muted-foreground">Pin coordinates: {pinLabel}</div>
                </div>
                {createAddress.isError ? (
                  <p className="text-sm text-destructive">
                    We couldn&apos;t save that address. Please try again.
                  </p>
                ) : null}
                <div className="space-y-3">
                  <Button type="submit" className="w-full" disabled={createAddress.isPending || submitted}>
                    {submitted
                      ? "Address saved"
                      : createAddress.isPending
                        ? "Saving…"
                        : "Save delivery address"}
                  </Button>
                  <Button variant="outline" className="w-full justify-center" asChild>
                    <Link href={orgRoute(orgSlug, "/profile")}>Skip for now</Link>
                  </Button>
                </div>
                {submitted ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm text-muted-foreground">
                    <CheckCircle2Icon className="mt-1 size-4 text-primary" aria-hidden />
                    <p>
                      Saved as your default delivery address.{" "}
                      <Link href={orgRoute(orgSlug, "/profile")} className="font-semibold text-primary">
                        Go to your profile
                      </Link>{" "}
                      or{" "}
                      <Link href={orgRoute(orgSlug, "/")} className="font-semibold text-primary">
                        start ordering
                      </Link>
                      .
                    </p>
                  </div>
                ) : null}
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="bg-brand-muted/40">
              <CardHeader className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground">What you&apos;ll enjoy</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Save multiple delivery addresses for quick checkout</li>
                  <li>• Earn rewards and personalised offers every time you order</li>
                  <li>• Get instant push and email updates as your rider makes progress</li>
                </ul>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground">Need help?</h3>
                <p className="text-sm text-muted-foreground">
                  Contact our support team for assistance, or manage your account from your{" "}
                  <Link href={orgRoute(orgSlug, "/profile")} className="font-semibold text-primary">
                    profile
                  </Link>
                  .
                </p>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="space-y-2">
                <ShieldCheckIcon className="size-6 text-primary" aria-hidden />
                <h3 className="text-xl font-semibold text-foreground">Your data stays protected</h3>
                <p className="text-sm text-muted-foreground">
                  {brand.shortName} uses secure authentication, encryption at rest, and
                  privacy-first defaults. Only you and authorised staff can access your profile.
                </p>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function formatCoord([lat, lng]: LatLngTuple) {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}
