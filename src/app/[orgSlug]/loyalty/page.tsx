"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Crown,
  Gift,
  Loader2,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLoyaltyAccount, useLoyaltyTransactions, useTierBenefits } from "@/hooks/use-loyalty";
import { formatDateTime } from "@/lib/datetime";
import { orgRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useOrgSlug } from "@/providers/org-slug-provider";

const TIER_ORDER = ["bronze", "silver", "gold", "platinum"] as const;
const TIER_COLORS: Record<string, string> = {
  bronze: "text-amber-700 dark:text-amber-500",
  silver: "text-slate-500 dark:text-slate-400",
  gold: "text-yellow-500 dark:text-yellow-400",
  platinum: "text-violet-500 dark:text-violet-400",
};
const TIER_BG: Record<string, string> = {
  bronze: "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
  silver: "from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30",
  gold: "from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30",
  platinum: "from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30",
};

function tierIcon(tier: string) {
  switch (tier) {
    case "platinum":
      return <Trophy className="size-6" />;
    case "gold":
      return <Crown className="size-6" />;
    case "silver":
      return <Star className="size-6" />;
    default:
      return <Sparkles className="size-6" />;
  }
}

export default function LoyaltyPage() {
  const orgSlug = useOrgSlug();
  const { data: account, isLoading: accountLoading } = useLoyaltyAccount();
  const { data: tierData } = useTierBenefits();
  const [txPage, setTxPage] = useState(1);
  const { data: txData, isLoading: txLoading } = useLoyaltyTransactions({
    limit: 20,
    page: txPage,
  });

  const tier = account?.tier?.toLowerCase() ?? "bronze";
  const thresholds = tierData?.tierThresholds ?? { bronze: 0, silver: 1000, gold: 5000, platinum: 10000 };

  // Calculate progress to next tier
  const currentTierIdx = TIER_ORDER.indexOf(tier as (typeof TIER_ORDER)[number]);
  const nextTier = currentTierIdx < TIER_ORDER.length - 1 ? TIER_ORDER[currentTierIdx + 1] : null;
  const lifetimePoints = account?.lifetimePoints ?? 0;
  const nextThreshold = nextTier ? thresholds[nextTier] ?? 10000 : lifetimePoints;
  const currentThreshold = thresholds[tier] ?? 0;
  const progressPct = nextTier
    ? Math.min(100, ((lifetimePoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    : 100;

  return (
    <RequireAuth roles={["customer"]}>
      <SiteShell>
        <div className="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6 px-4">
          {/* Back */}
          <Link
            href={orgRoute(orgSlug, "/profile")}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to profile
          </Link>

          {accountLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="size-7 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Hero Balance Card */}
              <Card className={cn("overflow-hidden bg-gradient-to-br", TIER_BG[tier] ?? TIER_BG.bronze)}>
                <CardContent className="py-8">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className={cn("flex size-16 items-center justify-center rounded-full bg-white/60 dark:bg-white/10", TIER_COLORS[tier])}>
                      {tierIcon(tier)}
                    </div>
                    <div>
                      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                        {tier} member
                      </p>
                      <p className="text-4xl font-bold text-foreground">
                        {(account?.balancePoints ?? 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        points &middot; worth KES {(account?.balanceValue ?? 0).toLocaleString()}
                      </p>
                    </div>

                    {/* Progress to next tier */}
                    {nextTier && (
                      <div className="w-full max-w-xs">
                        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                          <span className="capitalize">{tier}</span>
                          <span className="capitalize">{nextTier}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/40 dark:bg-white/10">
                          <div
                            className="h-full rounded-full bg-brand-emphasis transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {(nextThreshold - lifetimePoints).toLocaleString()} points to{" "}
                          <span className="capitalize font-medium">{nextTier}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Benefits & History Tabs */}
              <Tabs defaultValue="history">
                <TabsList className="w-full">
                  <TabsTrigger value="history" className="flex-1">
                    History
                  </TabsTrigger>
                  <TabsTrigger value="benefits" className="flex-1">
                    Benefits
                  </TabsTrigger>
                  <TabsTrigger value="how" className="flex-1">
                    How it works
                  </TabsTrigger>
                </TabsList>

                {/* History Tab */}
                <TabsContent value="history">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <TrendingUp className="size-4 text-brand-emphasis" />
                        Points History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {txLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="size-5 animate-spin text-primary" />
                        </div>
                      ) : !txData?.data?.length ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                          No transactions yet. Place an order to start earning points!
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {txData.data.map((tx) => (
                            <div
                              key={tx.id}
                              className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3"
                            >
                              <div
                                className={cn(
                                  "flex size-9 shrink-0 items-center justify-center rounded-full",
                                  tx.points > 0
                                    ? "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
                                    : "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400",
                                )}
                              >
                                {tx.points > 0 ? (
                                  <ArrowUp className="size-4" />
                                ) : (
                                  <ArrowDown className="size-4" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground">
                                  {tx.description}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDateTime(tx.occurredAt, {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                              <p
                                className={cn(
                                  "shrink-0 text-sm font-semibold",
                                  tx.points > 0 ? "text-green-600" : "text-red-600",
                                )}
                              >
                                {tx.points > 0 ? "+" : ""}
                                {tx.points}
                              </p>
                            </div>
                          ))}

                          {/* Pagination */}
                          {txData.total > 20 && (
                            <div className="flex items-center justify-between pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={txPage <= 1}
                                onClick={() => setTxPage((p) => p - 1)}
                              >
                                Previous
                              </Button>
                              <span className="text-xs text-muted-foreground">
                                Page {txPage} of {Math.ceil(txData.total / 20)}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={txPage * 20 >= txData.total}
                                onClick={() => setTxPage((p) => p + 1)}
                              >
                                Next
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Benefits Tab */}
                <TabsContent value="benefits">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Gift className="size-4 text-brand-emphasis" />
                        Your{" "}
                        <span className="capitalize">{tier}</span> Benefits
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <BenefitRow
                        label="Points multiplier"
                        value={`${account?.tierBenefits?.pointsMultiplier ?? 1}x`}
                        active
                      />
                      <BenefitRow
                        label="Free delivery"
                        value={account?.tierBenefits?.freeDelivery ? "Yes" : "No"}
                        active={account?.tierBenefits?.freeDelivery ?? false}
                      />
                      <BenefitRow
                        label="Priority support"
                        value={account?.tierBenefits?.prioritySupport ? "Yes" : "No"}
                        active={account?.tierBenefits?.prioritySupport ?? false}
                      />
                      <BenefitRow
                        label="Exclusive offers"
                        value={account?.tierBenefits?.exclusiveOffers ? "Yes" : "No"}
                        active={account?.tierBenefits?.exclusiveOffers ?? false}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* How it works Tab */}
                <TabsContent value="how">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">How It Works</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                      <div className="flex gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand-emphasis font-semibold">
                          1
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Earn points on every order</p>
                          <p>You earn 1 point for every KES 1 spent on orders.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand-emphasis font-semibold">
                          2
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Level up your tier</p>
                          <p>
                            Silver at 1,000 points, Gold at 5,000, Platinum at 10,000. Higher tiers earn
                            faster with multipliers!
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand-emphasis font-semibold">
                          3
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Redeem for rewards</p>
                          <p>
                            10 points = KES 1. Use your points for discounts on future orders.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </SiteShell>
    </RequireAuth>
  );
}

function BenefitRow({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl border p-3 text-sm",
        active
          ? "border-brand-emphasis/30 bg-brand-emphasis/5"
          : "border-border bg-muted/20 opacity-60",
      )}
    >
      <span className={active ? "text-foreground" : "text-muted-foreground"}>{label}</span>
      <Badge variant={active ? "soft" : "outline"}>{value}</Badge>
    </div>
  );
}
