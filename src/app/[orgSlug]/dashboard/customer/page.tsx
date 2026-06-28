"use client";

import {
  BadgeCheckIcon,
  BikeIcon,
  CrownIcon,
  GiftIcon,
  Loader2,
  ShoppingBagIcon,
  SparklesIcon,
  StarIcon,
  TrendingUpIcon,
  UtensilsIcon,
  WalletIcon,
} from "lucide-react";
import Link from "next/link";

import { RequireAuth } from "@/components/auth/require-auth";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrders } from "@/hooks/use-orders";
import { useLoyaltyAccount, useLoyaltyTransactions, useRegisterLoyalty } from "@/hooks/use-loyalty";
import { useSubscription } from "@/hooks/use-subscription";
import { useWalletBalance } from "@/hooks/use-wallet";
import { apiErrorMessage } from "@/lib/api/error-message";
import { formatDateTime } from "@/lib/datetime";
import { orgRoute } from "@/lib/routes";
import { toast } from "@/lib/toast";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useAuthStore } from "@/store/auth";

const TIER_COLORS: Record<string, string> = {
  bronze: "text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300",
  silver: "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300",
  gold: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/40 dark:text-yellow-300",
  platinum: "text-purple-600 bg-purple-100 dark:bg-purple-900/40 dark:text-purple-300",
};

const TIER_THRESHOLDS: Record<string, number> = {
  bronze: 0,
  silver: 500,
  gold: 2000,
  platinum: 5000,
};

function tierProgressToNext(tier: string, lifetimePoints: number): { nextTier: string; needed: number; pct: number } | null {
  const tiers = ["bronze", "silver", "gold", "platinum"];
  const idx = tiers.indexOf(tier.toLowerCase());
  if (idx === -1 || idx === tiers.length - 1) return null;
  const next = tiers[idx + 1];
  const needed = TIER_THRESHOLDS[next] - lifetimePoints;
  const from = TIER_THRESHOLDS[tier.toLowerCase()];
  const to = TIER_THRESHOLDS[next];
  const pct = Math.min(100, Math.round(((lifetimePoints - from) / (to - from)) * 100));
  return { nextTier: next, needed: Math.max(0, needed), pct };
}

