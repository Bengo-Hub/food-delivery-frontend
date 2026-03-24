"use client";

import { BikeIcon, CarIcon, PhoneIcon, UserIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

// ─── Types ───────────────────────────────────────────────────────────

interface Rider {
  name: string;
  phone: string;
  vehicleType?: string;
}

interface RiderCardProps {
  rider: Rider | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function VehicleIcon({ type }: { type?: string }) {
  switch (type?.toLowerCase()) {
    case "car":
      return <CarIcon className="size-5" />;
    case "bike":
    case "motorcycle":
    case "motorbike":
      return <BikeIcon className="size-5" />;
    default:
      return <BikeIcon className="size-5" />;
  }
}

// ─── Component ───────────────────────────────────────────────────────

export function RiderCard({ rider }: RiderCardProps) {
  if (!rider) return null;

  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-4">
        {/* Avatar placeholder */}
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand-emphasis">
          <UserIcon className="size-6" />
        </div>

        {/* Rider info */}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{rider.name}</p>
          <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
            <VehicleIcon {...(rider.vehicleType ? { type: rider.vehicleType } : {})} />
            <span className="capitalize">{rider.vehicleType ?? "Rider"}</span>
          </div>
        </div>

        {/* Call button */}
        <a
          href={`tel:${rider.phone}`}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 transition-colors hover:bg-green-200 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900"
          aria-label={`Call ${rider.name}`}
        >
          <PhoneIcon className="size-5" />
        </a>
      </CardContent>
    </Card>
  );
}
