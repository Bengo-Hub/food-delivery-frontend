"use client";

import { CheckCircle2, Circle } from "lucide-react";

import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────

interface StatusEvent {
  status: string;
  timestamp: string;
}

interface StatusTimelineProps {
  currentStatus: string;
  events?: StatusEvent[];
}

// ─── Status Steps ────────────────────────────────────────────────────

const STEPS = [
  { key: "confirmed", label: "Confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "picked_up", label: "Picked Up" },
  { key: "enroute", label: "En Route" },
  { key: "delivered", label: "Delivered" },
] as const;

function stepIndex(status: string): number {
  // Map alternative status names to canonical step keys
  const normalised = status === "out_for_delivery" ? "enroute" : status === "completed" ? "delivered" : status;
  return STEPS.findIndex((s) => s.key === normalised);
}

// ─── Component ───────────────────────────────────────────────────────

export function StatusTimeline({ currentStatus, events }: StatusTimelineProps) {
  const activeIdx = stepIndex(currentStatus);
  const isCancelled = ["cancelled", "failed"].includes(currentStatus);

  // Build a map from step key → timestamp for display
  const eventTimestamps = new Map<string, string>();
  if (events) {
    for (const ev of events) {
      eventTimestamps.set(ev.status, ev.timestamp);
    }
  }

  return (
    <div className="flex flex-col gap-0">
      {STEPS.map((step, idx) => {
        const isCompleted = !isCancelled && activeIdx >= 0 && idx < activeIdx;
        const isActive = !isCancelled && idx === activeIdx;
        const timestamp = eventTimestamps.get(step.key);

        return (
          <div key={step.key} className="flex items-start gap-3">
            {/* Vertical line + icon */}
            <div className="flex flex-col items-center">
              {isCompleted ? (
                <CheckCircle2 className="size-5 shrink-0 text-green-600 dark:text-green-400" />
              ) : isActive ? (
                <Circle className="size-5 shrink-0 animate-pulse fill-brand-emphasis text-brand-emphasis" />
              ) : (
                <Circle className="size-5 shrink-0 text-muted-foreground/40" />
              )}
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "my-1 h-6 w-0.5 rounded-full",
                    isCompleted
                      ? "bg-green-600 dark:bg-green-400"
                      : "bg-muted-foreground/20",
                  )}
                />
              )}
            </div>

            {/* Label + optional timestamp */}
            <div className="pb-4">
              <p
                className={cn(
                  "text-sm font-medium leading-5",
                  isCompleted
                    ? "text-green-700 dark:text-green-400"
                    : isActive
                      ? "text-brand-emphasis"
                      : "text-muted-foreground",
                )}
              >
                {step.label}
              </p>
              {timestamp && (
                <p className="text-xs text-muted-foreground">
                  {new Date(timestamp).toLocaleTimeString("en-KE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {isCancelled && (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          Order {currentStatus}
        </div>
      )}
    </div>
  );
}
