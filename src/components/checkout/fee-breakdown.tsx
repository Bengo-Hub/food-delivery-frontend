"use client";

import { Info, Loader2 } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { FeeBreakdown } from "@/lib/api/cart-api";

/**
 * Deposit breakdown for BOOKING carts (event tickets / service appointments) when
 * the outlet charges a partial deposit up front. Amounts are computed client-side
 * for display only — the backend independently charges `depositAmount` using the
 * same round2(total * percent / 100) formula.
 */
export interface DepositBreakdown {
  /** Deposit percentage (1-100) configured on the outlet. */
  percent: number;
  /** round2(total * percent / 100) — the amount charged now. */
  depositAmount: number;
  /** total - depositAmount — settled at the event/appointment. */
  balanceDue: number;
  /** Contextual label for the remainder, e.g. "Balance due at appointment". */
  balanceLabel: string;
}

interface FeeBreakdownProps {
  feeBreakdown: FeeBreakdown | null;
  loading: boolean;
  /** When present, render a "deposit now / balance later" split under the total. */
  deposit?: DepositBreakdown | null;
}

function FeeRow({
  label,
  amount,
  negative,
  tooltip,
  bold,
  green,
}: {
  label: string;
  amount: number;
  negative?: boolean;
  tooltip?: string;
  bold?: boolean;
  green?: boolean;
}) {
  const formatted = `KES ${Math.abs(amount).toLocaleString()}`;
  const display = negative ? `-${formatted}` : formatted;

  return (
    <div className={`flex items-center justify-between ${bold ? "text-base font-bold" : "text-sm"}`}>
      <span className={`flex items-center gap-1 ${bold ? "" : "text-muted-foreground"}`}>
        {label}
        {tooltip && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground/60 hover:text-muted-foreground"
                aria-label={`Info about ${label}`}
              >
                <Info className="size-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 text-xs">
              {tooltip}
            </PopoverContent>
          </Popover>
        )}
      </span>
      <span className={green ? "text-green-600" : negative ? "text-green-600" : ""}>
        {display}
      </span>
    </div>
  );
}

export function FeeBreakdownCard({ feeBreakdown, loading, deposit }: FeeBreakdownProps) {
  if (loading) {
    return (
      <section className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Calculating fees...
        </div>
      </section>
    );
  }

  if (!feeBreakdown) {
    return null;
  }

  const fb = feeBreakdown;

  return (
    <section className="rounded-xl border border-border bg-muted/30 p-4">
      <div className="space-y-2 text-sm">
        <FeeRow label="Item total" amount={fb.item_total} />
        {fb.discount > 0 && <FeeRow label="Discount" amount={fb.discount} negative />}
        {fb.packaging_fee > 0 && <FeeRow label="Packaging fee" amount={fb.packaging_fee} />}
        <FeeRow label="Subtotal" amount={fb.subtotal} />
        {fb.small_order_fee > 0 && (
          <FeeRow
            label="Small order fee"
            amount={fb.small_order_fee}
            tooltip="A small fee is applied to orders below the minimum order value to cover operational costs."
          />
        )}
        {fb.service_fee > 0 && (
          <FeeRow
            label="Service fee"
            amount={fb.service_fee}
            tooltip="This fee helps cover platform operating costs and payment processing."
          />
        )}
        {fb.delivery_fee > 0 && <FeeRow label="Delivery fee" amount={fb.delivery_fee} />}
        {fb.delivery_discount > 0 && (
          <FeeRow label="Delivery discount" amount={fb.delivery_discount} negative />
        )}
        {fb.tax_total > 0 && <FeeRow label="Tax" amount={fb.tax_total} />}

        <div className="border-t border-border pt-2">
          <FeeRow label="Total" amount={fb.grand_total} bold />
        </div>

        {deposit && (
          <div className="mt-2 space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <FeeRow
              label={`Deposit due now (${deposit.percent}%)`}
              amount={deposit.depositAmount}
              bold
              tooltip="A deposit secures your booking now. The balance is settled at your event/appointment."
            />
            <FeeRow label={deposit.balanceLabel} amount={deposit.balanceDue} />
          </div>
        )}
      </div>
    </section>
  );
}
