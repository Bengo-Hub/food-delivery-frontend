"use client";

import { Lock } from "lucide-react";
import type { ReactNode } from "react";

import { FeatureLock } from "@bengo-hub/shared-ui-lib/subscription";
import { useAuthStore } from "@/store/auth";
import { useSubscription } from "@/hooks/use-subscription";

interface SubscriptionGateProps {
  /** Feature code required (e.g. "loyalty_program", "multi_outlet") */
  feature?: string;
  /** Minimum plan required (e.g. "growth", "professional") */
  plan?: string;
  /**
   * Outlet use-case codes that may access this feature (e.g. ["hospitality", "quick_service"]).
   * When provided, the gate also checks the JWT outlet_use_case claim.
   * An empty or missing outlet_use_case on the user passes through (no restriction).
   * Platform owners and HQ users always bypass this check.
   */
  useCases?: string[];
  /** Content to render when feature is available */
  children: ReactNode;
  /** Custom fallback when gated; kept for signature compatibility — FeatureLock always shows an upgrade CTA */
  fallback?: ReactNode;
}

/**
 * SubscriptionGate — delegates subscription gating to the shared <FeatureLock mode="block">.
 *
 * Show-but-lock: children are ALWAYS in the tree. When the tenant's plan lacks `feature`
 * (and the tenant isn't exempt), FeatureLock renders an upgrade CTA card whose interaction
 * opens the shared UpgradeDialog naming the unlocking tier + deep-linking to pricing —
 * never a dead-end hide. Exempt tenants and loading states pass straight through.
 *
 * The `useCases` outlet-type restriction is NOT subscription gating (there is no tier that
 * unlocks it), so it keeps its original informational block.
 */
export function SubscriptionGate({ feature, useCases, children, fallback }: SubscriptionGateProps) {
  const { isPlatformOwner } = useSubscription();
  const user = useAuthStore((s) => s.user);
  const outletUseCase = (user as Record<string, unknown> | null)?.outlet_use_case as
    | string
    | undefined;

  // Use-case gate: platform owners and HQ users bypass; empty outlet_use_case passes through
  if (
    useCases &&
    useCases.length > 0 &&
    !isPlatformOwner &&
    outletUseCase &&
    !useCases.includes(outletUseCase)
  ) {
    return <>{fallback ?? <UseCaseBlockedPrompt />}</>;
  }

  if (!feature) return <>{children}</>;
  return (
    <FeatureLock feature={feature} mode="block">
      {children}
    </FeatureLock>
  );
}

function UseCaseBlockedPrompt() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Lock className="size-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">Not available for your outlet type</p>
        <p className="text-xs text-muted-foreground">
          This feature is not enabled for your current outlet configuration.
        </p>
      </div>
    </div>
  );
}
