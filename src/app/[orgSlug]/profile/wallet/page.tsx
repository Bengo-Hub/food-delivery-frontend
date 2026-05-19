"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Loader2,
  PlusCircle,
  Smartphone,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { RequireAuth } from "@/components/auth/require-auth";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInitiateWalletTopUp, useWalletBalance, useWalletTransactions } from "@/hooks/use-wallet";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import { formatDateTime } from "@/lib/datetime";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/store/auth";

// ─── Payment method icon map ──────────────────────────────────────────

const EXCLUDED_FOR_TOPUP = new Set(["cod", "cash", "wallet"]);

function PaymentMethodIcon({ type }: { type: string }) {
  if (type === "mpesa") return <Smartphone className="size-5 text-green-600" />;
  return <CreditCard className="size-5 text-blue-600" />;
}

// ─── Top-up modal ─────────────────────────────────────────────────────

function TopUpModal({
  open,
  onClose,
  currency,
}: {
  open: boolean;
  onClose: () => void;
  currency: string;
}) {
  const user = useAuthStore((s) => s.user);
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const { data: paymentData, isLoading: methodsLoading } = usePaymentMethods();
  const initTopUp = useInitiateWalletTopUp();

  // Filter out methods that don't make sense for wallet top-up
  const availableMethods = (paymentData?.gateways ?? []).filter(
    (gw) => gw.enabled && !EXCLUDED_FOR_TOPUP.has(gw.type),
  );

  // Auto-select first available method
  useEffect(() => {
    if (!selectedMethod && availableMethods.length > 0) {
      setSelectedMethod(availableMethods[0].type);
    }
  }, [availableMethods, selectedMethod]);

  const handleSubmit = async () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!selectedMethod) {
      toast.error("Please select a payment method");
      return;
    }

    try {
      const topUpArgs: { amount: number; currency: string; paymentMethod: string; customerEmail?: string } = {
        amount: parsed,
        currency,
        paymentMethod: selectedMethod,
      };
      if (user?.email) topUpArgs.customerEmail = user.email;
      const result = await initTopUp.mutateAsync(topUpArgs);

      if (result.authorizationUrl) {
        // Redirect-based method (Paystack, card gateway, etc.)
        window.location.href = result.authorizationUrl;
        return;
      }

      // No redirect URL — payment intent created (e.g. STK push already triggered)
      toast.success("Top-up initiated. Check your phone to complete the payment.");
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err as Error)?.message ??
        "Failed to initiate top-up";
      toast.error(msg);
    }
  };

  const presets = [500, 1000, 2000, 5000];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="size-5 text-brand-emphasis" />
            Top Up Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="topup-amount">Amount ({currency})</Label>
            <Input
              id="topup-amount"
              type="number"
              min="1"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(String(p))}
                  className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-muted transition-colors"
                >
                  {currency} {p.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Payment method selection */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            {methodsLoading ? (
              <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading payment options…
              </div>
            ) : availableMethods.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payment methods configured.</p>
            ) : (
              <div className="grid gap-2">
                {availableMethods.map((gw) => (
                  <button
                    key={gw.type}
                    type="button"
                    onClick={() => setSelectedMethod(gw.type)}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                      selectedMethod === gw.type
                        ? "border-brand-emphasis bg-brand-emphasis/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <PaymentMethodIcon type={gw.type} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{gw.name}</p>
                      {gw.reason && (
                        <p className="text-xs text-muted-foreground">{gw.reason}</p>
                      )}
                    </div>
                    {selectedMethod === gw.type && (
                      <span className="size-3 rounded-full bg-brand-emphasis" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            className="w-full gap-2"
            disabled={initTopUp.isPending || !selectedMethod || !amount}
            onClick={() => void handleSubmit()}
          >
            {initTopUp.isPending ? (
              <><Loader2 className="size-4 animate-spin" /> Processing…</>
            ) : (
              <><PlusCircle className="size-4" /> Top Up Wallet</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ────────────────────────────────────────────────────────────

export default function WalletPage() {
  const searchParams = useSearchParams();
  const [topUpOpen, setTopUpOpen] = useState(searchParams.get("action") === "topup");

  const { data: balanceData, isLoading: balanceLoading } = useWalletBalance();
  const { data: txData, isLoading: txLoading } = useWalletTransactions({ limit: 50 });

  const balance = balanceData?.balance ?? 0;
  const currency = balanceData?.currency ?? "KES";
  const transactions = txData?.transactions ?? [];

  return (
    <RequireAuth>
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
          <Button className="w-full gap-2" onClick={() => setTopUpOpen(true)}>
            <PlusCircle className="size-4" />
            Top Up Wallet
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
                    const isCredit = tx.type === "credit" || tx.type === "top_up";
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                      >
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

        <TopUpModal
          open={topUpOpen}
          onClose={() => setTopUpOpen(false)}
          currency={currency}
        />
      </SiteShell>
    </RequireAuth>
  );
}
