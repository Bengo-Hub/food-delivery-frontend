"use client";

import { useEffect, useMemo, useState } from "react";

import { useTheme } from "next-themes";

import {
  BanknoteIcon,
  ChevronRight,
  CrownIcon,
  ExternalLinkIcon,
  Loader2,
  Settings2Icon,
  ShieldCheckIcon,
  TicketIcon,
  UserCircle2Icon,
  WalletIcon,
} from "lucide-react";
import Link from "next/link";

import { AuthorizationGate } from "@/components/auth/authorization-gate";
import { RequireAuth } from "@/components/auth/require-auth";
import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { userHasRole } from "@/lib/auth/permissions";
import { useWalletBalance } from "@/hooks/use-wallet";
import type { OrderSummary } from "@/lib/auth/types";
import { orgRoute } from "@/lib/routes";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useAuthStore } from "@/store/auth";

const SSO_PROFILE_URL =
  process.env.NEXT_PUBLIC_AUTH_UI_URL || "https://accounts.codevertexitsolutions.com";

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const orders = useAuthStore((state) => state.orders);
  const status = useAuthStore((state) => state.status);
  const initialize = useAuthStore((state) => state.initialize);
  const refreshOrders = useAuthStore((state) => state.refreshOrders);

  useEffect(() => {
    if (!user && status !== "loading") {
      void initialize();
    }
  }, [user, status, initialize]);

  const isStaffOrAdmin = user ? userHasRole(user, ["staff", "admin", "superuser"]) : false;

  const loyaltySummary = useMemo(() => {
    if (!user) return null;
    return {
      points: user.loyaltyPoints,
      tier: user.loyaltyPoints > 2000 ? "Gold" : user.loyaltyPoints > 1000 ? "Silver" : "Bronze",
      coupons: user.availableCoupons,
    };
  }, [user]);

  return (
    <RequireAuth>
      <SiteShell>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:gap-6 sm:py-8 md:py-12">
          <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground sm:text-3xl">
                <UserCircle2Icon className="size-6 text-brand-emphasis sm:size-7" aria-hidden />
                Account & preferences
              </h1>
              <p className="text-sm text-muted-foreground">
                {isStaffOrAdmin
                  ? "Your account details and security settings."
                  : "Manage your profile, delivery defaults, and loyalty benefits."}
              </p>
            </div>
            {!isStaffOrAdmin && (
              <AuthorizationGate permissions={["orders:view"]}>
                <Button variant="outline" onClick={() => void refreshOrders()}>
                  Refresh latest orders
                </Button>
              </AuthorizationGate>
            )}
          </div>

          {/* SSO Security management card — replaces local 2FA */}
          <SSOSecurityCard />

          {!isStaffOrAdmin && (
            <>
              {/* Payment & Wallet section — customers only */}
              <PaymentWalletCard />

              <div className="grid gap-6 md:grid-cols-2">
                <AuthorizationGate permissions={["profile:update"]}>
                  <ProfileCard />
                </AuthorizationGate>
                <AuthorizationGate permissions={["preferences:update"]}>
                  <PreferencesCard />
                </AuthorizationGate>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <AuthorizationGate permissions={["loyalty:view"]}>
                  <LoyaltyCard summary={loyaltySummary} />
                </AuthorizationGate>
                <AuthorizationGate permissions={["orders:view"]}>
                  <OrdersCard orders={orders} />
                </AuthorizationGate>
              </div>
            </>
          )}

          {isStaffOrAdmin && (
            <div className="grid gap-6 md:grid-cols-2">
              <AuthorizationGate permissions={["profile:update"]}>
                <ProfileCard />
              </AuthorizationGate>
              <AuthorizationGate permissions={["preferences:update"]}>
                <PreferencesCard />
              </AuthorizationGate>
            </div>
          )}
        </div>
      </SiteShell>
    </RequireAuth>
  );
}

