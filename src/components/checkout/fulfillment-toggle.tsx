"use client";

import { AlertTriangle, Calendar, Package, Truck } from "lucide-react";

import { useOrderingConfig } from "@/hooks/use-ordering-config";
import { cn } from "@/lib/utils";

type FulfillmentMode = "delivery" | "pickup" | "schedule";

interface FulfillmentToggleProps {
  mode: string;
  onModeChange: (mode: FulfillmentMode) => void;
  deliveryTotal: number;
  pickupTotal: number;
  estimatedTime: string;
  /** When false, the Schedule (timed delivery) option is hidden (plan-gated). Defaults to true. */
  allowSchedule?: boolean;
}

interface OptionProps {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  priceLabel?: string;
  originalPrice?: string;
  selected: boolean;
  onClick: () => void;
}

function FulfillmentOption({
  icon,
  label,
  subtitle,
  priceLabel,
  originalPrice,
  selected,
  onClick,
}: OptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col items-center gap-1 rounded-xl border p-3 text-center transition-colors active:scale-[0.98]",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border hover:bg-muted/50",
      )}
    >
      <div className={cn("mb-0.5", selected ? "text-primary" : "text-muted-foreground")}>
        {icon}
      </div>
      <span className="text-xs font-medium">{label}</span>
      <span className="text-[11px] text-muted-foreground">{subtitle}</span>
      {priceLabel !== undefined && (
        <span className="text-xs font-semibold">
          {originalPrice && (
            <span className="mr-1 text-muted-foreground/60 line-through">{originalPrice}</span>
          )}
          {priceLabel}
        </span>
      )}
    </button>
  );
}

export function FulfillmentToggle({
  mode,
  onModeChange,
  deliveryTotal,
  pickupTotal,
  estimatedTime,
  allowSchedule = true,
}: FulfillmentToggleProps) {
  const { copy } = useOrderingConfig();

  return (
    <section className="space-y-3">
      <div className="flex gap-2">
        <FulfillmentOption
          icon={<Truck className="size-5" />}
          label="Delivery"
          subtitle={estimatedTime || "35-50 min"}
          priceLabel={`KES ${deliveryTotal.toLocaleString()}`}
          selected={mode === "delivery"}
          onClick={() => onModeChange("delivery")}
        />
        <FulfillmentOption
          icon={<Package className="size-5" />}
          label="Pickup"
          subtitle="5-10 min"
          priceLabel="KES 0"
          selected={mode === "pickup"}
          onClick={() => onModeChange("pickup")}
        />
        {allowSchedule && (
          <FulfillmentOption
            icon={<Calendar className="size-5" />}
            label="Schedule"
            subtitle="Select time"
            selected={mode === "schedule"}
            onClick={() => onModeChange("schedule")}
          />
        )}
      </div>

      {mode === "pickup" && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            This is a Pickup (takeaway) order, so you&apos;ll have to {copy.pickupMessage}.
          </span>
        </div>
      )}
    </section>
  );
}