export default function CustomerDashboardPage() {
  const orgSlug = useOrgSlug();
  const user = useAuthStore((state) => state.user);
  const { hasFeature, isPlatformOwner } = useSubscription();
  const hasLoyalty = isPlatformOwner || hasFeature("loyalty_program");
  const hasWallet = isPlatformOwner || hasFeature("wallet");

  const { data: ordersData, isLoading: ordersLoading } = useOrders({ limit: 5 });
  const { data: loyaltyAccount, isLoading: loyaltyLoading, error: loyaltyError } = useLoyaltyAccount();
  const { data: txData, isLoading: txLoading } = useLoyaltyTransactions({ limit: 5 });
  const { data: walletData, isLoading: walletLoading } = useWalletBalance();
  const registerLoyalty = useRegisterLoyalty();

  const orders = ordersData?.orders ?? [];
  const activeOrders = orders.filter((o) =>
    ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "enroute"].includes(o.status),
  );

  const loyaltyNotRegistered = !!loyaltyError || (!loyaltyLoading && !loyaltyAccount);
  const tier = loyaltyAccount?.tier?.toLowerCase() ?? "bronze";
  const tierColorClass = TIER_COLORS[tier] ?? TIER_COLORS.bronze;
  const progress = loyaltyAccount ? tierProgressToNext(tier, loyaltyAccount.lifetimePoints) : null;

  const handleRegisterLoyalty = async () => {
    try {
      await registerLoyalty.mutateAsync();
      toast.success("Welcome to the loyalty program! You're now earning points.");
    } catch (e) {
      toast.error(await apiErrorMessage(e, "Could not register for the loyalty program. Please try again."));
    }
  };

  return (
    <RequireAuth roles={["customer", "member"]} roleOperator="or">
      <SiteShell>
        <div className="mx-auto my-8 flex w-full max-w-5xl flex-col gap-6 px-4">
          {/* Header */}
          <header className="flex flex-col gap-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-emphasis">
              Customer Dashboard
            </p>
            <h1 className="text-3xl font-semibold text-foreground">
              Hello {user?.fullName ?? "there"} 👋
            </h1>
            <p className="text-sm text-muted-foreground">
              Track your orders, loyalty journey, and wallet from one place.
            </p>
          </header>

          {/* Summary Metrics */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Active Orders"
              value={activeOrders.length}
              deltaLabel={`${ordersData?.total ?? 0} total`}
              deltaValue=""
              icon={<UtensilsIcon className="size-4 text-brand-emphasis" />}
            />
            {hasLoyalty && (
              <MetricCard
                title="Loyalty Points"
                value={loyaltyAccount?.balancePoints ?? user?.loyaltyPoints ?? 0}
                deltaLabel="Tier"
                deltaValue={loyaltyAccount ? loyaltyAccount.tier : "—"}
                icon={<CrownIcon className="size-4 text-brand-emphasis" />}
              />
            )}
            {hasWallet && (
              <MetricCard
                title="Wallet Balance"
                value={walletLoading ? "…" : `${walletData?.currency ?? "KES"} ${(walletData?.balance ?? 0).toLocaleString()}`}
                deltaLabel="Available"
                deltaValue=""
                icon={<WalletIcon className="size-4 text-brand-emphasis" />}
              />
            )}
            <MetricCard
              title="Coupons Available"
              value={user?.availableCoupons ?? 0}
              deltaLabel="Tap loyalty tab"
              deltaValue=""
              icon={<GiftIcon className="size-4 text-brand-emphasis" />}
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Loyalty Program */}
            {!hasLoyalty ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <StarIcon className="size-5 text-brand-emphasis" />
                    Loyalty Program
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-4 py-6 text-center">
                    <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                      <SparklesIcon className="size-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Loyalty Program</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Upgrade your subscription to unlock loyalty rewards, tier benefits, and more.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`${process.env.NEXT_PUBLIC_SUBSCRIPTIONS_UI_URL ?? "https://pricing.codevertexitsolutions.com"}/plans`} target="_blank" rel="noopener noreferrer">
                        View Plans
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <StarIcon className="size-5 text-brand-emphasis" />
                  Loyalty Program
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loyaltyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : loyaltyNotRegistered ? (
                  /* Not registered — join CTA */
                  <div className="flex flex-col items-center gap-4 py-6 text-center">
                    <div className="flex size-16 items-center justify-center rounded-full bg-brand-emphasis/10">
                      <SparklesIcon className="size-8 text-brand-emphasis" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Join the Loyalty Program</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Earn points on every order and unlock exclusive rewards, free delivery,
                        and priority support as you level up.
                      </p>
                    </div>
                    <div className="w-full rounded-xl border border-border bg-muted/30 p-4 text-left space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">How it works</p>
                      {[
                        "Earn 1 point per KES 10 spent",
                        "Redeem 100 points for KES 10 off",
                        "Unlock Silver at 500pts, Gold at 2,000pts",
                      ].map((line) => (
                        <div key={line} className="flex items-center gap-2 text-sm">
                          <BadgeCheckIcon className="size-4 shrink-0 text-brand-emphasis" />
                          {line}
                        </div>
                      ))}
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => void handleRegisterLoyalty()}
                      disabled={registerLoyalty.isPending}
                    >
                      {registerLoyalty.isPending ? (
                        <><Loader2 className="mr-2 size-4 animate-spin" />Joining…</>
                      ) : (
                        <><SparklesIcon className="mr-2 size-4" />Join Now — It&apos;s Free</>
                      )}
                    </Button>
                  </div>
                ) : (
                  /* Registered — show tier + progress */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Current Tier</p>
                        <div className="mt-1 flex items-center gap-2">
                          <CrownIcon className="size-5 text-brand-emphasis" />
                          <span className="text-2xl font-bold capitalize text-foreground">{loyaltyAccount!.tier}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${tierColorClass}`}>
                            {loyaltyAccount!.tier}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Balance</p>
                        <p className="text-2xl font-bold text-foreground">{loyaltyAccount!.balancePoints.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">pts</p>
                      </div>
                    </div>

                    {progress && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Progress to <span className="capitalize font-medium">{progress.nextTier}</span></span>
                          <span>{progress.needed.toLocaleString()} pts needed</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-brand-emphasis transition-all"
                            style={{ width: `${progress.pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{progress.pct}% of the way there</p>
                      </div>
                    )}

                    {progress === null && (
                      <div className="rounded-xl border border-border bg-muted/20 p-3 flex items-center gap-2">
                        <BadgeCheckIcon className="size-5 text-brand-emphasis shrink-0" />
                        <p className="text-sm font-medium">You&apos;ve reached Platinum status — the highest tier!</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
                      <div className="rounded-xl border border-border bg-muted/20 p-3 text-center">
                        <p className="text-xs text-muted-foreground">Lifetime Points</p>
                        <p className="text-lg font-bold">{loyaltyAccount!.lifetimePoints.toLocaleString()}</p>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/20 p-3 text-center">
                        <p className="text-xs text-muted-foreground">Point Value</p>
                        <p className="text-lg font-bold">
                          {loyaltyAccount!.currency} {loyaltyAccount!.balanceValue.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Benefits */}
                    {loyaltyAccount!.tierBenefits && (
                      <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your benefits</p>
                        {loyaltyAccount!.tierBenefits.freeDelivery && (
                          <div className="flex items-center gap-2 text-sm">
                            <BadgeCheckIcon className="size-4 text-brand-emphasis shrink-0" />
                            Free delivery on all orders
                          </div>
                        )}
                        {loyaltyAccount!.tierBenefits.prioritySupport && (
                          <div className="flex items-center gap-2 text-sm">
                            <BadgeCheckIcon className="size-4 text-brand-emphasis shrink-0" />
                            Priority customer support
                          </div>
                        )}
                        {loyaltyAccount!.tierBenefits.exclusiveOffers && (
                          <div className="flex items-center gap-2 text-sm">
                            <BadgeCheckIcon className="size-4 text-brand-emphasis shrink-0" />
                            Exclusive member offers
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUpIcon className="size-4 text-brand-emphasis shrink-0" />
                          {loyaltyAccount!.tierBenefits.pointsMultiplier}× points multiplier
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            )} {/* end hasLoyalty conditional */}

            {/* Wallet */}
            {!hasWallet ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <WalletIcon className="size-5 text-brand-emphasis" />
                    Wallet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-4 py-6 text-center">
                    <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                      <WalletIcon className="size-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Wallet</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Upgrade your subscription to enable wallet payments and top-ups.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`${process.env.NEXT_PUBLIC_SUBSCRIPTIONS_UI_URL ?? "https://pricing.codevertexitsolutions.com"}/plans`} target="_blank" rel="noopener noreferrer">
                        View Plans
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <WalletIcon className="size-5 text-brand-emphasis" />
                  Wallet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {walletLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="rounded-2xl bg-brand-emphasis/10 p-6 text-center">
                      <p className="text-sm text-muted-foreground">Available Balance</p>
                      <p className="mt-1 text-4xl font-bold text-foreground">
                        {walletData?.currency ?? "KES"}{" "}
                        {(walletData?.balance ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={orgRoute(orgSlug, "/profile/wallet")}>
                          View history
                        </Link>
                      </Button>
                      <Button className="w-full" asChild>
                        <Link href={orgRoute(orgSlug, "/profile/wallet?action=topup")}>
                          Top up
                        </Link>
                      </Button>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment methods</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BadgeCheckIcon className="size-4 text-brand-emphasis shrink-0" />
                        M-Pesa, Paystack, wallet credits
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Use your wallet balance at checkout for instant payment.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            )} {/* end hasWallet conditional */}
          </div>

          {/* Recent Loyalty Transactions */}
          {hasLoyalty && loyaltyAccount && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <SparklesIcon className="size-5 text-brand-emphasis" />
                    Points Activity
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={orgRoute(orgSlug, "/loyalty")}>View all</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {txLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (txData?.data ?? []).length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No loyalty transactions yet. Start ordering to earn points!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(txData?.data ?? []).map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(tx.occurredAt, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <span className={`text-sm font-bold ${tx.transactionType === "earn" || tx.transactionType === "bonus" ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                          {tx.transactionType === "earn" || tx.transactionType === "bonus" ? "+" : "−"}
                          {Math.abs(tx.points).toLocaleString()} pts
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BikeIcon className="size-5 text-brand-emphasis" />
                  Recent Orders
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={orgRoute(orgSlug, "/orders")}>View all</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <ShoppingBagIcon className="size-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No orders yet.</p>
                  <Button asChild size="sm">
                    <Link href={orgRoute(orgSlug, "/catalog")}>Browse Menu</Link>
                  </Button>
                </div>
              ) : (
                orders.map((order) => (
                  <a
                    key={order.id}
                    href={`${
                      process.env.NEXT_PUBLIC_LOGISTICS_UI_URL ?? "https://logistics.codevertexitsolutions.com"
                    }/${orgSlug}/tracking?orderId=${encodeURIComponent(order.id)}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-muted/30 px-4 py-3 mb-2 text-sm transition-colors hover:bg-muted/60"
                  >
                    <div>
                      <p className="font-semibold text-foreground">#{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.items?.length ?? 0} items &middot; KES {order.grandTotal.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(order.createdAt, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <Badge variant={["delivered", "completed"].includes(order.status) ? "default" : "soft"}>
                      {order.status.replace(/_/g, " ")}
                    </Badge>
                  </a>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Order Now", href: "/catalog", icon: UtensilsIcon },
              { label: "My Orders", href: "/orders", icon: ShoppingBagIcon },
              ...(hasLoyalty
                ? [{ label: "Loyalty", href: "/loyalty", icon: StarIcon }]
                : []),
              ...(hasWallet
                ? [{ label: "Wallet", href: "/profile/wallet", icon: WalletIcon }]
                : []),
            ].map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={orgRoute(orgSlug, href)}
                className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-muted/20 p-4 text-center transition-colors hover:bg-muted/50"
              >
                <Icon className="size-6 text-brand-emphasis" />
                <span className="text-xs font-medium text-foreground">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </SiteShell>
    </RequireAuth>
  );
}
