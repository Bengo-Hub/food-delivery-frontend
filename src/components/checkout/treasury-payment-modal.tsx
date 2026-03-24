"use client";

import { Loader2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface PaymentResult {
  intentId: string;
  amount: number;
  reference: string;
  channel: string;
}

export interface TreasuryPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Treasury payment intent ID */
  paymentIntentId: string;
  /** Tenant slug for treasury-ui URL construction */
  tenantSlug: string;
  amount: number;
  currency?: string;
  description?: string;
  /** Restrict gateway options. Comma-separated gateway types. */
  allowedMethods?: string;
  /** Treasury-UI base URL */
  treasuryUiUrl?: string;
  /** Called when payment succeeds */
  onPaymentConfirmed?: (result: PaymentResult) => void;
  /** Called when payment fails */
  onPaymentFailed?: (error: string) => void;
}

type PaymentState = "loading" | "checkout" | "confirmed" | "failed";

export function TreasuryPaymentModal({
  open,
  onOpenChange,
  paymentIntentId,
  tenantSlug,
  amount,
  currency = "KES",
  description,
  allowedMethods,
  treasuryUiUrl = process.env.NEXT_PUBLIC_TREASURY_UI_URL || "https://books.codevertexitsolutions.com",
  onPaymentConfirmed,
  onPaymentFailed,
}: TreasuryPaymentModalProps) {
  const [paymentState, setPaymentState] = useState<PaymentState>("loading");
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Build iframe URL
  const iframeSrc = useMemo(() => {
    const params = new URLSearchParams({
      intent_id: paymentIntentId,
      tenant: tenantSlug,
      amount: String(amount),
      currency,
      embed: "true",
    });
    if (description) params.set("description", description);
    if (allowedMethods) params.set("gateways", allowedMethods);
    return `${treasuryUiUrl}/pay?${params.toString()}`;
  }, [paymentIntentId, tenantSlug, amount, currency, description, allowedMethods, treasuryUiUrl]);

  // Listen for postMessage from treasury-ui iframe
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (!treasuryUiUrl) return;
      try {
        if (!event.origin.includes(new URL(treasuryUiUrl).hostname)) return;
      } catch {
        return;
      }

      const data = event.data;
      if (!data || typeof data.type !== "string") return;

      switch (data.type) {
        case "treasury:payment_initiated":
          setPaymentState("checkout");
          break;
        case "treasury:payment_confirmed": {
          const result: PaymentResult = {
            intentId: data.intentId,
            amount: data.amount,
            reference: data.reference,
            channel: data.channel,
          };
          setPaymentResult(result);
          setPaymentState("confirmed");
          onPaymentConfirmed?.(result);
          break;
        }
        case "treasury:payment_failed":
          setErrorMessage(data.error || "Payment failed");
          setPaymentState("failed");
          onPaymentFailed?.(data.error || "Payment failed");
          break;
        case "treasury:resize":
          if (iframeRef.current && data.height) {
            iframeRef.current.style.height = `${data.height}px`;
          }
          break;
      }
    },
    [treasuryUiUrl, onPaymentConfirmed, onPaymentFailed],
  );

  useEffect(() => {
    if (open) {
      window.addEventListener("message", handleMessage);
      setPaymentState("loading");
      setPaymentResult(null);
      setErrorMessage("");
    }
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [open, handleMessage]);

  const handleIframeLoad = useCallback(() => {
    if (paymentState === "loading") {
      setPaymentState("checkout");
    }
  }, [paymentState]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            {currency} {amount.toLocaleString()}
            {description && ` \u2014 ${description}`}
          </DialogDescription>
        </DialogHeader>

        <div className="relative min-h-[300px] flex-1">
          {paymentState === "confirmed" && paymentResult ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-green-600"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Payment Successful</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  Amount:{" "}
                  <span className="font-medium text-foreground">
                    {currency} {paymentResult.amount.toLocaleString()}
                  </span>
                </p>
                {paymentResult.reference && (
                  <p>
                    Reference:{" "}
                    <span className="font-mono text-foreground">{paymentResult.reference}</span>
                  </p>
                )}
              </div>
              <Button className="mt-6" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
          ) : paymentState === "failed" ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
                <X className="size-8 text-destructive" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Payment Failed</h3>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
              <Button
                className="mt-6"
                onClick={() => {
                  setPaymentState("loading");
                  setErrorMessage("");
                }}
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {paymentState === "loading" && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="size-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading payment options...</p>
                  </div>
                </div>
              )}
              <iframe
                ref={iframeRef}
                src={iframeSrc}
                className="w-full border-0"
                style={{ height: "500px" }}
                title="Payment"
                onLoad={handleIframeLoad}
                allow="payment"
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
