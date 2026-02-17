"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import type { LatLngTuple } from "leaflet";
import { CheckCircle2Icon, ShieldCheckIcon } from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";
import { LocationMap } from "@/components/location/location-map";
import { LocationSearchInput } from "@/components/location/location-search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { brand } from "@/config/brand";
import { useUserLocation } from "@/hooks/use-user-location";
import { isWithinBusia } from "@/lib/geofence";
import { orgRoute } from "@/lib/routes";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { getActiveLabel, getActiveLocation, useCustomerLocationStore } from "@/store/location";

const FALLBACK: LatLngTuple = [-0.0607, 34.2855];

export default function CustomerSignupPage() {
  const orgSlug = useOrgSlug();
  const [submitted, setSubmitted] = useState(false);
  const [locationFeedback, setLocationFeedback] = useState<string | null>(null);

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

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <SiteShell>
      <section className="border-b border-border bg-brand-surface/60 py-12">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 text-center">
          <h1 className="text-4xl font-semibold text-foreground md:text-5xl">
            Create your {brand.shortName} account
          </h1>
          <p className="text-base text-muted-foreground">
            Save favourites, track deliveries, and unlock rewards every time you order from Urban
            Café.
          </p>
        </div>
      </section>

      <section className="bg-background py-12">
        <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-semibold text-foreground">Tell us about you</h2>
              <p className="text-sm text-muted-foreground">
                We&apos;ll use these details to personalise recommendations and make checkout
                faster.
              </p>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="mb-1 block text-xs font-semibold uppercase text-muted-foreground"
                    >
                      First name
                    </label>
                    <Input id="firstName" name="firstName" placeholder="Mary" required />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="mb-1 block text-xs font-semibold uppercase text-muted-foreground"
                    >
                      Last name
                    </label>
                    <Input id="lastName" name="lastName" placeholder="Atieno" required />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1 block text-xs font-semibold uppercase text-muted-foreground"
                    >
                      Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-1 block text-xs font-semibold uppercase text-muted-foreground"
                    >
                      Phone number
                    </label>
                    <Input id="phone" name="phone" type="tel" placeholder="07xx xxx xxx" required />
                  </div>
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
                  <input type="hidden" name="deliveryLatitude" value={activeLocation[0]} />
                  <input type="hidden" name="deliveryLongitude" value={activeLocation[1]} />
                  <input type="hidden" name="deliveryLabel" value={activeLabel ?? ""} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-1 block text-xs font-semibold uppercase text-muted-foreground"
                    >
                      Password
                    </label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Create a strong password"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-1 block text-xs font-semibold uppercase text-muted-foreground"
                    >
                      Confirm password
                    </label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Repeat password"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Button type="submit" className="w-full" disabled={submitted}>
                    {submitted ? "Request submitted" : "Create account"}
                  </Button>
                  <Button variant="outline" className="w-full justify-center" asChild>
                    <Link href={orgRoute(orgSlug, "/auth")}>Sign in instead</Link>
                  </Button>
                </div>
                {submitted ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm text-muted-foreground">
                    <CheckCircle2Icon className="mt-1 size-4 text-primary" aria-hidden />
                    <p>
                      We&apos;ve captured your details for the demo experience. In production, this
                      will create your customer profile and send a verification email.
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
                  Already registered? Head to the{" "}
                  <Link href={orgRoute(orgSlug, "/auth")} className="font-semibold text-primary">
                    sign-in page
                  </Link>{" "}
                  or contact our support team for assistance.
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
