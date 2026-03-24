"use client";

import { AlertTriangle } from "lucide-react";

interface SmallOrderWarningProps {
  currentSubtotal: number;
  threshold: number;
  fee: number;
}

export function SmallOrderWarning({ currentSubtotal, threshold, fee }: SmallOrderWarningProps) {
  if (currentSubtotal >= threshold) return null;

  const remaining = threshold - currentSubtotal;

  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <span>
        Add <strong>KES {remaining.toLocaleString()}</strong> more to avoid the{" "}
        <strong>KES {fee.toLocaleString()}</strong> small order fee.
      </span>
    </div>
  );
}
