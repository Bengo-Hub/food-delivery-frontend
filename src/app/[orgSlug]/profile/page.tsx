"use client";

import { useEffect, useMemo, useState } from "react";

import { useTheme } from "next-themes";

import { BellIcon, CrownIcon, KeyRoundIcon, Settings2Icon, TicketIcon, UserCircle2Icon } from "lucide-react";
import Link from "next/link";

import { AuthorizationGate } from "@/components/auth/authorization-gate";
import { RequireAuth } from "@/components/auth/require-auth";
import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { OrderSummary } from "@/lib/auth/types";
import { orgRoute } from "@/lib/routes";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useAuthStore } from "@/store/auth";

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

  const loyaltySummary = useMemo(() => {
    if (!user) return null;
    return {
      points: user.loyaltyPoints,
      tier: user.loyaltyPoints > 2000 ? "Gold" : user.loyaltyPoints > 1000 ? "Silver" : "Bronze",
      coupons: user.availableCoupons,
    };
  }, [user]);

  return (
    <RequireAuth roles={["customer"]}>
      <SiteShell>
        <div className="mx-auto my-12 flex w-full max-w-6xl flex-col gap-6 px-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-semibold text-foreground">
                <UserCircle2Icon className="size-7 text-brand-emphasis" aria-hidden />
                Account & preferences
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your profile, security, delivery defaults, and loyalty benefits.
              </p>
            </div>
            <AuthorizationGate permissions={["orders:view"]}>
              <Button variant="outline" onClick={() => void refreshOrders()}>
                Refresh latest orders
              </Button>
            </AuthorizationGate>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <AuthorizationGate permissions={["profile:update"]}>
              <ProfileCard />
            </AuthorizationGate>
            <SecurityCard />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <AuthorizationGate permissions={["preferences:update"]}>
              <PreferencesCard />
            </AuthorizationGate>
            <AuthorizationGate permissions={["loyalty:view"]}>
              <LoyaltyCard summary={loyaltySummary} />
            </AuthorizationGate>
            <AuthorizationGate permissions={["orders:view"]}>
              <OrdersCard orders={orders} />
            </AuthorizationGate>
          </div>
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

function SecurityCard() {
  const user = useAuthStore((state) => state.user);
  const updateSecurity = useAuthStore((state) => state.updateSecurity);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled ?? false);

  useEffect(() => {
    setTwoFactorEnabled(user?.twoFactorEnabled ?? false);
  }, [user?.twoFactorEnabled]);

  const toggleTwoFactor = async () => {
    if (twoFactorEnabled) {
      await updateSecurity({ disableTwoFactor: true });
      setTwoFactorEnabled(false);
    } else {
      await updateSecurity({ enableTwoFactor: true });
      setTwoFactorEnabled(true);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <KeyRoundIcon className="size-5 text-brand-emphasis" aria-hidden />
          Security & access
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="font-medium text-foreground">Two-factor authentication</p>
          <p className="text-sm text-muted-foreground">
            Protect your account with an additional code when signing in.
          </p>
          <Button
            variant={twoFactorEnabled ? "outline" : "default"}
            className="mt-3"
            onClick={() => void toggleTwoFactor()}
          >
            {twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
          </Button>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="font-medium text-foreground">Backup and recovery</p>
          <p className="text-sm text-muted-foreground">
            Download backup codes to regain access if you lose your device.
          </p>
          <Button variant="outline" className="mt-3" disabled={!twoFactorEnabled}>
            Download recovery codes
          </Button>
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
