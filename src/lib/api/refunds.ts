import { api } from "./base";

// ─── Types ───────────────────────────────────────────────────────────
//
// Wire format matches ordering-backend
// internal/http/handlers/payments/payment_handler.go:
//   - RefundResponse        (lines 124–136)  — get/list item
//   - CreateRefundRequest   (lines 86–93)    — create body
//   - ListRefundsResponse   (lines 146–152)  — { data, total, limit, page }
//   - RefundStatus / RefundReason enums (internal/modules/payments/domain.go:56–76)
//
// Routes are mounted under /api/v1/{tenant}/admin/refunds/* (payment_handler.go:54–61,
// guarded by PermissionOrdersRefund == "ordering.orders.delete"). The {tenant}
// segment is the org slug (resolved by the tenant middleware), consistent with
// every other ordering route via useOrgSlug().

/** RefundStatus — domain.go:60–64. */
export type RefundStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "cancelled";

/** RefundReason — domain.go:71–76. */
export type RefundReason =
  | "customer_request"
  | "order_cancelled"
  | "duplicate"
  | "fraudulent"
  | "product_unavailable"
  | "other";

/** RefundResponse — payment_handler.go:124–136. */
export interface Refund {
  id: string;
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: RefundStatus;
  reason: RefundReason | string;
  reasonNotes?: string;
  requestedAt: string;
  processedAt?: string | null;
}

/** Request body for POST /admin/refunds — CreateRefundRequest payment_handler.go:86–93. */
export interface CreateRefundRequest {
  paymentId: string;
  amount: number;
  reason: RefundReason;
  reasonNotes?: string;
  idempotencyKey?: string;
}

/** Optional list filters — payment_handler.go:616–657. */
export interface RefundListParams {
  paymentId?: string;
  orderId?: string;
  limit?: number;
  page?: number;
}

export interface RefundListResult {
  refunds: Refund[];
  total: number;
}

// ─── API Functions ───────────────────────────────────────────────────

/** List refunds for the tenant. Unwraps the { data, total } envelope. */
export async function listRefunds(
  slug: string,
  params: RefundListParams = {},
): Promise<RefundListResult> {
  const res = await api.get(`${slug}/admin/refunds`, { params });
  const body = res.data ?? {};
  return {
    refunds: body.data ?? body.refunds ?? [],
    total: body.total ?? 0,
  };
}

/** Get a single refund by ID. */
export async function getRefund(slug: string, id: string): Promise<Refund> {
  const res = await api.get(`${slug}/admin/refunds/${id}`);
  return res.data;
}

/** Create a refund against a payment. */
export async function createRefund(
  slug: string,
  body: CreateRefundRequest,
): Promise<Refund> {
  const res = await api.post(`${slug}/admin/refunds`, body);
  return res.data;
}
