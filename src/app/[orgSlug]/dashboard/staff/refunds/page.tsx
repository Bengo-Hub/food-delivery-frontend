"use client";

import { useState } from "react";
import { Loader2, Receipt, RotateCcw, Eye } from "lucide-react";

import { RequireAuth } from "@/components/auth/require-auth";
import { SiteShell } from "@/components/layout/site-shell";
import { useCreateRefund, useRefund, useRefunds } from "@/hooks/use-refunds";
import type { Refund, RefundReason, RefundStatus } from "@/lib/api/refunds";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";

// ── Helpers ───────────────────────────────────────────────────────────────────

const REFUND_REASONS: { value: RefundReason; label: string }[] = [
  { value: "customer_request", label: "Customer request" },
  { value: "order_cancelled", label: "Order cancelled" },
  { value: "duplicate", label: "Duplicate" },
  { value: "fraudulent", label: "Fraudulent" },
  { value: "product_unavailable", label: "Product unavailable" },
  { value: "other", label: "Other" },
];

function reasonLabel(reason: string) {
  return REFUND_REASONS.find((r) => r.value === reason)?.label ?? reason;
}

function statusVariant(status: RefundStatus | string): "default" | "outline" | "soft" {
  switch (status) {
    case "succeeded":
      return "default";
    case "failed":
    case "cancelled":
      return "outline";
    default:
      return "soft";
  }
}