function ProfileCard() {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  useEffect(() => {
    setFullName(user?.fullName ?? "");
    setPhone(user?.phone ?? "");
  }, [user?.fullName, user?.phone]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await updateProfile({ fullName, phone });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserCircle2Icon className="size-5 text-brand-emphasis" aria-hidden />
          Profile details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground">
              Full name
            </label>
            <Input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground">
              Phone
            </label>
            <Input
              value={phone ?? ""}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+254 7xx xxx xxx"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground">
              Email
            </label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <Button type="submit" className="w-full">
            Save profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SSOSecurityCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheckIcon className="size-5 text-brand-emphasis" aria-hidden />
          Security & access
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-foreground">Password, 2FA & recovery codes</p>
            <p className="text-sm text-muted-foreground mt-1">
              Security settings including two-factor authentication and backup codes are managed
              through your central identity account.
            </p>
          </div>
          <a
            href={`${SSO_PROFILE_URL}/dashboard/profile`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <Button variant="outline" size="sm" className="gap-1.5 whitespace-nowrap">
              Manage security
              <ExternalLinkIcon className="size-3.5" />
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

function PreferencesCard() {
  const user = useAuthStore((state) => state.user);
  const updatePreferences = useAuthStore((state) => state.updatePreferences);
  const { setTheme: setUiTheme } = useTheme();
  const [theme, setTheme] = useState(user?.preferences.theme ?? "system");
  const [notificationPrefs, setNotificationPrefs] = useState(
    user?.preferences.notifications ?? {
      email: true,
      sms: false,
      push: true,
    },
  );

  useEffect(() => {
    if (!user) return;
    setTheme(user.preferences.theme);
    setNotificationPrefs(user.preferences.notifications);
  }, [user]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await updatePreferences({ theme, notifications: notificationPrefs });
    setUiTheme(theme);
  };

  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings2Icon className="size-5 text-brand-emphasis" aria-hidden />
          Preferences
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground">
              Default theme
            </label>
            <div className="mt-2 flex gap-2">
              {(["light", "dark", "system"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm capitalize ${
                    theme === value
                      ? "border-brand-emphasis bg-brand-emphasis/10 text-brand-emphasis"
                      : "border-border text-muted-foreground"
                  }`}
                  onClick={() => setTheme(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground">
              Notifications
            </label>
            <div className="mt-3 space-y-2">
              {(["email", "sms", "push"] as const).map((channel) => (
                <label
                  key={channel}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                    notificationPrefs[channel]
                      ? "border-brand-emphasis bg-brand-emphasis/10 text-brand-emphasis"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <span className="capitalize">{channel}</span>
                  <input
                    type="checkbox"
                    className="size-4 accent-brand-emphasis"
                    checked={notificationPrefs[channel]}
                    onChange={(event) =>
                      setNotificationPrefs((prev) => ({
                        ...prev,
                        [channel]: event.target.checked,
                      }))
                    }
                  />
                </label>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full">
            Save preferences
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function LoyaltyCard({
  summary,
}: {
  summary: { points: number; tier: string; coupons: number } | null;
}) {
  const orgSlug = useOrgSlug();
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CrownIcon className="size-5 text-brand-emphasis" aria-hidden />
          Loyalty & rewards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary ? (
          <>
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Current tier</p>
              <p className="text-2xl font-semibold text-foreground">{summary.tier}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-muted/20 p-4 text-center">
                <p className="text-xs text-muted-foreground">Points</p>
                <p className="text-lg font-semibold text-foreground">{summary.points}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-4 text-center">
                <p className="text-xs text-muted-foreground">Coupons</p>
                <p className="text-lg font-semibold text-foreground">{summary.coupons}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link href={orgRoute(orgSlug, "/loyalty")}>View rewards & history</Link>
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Sign in to view your loyalty journey.</p>
        )}
      </CardContent>
    </Card>
  );
}

function PaymentWalletCard() {
  const orgSlug = useOrgSlug();
  const { data: balanceData, isLoading } = useWalletBalance();
  const balance = balanceData?.balance ?? 0;
  const currency = balanceData?.currency ?? "KES";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BanknoteIcon className="size-5 text-brand-emphasis" aria-hidden />
          Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Cash payment method */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-4">
          <div>
            <p className="font-medium text-foreground">Cash</p>
            <p className="text-sm text-muted-foreground">Change on delivery</p>
          </div>
          <ChevronRight className="size-5 text-muted-foreground" />
        </div>

        {/* Wallet balance */}
        <Link
          href={orgRoute(orgSlug, "/profile/wallet")}
          className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40"
        >
          <div className="flex items-center gap-3">
            <WalletIcon className="size-5 text-brand-emphasis" />
            <div>
              <p className="font-medium text-foreground">Wallet</p>
              {isLoading ? (
                <Loader2 className="mt-0.5 size-4 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {currency} {balance.toLocaleString()} available
                </p>
              )}
            </div>
          </div>
          <span className="text-sm font-medium text-brand-emphasis">View activity</span>
        </Link>
      </CardContent>
    </Card>
  );
}

function OrdersCard({ orders }: { orders: OrderSummary[] }) {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TicketIcon className="size-5 text-brand-emphasis" aria-hidden />
          Recent orders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Recent orders appear here once you start purchasing.
          </p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">Order {order.id}</p>
              <p className="text-xs text-muted-foreground">Status: {order.status}</p>
              <p className="text-xs text-muted-foreground">
                Total: KES {order.total.toLocaleString()}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
