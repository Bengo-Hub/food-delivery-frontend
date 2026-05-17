"use client";

import { AlertTriangle, ArrowRight, Clock, RefreshCw, X, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";

const UPGRADE_URL = "/subscription/upgrade";

function formatDate(d: Date | null | string | undefined): string {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function SubscriptionBanner() {
  const { isPlatformOwner, isLoading, store } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  if (isPlatformOwner || isLoading || !store.hydrated) return null;

  const { plan, status, expiresAt, gracePeriodEndsAt, isInGracePeriod, isExpired, daysUntilExpiry } =
    store;

  const normalizedStatus = (status ?? "").toUpperCase();
  const normalizedPlan = (plan ?? "").toUpperCase() || "STARTER";

  if (isExpired && !isInGracePeriod) {
    return <BlockingOverlay plan={normalizedPlan} />;
  }

  if (dismissed) return null;

  if (isInGracePeriod && gracePeriodEndsAt) {
    const daysLeft = Math.max(
      0,
      Math.ceil((gracePeriodEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    );
    return (
      <Banner
        variant="warning"
        icon={<AlertTriangle className="size-4" />}
        message={`Subscription expired — ${daysLeft} day${daysLeft === 1 ? "" : "s"} left to renew before access is blocked.`}
        actionLabel="Renew now"
        actionHref={UPGRADE_URL}
        onDismiss={null}
      />
    );
  }

  if (normalizedStatus === "TRIAL" && expiresAt) {
    const days = daysUntilExpiry ?? 0;
    return (
      <Banner
        variant="warning"
        icon={<Clock className="size-4" />}
        message={`${normalizedPlan} trial — ${days} day${days === 1 ? "" : "s"} left. Upgrade to keep your features.`}
        actionLabel="Upgrade"
        actionHref={UPGRADE_URL}
        onDismiss={() => setDismissed(true)}
      />
    );
  }

  if (
    normalizedStatus === "ACTIVE" &&
    expiresAt &&
    daysUntilExpiry !== null &&
    daysUntilExpiry <= 7
  ) {
    const days = daysUntilExpiry;
    return (
      <Banner
        variant="warning"
        icon={<RefreshCw className="size-4" />}
        message={`${normalizedPlan} plan — Renews in ${days} day${days === 1 ? "" : "s"} on ${formatDate(expiresAt)}.`}
        actionLabel="Manage billing"
        actionHref={UPGRADE_URL}
        onDismiss={() => setDismissed(true)}
      />
    );
  }

  if (normalizedStatus === "ACTIVE" && expiresAt) {
    return (
      <Banner
        variant="info"
        icon={<Zap className="size-4" />}
        message={`${normalizedPlan} plan — Renews on ${formatDate(expiresAt)}.`}
        actionLabel="Manage"
        actionHref={UPGRADE_URL}
        onDismiss={() => setDismissed(true)}
      />
    );
  }

  if (normalizedStatus === "SUSPENDED") {
    return (
      <Banner
        variant="warning"
        icon={<AlertTriangle className="size-4" />}
        message="Your subscription is suspended. Please update your payment method to restore access."
        actionLabel="Update payment"
        actionHref={UPGRADE_URL}
        onDismiss={null}
      />
    );
  }

  if (normalizedStatus === "CANCELLED") {
    return (
      <Banner
        variant="error"
        icon={<AlertTriangle className="size-4" />}
        message={`${normalizedPlan} plan cancelled${expiresAt ? ` — access until ${formatDate(expiresAt)}` : ""}. Reactivate to keep using premium features.`}
        actionLabel="Reactivate"
        actionHref={UPGRADE_URL}
        onDismiss={() => setDismissed(true)}
      />
    );
  }

  return null;
}

function Banner({
  variant,
  icon,
  message,
  actionLabel,
  actionHref,
  onDismiss,
}: {
  variant: "info" | "warning" | "error";
  icon: React.ReactNode;
  message: string;
  actionLabel: string;
  actionHref: string;
  onDismiss: (() => void) | null;
}) {
  const colors = {
    info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200",
    warning:
      "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200",
    error:
      "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200",
  };

  return (
    <div className={`border-b px-4 py-2.5 ${colors[variant]}`} role="alert">
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        {icon}
        <p className="flex-1 text-sm">{message}</p>
        <Button variant="outline" size="sm" className="shrink-0 gap-1 text-xs" asChild>
          <Link href={actionHref}>
            {actionLabel}
            <ArrowRight className="size-3" />
          </Link>
        </Button>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="shrink-0 rounded p-1 opacity-60 transition hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function BlockingOverlay({ plan }: { plan: string }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-background/95 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-label="Subscription expired"
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <AlertTriangle className="size-8 text-red-600 dark:text-red-400" />
      </div>
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-foreground">Subscription Expired</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Your <span className="font-semibold">{plan}</span> plan has expired and the grace period has
          ended. Upgrade now to restore access to your account.
        </p>
      </div>
      <Button size="lg" className="gap-2" asChild>
        <Link href={UPGRADE_URL}>
          <Zap className="size-4" />
          Upgrade now
        </Link>
      </Button>
    </div>
  );
}