function formatAmount(amount: number, currency: string) {
  const code = currency || "KES";
  return `${code} ${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

// Canonical UUID v1–v5 shape. Used to validate the pasted payment ID — there is
// no tenant/order payments list endpoint to back a searchable picker (see the
// helper text below), so we at least guard against malformed input.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ── Create refund form ─────────────────────────────────────────────────────────

function CreateRefundForm() {
  const create = useCreateRefund();
  const [paymentId, setPaymentId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState<RefundReason | "">("");
  const [reasonNotes, setReasonNotes] = useState("");

  const reset = () => {
    setPaymentId("");
    setAmount("");
    setReason("");
    setReasonNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pid = paymentId.trim();
    const amt = Number(amount);

    if (!pid) {
      toast.error("Enter the payment ID to refund.");
      return;
    }
    if (!UUID_RE.test(pid)) {
      toast.error("Payment ID must be a valid UUID.");
      return;
    }
    if (!amount || Number.isNaN(amt) || amt <= 0) {
      toast.error("Enter a valid refund amount.");
      return;
    }
    if (!reason) {
      toast.error("Select a refund reason.");
      return;
    }

    if (
      !confirm(
        `Issue a refund of ${amt} against payment ${pid}? This action cannot be undone.`,
      )
    ) {
      return;
    }

    create.mutate(
      {
        paymentId: pid,
        amount: amt,
        reason,
        ...(reasonNotes.trim() ? { reasonNotes: reasonNotes.trim() } : {}),
      },
      {
        onSuccess: () => {
          toast.success("Refund created");
          reset();
        },
        onError: () => toast.error("Failed to create refund"),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Refunds are issued against a payment ID (UUID). Open the order&apos;s
        payment record (Orders → the order → Payment) and copy its Payment ID, or
        copy the Payment ID column from the refund ledger below.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="refund-payment-id">Payment ID (UUID)</Label>
          <Input
            id="refund-payment-id"
            placeholder="00000000-0000-0000-0000-000000000000"
            value={paymentId}
            onChange={(e) => setPaymentId(e.target.value)}
            aria-invalid={paymentId.trim() !== "" && !UUID_RE.test(paymentId.trim())}
          />
          {paymentId.trim() !== "" && !UUID_RE.test(paymentId.trim()) ? (
            <p className="text-xs text-destructive">Enter a valid UUID.</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="refund-amount">Amount</Label>
          <Input
            id="refund-amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="refund-reason">Reason</Label>
          <Select value={reason} onValueChange={(v) => setReason(v as RefundReason)}>
            <SelectTrigger id="refund-reason">
              <SelectValue placeholder="Select a reason" />
            </SelectTrigger>
            <SelectContent>
              {REFUND_REASONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="refund-notes">Notes (optional)</Label>
          <Textarea
            id="refund-notes"
            placeholder="Additional context for this refund"
            value={reasonNotes}
            onChange={(e) => setReasonNotes(e.target.value)}
            rows={3}
          />
        </div>
      </div>
      <Button type="submit" disabled={create.isPending}>
        {create.isPending ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <RotateCcw className="mr-2 size-4" />
        )}
        Create Refund
      </Button>
    </form>
  );
}

// ── Refund detail (loads one refund by id) ──────────────────────────────────────

function RefundDetail({ id }: { id: string }) {
  const { data: refund, isLoading } = useRefund(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!refund) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Refund details unavailable.
      </p>
    );
  }

  const rows: [string, string][] = [
    ["Refund ID", refund.id],
    ["Payment ID", refund.paymentId],
    ["Order ID", refund.orderId],
    ["Amount", formatAmount(refund.amount, refund.currency)],
    ["Status", refund.status],
    ["Reason", reasonLabel(refund.reason)],
    ["Notes", refund.reasonNotes || "—"],
    ["Requested", formatDate(refund.requestedAt)],
    ["Processed", formatDate(refund.processedAt)],
  ];

  return (
    <dl className="grid gap-2 text-sm sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-md border border-border p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </dt>
          <dd className="mt-0.5 break-all font-mono text-xs">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

// ── Refunds ledger table ────────────────────────────────────────────────────────

function RefundsTable({
  refunds,
  selectedId,
  onSelect,
}: {
  refunds: Refund[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  if (refunds.length === 0) {
    return (
      <div className="py-10 text-center">
        <Receipt className="mx-auto mb-2 size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No refunds recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="divide-y rounded-lg border border-border">
      <div className="grid grid-cols-[1.4fr_1fr_1.2fr_1fr_1fr_auto] gap-3 bg-muted/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Order Ref</span>
        <span>Amount</span>
        <span>Reason</span>
        <span>Status</span>
        <span>Date</span>
        <span className="sr-only">Actions</span>
      </div>
      {refunds.map((r) => (
        <div key={r.id}>
          <div className="grid grid-cols-[1.4fr_1fr_1.2fr_1fr_1fr_auto] items-center gap-3 px-4 py-3">
            <code
              className="truncate font-mono text-xs text-muted-foreground"
              title={r.orderId}
            >
              {r.orderId}
            </code>
            <span className="text-sm">{formatAmount(r.amount, r.currency)}</span>
            <span className="truncate text-sm" title={reasonLabel(r.reason)}>
              {reasonLabel(r.reason)}
            </span>
            <span>
              <Badge variant={statusVariant(r.status)} className="text-[10px] capitalize">
                {r.status}
              </Badge>
            </span>
            <span className="text-xs text-muted-foreground">{formatDate(r.requestedAt)}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSelect(selectedId === r.id ? null : r.id)}
            >
              <Eye className="mr-1 size-3.5" />
              {selectedId === r.id ? "Hide" : "View"}
            </Button>
          </div>
          {selectedId === r.id && (
            <div className="border-t border-border bg-muted/20 px-4 py-4">
              <RefundDetail id={r.id} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Ledger section ──────────────────────────────────────────────────────────────

function RefundsLedger() {
  const { data, isLoading } = useRefunds();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const refunds = data?.refunds ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <RefundsTable refunds={refunds} selectedId={selectedId} onSelect={setSelectedId} />
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RefundsPage() {
  return (
    <RequireAuth
      roles={["admin", "superuser"]}
      permissions={["ordering.orders.delete"]}
      permissionOperator="or"
    >
      <SiteShell>
        <div className="mx-auto w-full max-w-4xl px-4 py-6">
          <header className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Payments
            </p>
            <h1 className="text-2xl font-bold">Refunds</h1>
            <p className="text-sm text-muted-foreground">
              Review the refund ledger and issue refunds against payments.
            </p>
          </header>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="size-5" />
                  Create a Refund
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CreateRefundForm />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="size-5" />
                  Refund Ledger
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RefundsLedger />
              </CardContent>
            </Card>
          </div>
        </div>
      </SiteShell>
    </RequireAuth>
  );
}
