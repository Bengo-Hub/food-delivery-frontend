"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  PlusCircle,
  Wallet,
} from "lucide-react";

import { RequireAuth } from "@/components/auth/require-auth";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWalletBalance, useWalletTransactions } from "@/hooks/use-wallet";
import { formatDateTime } from "@/lib/datetime";

// ─── Page ────────────────────────────────────────────────────────────

export default function WalletPage() {
  const { data: balanceData, isLoading: balanceLoading } = useWalletBalance();
  const { data: txData, isLoading: txLoading } = useWalletTransactions({ limit: 50 });

  const balance = balanceData?.balance ?? 0;
  const currency = balanceData?.currency ?? "KES";
  const transactions = txData?.transactions ?? [];

  const treasuryUrl =
    process.env.NEXT_PUBLIC_TREASURY_UI_URL ?? "#";

  return (
    <RequireAuth roles={["customer"]}>
      <SiteShell>
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-4 sm:gap-6 sm:py-8">
          {/* Header */}
          <header className="flex flex-col gap-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-emphasis">
              Wallet
            </p>
            <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
              My Wallet
            </h1>
          </header>

          {/* Balance Card */}
          <Card className="border-brand-emphasis/30 bg-brand-muted/30">
            <CardContent className="flex items-center justify-between py-6">
              <div>
                <p className="text-sm text-muted-foreground">Available balance</p>
                {balanceLoading ? (
                  <Loader2 className="mt-1 size-6 animate-spin text-brand-emphasis" />
                ) : (
                  <p className="text-3xl font-bold text-brand-emphasis">
                    {currency} {balance.toLocaleString()}
                  </p>
                )}
              </div>
              <Wallet className="size-10 text-brand-emphasis/60" />
            </CardContent>
          </Card>

          {/* Top Up Button */}
          <Button className="w-full gap-2" asChild>
            <a
              href={treasuryUrl !== "#" ? `${treasuryUrl}/top-up` : undefined}
              target={treasuryUrl !== "#" ? "_blank" : undefined}
              rel={treasuryUrl !== "#" ? "noopener noreferrer" : undefined}
              onClick={
                treasuryUrl === "#"
                  ? (e: React.MouseEvent) => {
                      e.preventDefault();
                      // Placeholder — treasury-ui URL not configured
                    }
                  : undefined
              }
            >
              <PlusCircle className="size-4" />
              Top Up Wallet
            </a>
          </Button>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {txLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              ) : transactions.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No transactions yet.
                </p>
              ) : (
                <div className="divide-y">
                  {transactions.map((tx) => {
                    const isCredit = tx.type === "credit";
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        {/* Icon */}
                        <div
                          className={
                            isCredit
                              ? "flex size-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                              : "flex size-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                          }
                        >
                          {isCredit ? (
                            <ArrowDownLeft className="size-4" />
                          ) : (
                            <ArrowUpRight className="size-4" />
                          )}
                        </div>

                        {/* Description + date */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {tx.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(tx.createdAt, {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        {/* Amount + badge */}
                        <div className="flex flex-col items-end gap-0.5">
                          <span
                            className={
                              isCredit
                                ? "text-sm font-semibold text-green-700 dark:text-green-400"
                                : "text-sm font-semibold text-red-700 dark:text-red-400"
                            }
                          >
                            {isCredit ? "+" : "-"}
                            {tx.currency ?? currency} {Math.abs(tx.amount).toLocaleString()}
                          </span>
                          <Badge
                            variant={isCredit ? "default" : "outline"}
                            className="text-[10px]"
                          >
                            {tx.type}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SiteShell>
    </RequireAuth>
  );
}
