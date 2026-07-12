import { api } from "./base";

// ─── Types ───────────────────────────────────────────────────────────

export interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  fulfillmentType: string;
  customerId?: string;
  // Resolved customer info (from metadata for guests, from user for auth)
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  outletId: string;
  items: AdminOrderItem[];
  subtotal: number;
  deliveryFee: number;
  discountTotal: number;
  grandTotal: number;
  currency: string;
  instructions: string;
  deliveryAddress: string;
  channel: string;
  source?: string;
  metadata?: Record<string, unknown>;
  riderName?: string;
  riderPhone?: string;
  estimatedDeliveryAt?: string;
  placedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderItem {
  id: string;
  inventorySku: string;
  nameSnapshot: string;
  /** Alias for nameSnapshot — used by UI components */
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface AdminOrderFilters {
  status?: string;
  paymentStatus?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  page?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  /** Inventory SKU — used as the key for all override operations */
  sku: string;
  /** Alias for sku, kept for backwards compatibility with list renders */
  id: string;
  inventoryId?: string | undefined;
  categoryId?: string | undefined;
  categoryName?: string | undefined;
  name: string;
  slug: string;
  description?: string | undefined;
  price: number;
  basePrice?: number | undefined;
  currency?: string | undefined;
  imageUrl?: string | undefined;
  isAvailable: boolean;
  isFeatured?: boolean | undefined;
  preparationTime?: number | undefined;
  displayOrder?: number | undefined;
  variants?: MenuItemVariant[] | undefined;
  dietaryTags?: string[] | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItemVariant {
  id: string;
  name: string;
  priceModifier: number;
  isDefault: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  displayOrder?: number;
  isActive?: boolean;
}

/** Override-based create/update request for the proxy catalog model */
export interface CreateMenuItemRequest {
  /** Inventory SKU of the item to add to this tenant's menu */
  sku: string;
  /** Outlet ID — required for creating a new override */
  outletId?: string | undefined;
  basePrice: number;
  currency?: string | undefined;
  isAvailable?: boolean | undefined;
  isFeatured?: boolean | undefined;
  imageUrlOverride?: string | undefined;
  leadTimeMinutes?: number | undefined;
  displayOrder?: number | undefined;
  displaySection?: string | undefined;
}

// ─── Admin Order API ────────────────────────────────────────────────

export async function listAdminOrders(
  slug: string,
  filters?: AdminOrderFilters,
): Promise<{ orders: AdminOrder[]; total: number }> {
  const res = await api.get(`${slug}/admin/orders`, { params: filters });
  const raw = res.data;
  // Backend returns { data: [...], total, limit, page } — normalize to { orders, total }
  const orders: AdminOrder[] = (raw.data ?? raw.orders ?? []).map(normalizeOrder);
  return { orders, total: raw.total ?? orders.length };
}

/** Map backend Order (or AdminOrderSummary) JSON to AdminOrder. */
function normalizeOrder(o: Record<string, unknown>): AdminOrder {
  const meta = (o.metadata ?? {}) as Record<string, unknown>;
  const isGuest = !!meta.guest;

  // Resolve customer contact — top-level fields take priority (set by backend
  // for both auth and guest orders). Fall back to metadata for older responses.
  const customerName =
    ((o.customerName as string) || (isGuest ? (meta.contactName as string) : "")) ?? "";
  const customerEmail =
    ((o.customerEmail as string) || (isGuest ? (meta.contactEmail as string) : "")) ?? "";
  const customerPhone =
    ((o.customerPhone as string) || (isGuest ? (meta.contactPhone as string) : "")) ?? "";

  // Resolve delivery address — backend now returns it as a string in the
  // AdminOrderSummary; full Order has a nested object under deliveryAddress.
  let deliveryAddress = (o.deliveryAddress as string) ?? "";
  if (!deliveryAddress && o.instructions) {
    deliveryAddress = o.instructions as string;
  }

  return {
    ...o,
    customerName,
    customerEmail,
    customerPhone,
    items: ((o.items as unknown[]) ?? []).map((item: unknown) => {
      const it = item as Record<string, unknown>;
      return {
        id: (it.id ?? "") as string,
        inventorySku: (it.inventorySku ?? "") as string,
        nameSnapshot: (it.nameSnapshot ?? it.name ?? "") as string,
        name: (it.nameSnapshot ?? it.name ?? "") as string,
        quantity: (it.quantity ?? 0) as number,
        unitPrice: (it.unitPrice ?? 0) as number,
        totalPrice: (it.totalPrice ?? 0) as number,
        notes: (it.notes ?? "") as string,
      };
    }),
    discountTotal: (o.discountTotal ?? o.discount ?? 0) as number,
    instructions: (o.instructions ?? "") as string,
    deliveryAddress,
  } as AdminOrder;
}

export async function getAdminOrder(slug: string, orderId: string): Promise<AdminOrder> {
  const res = await api.get(`${slug}/admin/orders/${orderId}`);
  return normalizeOrder(res.data as Record<string, unknown>);
}

export async function updateOrderStatus(
  slug: string,
  orderId: string,
  status: string,
): Promise<AdminOrder> {
  const res = await api.put(`${slug}/admin/orders/${orderId}/status`, { status });
  return res.data;
}

export async function cancelAdminOrder(
  slug: string,
  orderId: string,
  reason: string,
): Promise<void> {
  await api.post(`${slug}/admin/orders/${orderId}/cancel`, { reason });
}

export async function deleteAdminOrder(slug: string, orderId: string): Promise<void> {
  await api.delete(`${slug}/admin/orders/${orderId}`);
}

export interface DeliveryTaskAssignment {
  id: string;
  order_id: string;
  logistics_task_id: string;
  status: string;
}

export async function createDeliveryTask(
  slug: string,
  orderId: string,
): Promise<DeliveryTaskAssignment> {
  const res = await api.post(`${slug}/orders/${orderId}/delivery/create-task`, {});
  return res.data;
}

export async function getDeliveryTask(
  slug: string,
  orderId: string,
): Promise<DeliveryTaskAssignment | null> {
  try {
    const res = await api.get(`${slug}/orders/${orderId}/delivery/task`);
    return res.data;
  } catch {
    return null;
  }
}

// assignOrderRider assigns a rider via the canonical ordering-backend admin endpoint,
// which auto-creates the logistics delivery task if missing, assigns the rider, and
// transitions the order to out_for_delivery — keeping order status in sync. (The old
// direct logistics /tasks/{id}/assign call did NOT, leaving the order stuck at "ready".)
export async function assignOrderRider(
  slug: string,
  orderId: string,
  riderId: string,
): Promise<AdminOrder> {
  const res = await api.put(`${slug}/admin/orders/${orderId}/rider`, { rider_id: riderId });
  return res.data;
}

// ─── Catalog API ────────────────────────────────────────────────────

export async function listCategories(
  slug: string,
  params?: { isActive?: boolean; search?: string },
): Promise<Category[]> {
  const res = await api.get(`${slug}/catalog/admin/categories`, { params });
  return res.data;
}

// TODO(catalog): category create/edit/delete is NOT served by ordering-backend.
// It only exposes read-only category endpoints (GET /catalog/categories and
// GET /catalog/admin/categories — see ordering-backend
// internal/http/handlers/catalog/handler.go). Category mutations are owned by the
// upstream inventory/catalog service. These POST/PUT/DELETE calls 404 today, so
// their UI actions have been removed from staff/menu. Repoint these to the
// inventory/catalog-service API once a client base for it exists.
export async function createCategory(slug: string, data: CreateCategoryRequest): Promise<Category> {
  const res = await api.post(`${slug}/catalog/categories`, data);
  return res.data;
}

export async function updateCategory(
  slug: string,
  id: string,
  data: Partial<CreateCategoryRequest>,
): Promise<Category> {
  const res = await api.put(`${slug}/catalog/categories/${id}`, data);
  return res.data;
}

export async function deleteCategory(slug: string, id: string): Promise<void> {
  await api.delete(`${slug}/catalog/categories/${id}`);
}

function normalizeMenuItem(raw: Record<string, unknown>): MenuItem {
  const sku = (raw.sku ?? raw.inventorySku ?? raw.inventory_sku ?? "") as string;
  return {
    sku,
    id: sku,
    inventoryId: (raw.inventoryId ?? raw.inventory_id ?? "") as string,
    categoryId: (raw.categoryId ?? raw.category_id ?? "") as string,
    categoryName: (raw.categoryName ?? raw.category_name ?? "") as string,
    name: (raw.name ?? "") as string,
    slug: sku,
    description: (raw.description ?? "") as string,
    price: (raw.basePrice ?? raw.base_price ?? raw.price ?? 0) as number,
    basePrice: (raw.basePrice ?? raw.base_price ?? raw.price ?? 0) as number,
    currency: (raw.currency ?? "KES") as string,
    imageUrl: (raw.imageUrl ?? raw.imageUrlOverride ?? raw.image_url ?? "") as string,
    isAvailable: (raw.isAvailable ?? raw.is_available ?? true) as boolean,
    isFeatured: (raw.isFeatured ?? raw.is_featured ?? false) as boolean,
    preparationTime: (raw.leadTimeMinutes ?? raw.preparationTime ?? undefined) as number | undefined,
    displayOrder: (raw.displayOrder ?? 0) as number,
    createdAt: (raw.createdAt ?? raw.created_at ?? "") as string,
    updatedAt: (raw.updatedAt ?? raw.updated_at ?? "") as string,
  };
}

export async function listMenuItems(
  slug: string,
  params?: { categoryId?: string; isAvailable?: boolean; search?: string },
): Promise<MenuItem[]> {
  const res = await api.get(`${slug}/catalog/admin/items`, { params });
  const data = res.data?.data ?? res.data ?? [];
  return (Array.isArray(data) ? data : []).map(normalizeMenuItem);
}

export async function createMenuItem(slug: string, data: CreateMenuItemRequest): Promise<MenuItem> {
  const body: Record<string, unknown> = {
    sku: data.sku,
    basePrice: data.basePrice,
  };
  if (data.outletId) body.outletId = data.outletId;
  if (data.currency) body.currency = data.currency;
  if (data.isAvailable !== undefined) body.isAvailable = data.isAvailable;
  if (data.isFeatured !== undefined) body.isFeatured = data.isFeatured;
  if (data.imageUrlOverride) body.imageUrlOverride = data.imageUrlOverride;
  if (data.leadTimeMinutes !== undefined) body.leadTimeMinutes = data.leadTimeMinutes;
  if (data.displayOrder !== undefined) body.displayOrder = data.displayOrder;
  if (data.displaySection) body.displaySection = data.displaySection;
  const res = await api.post(`${slug}/catalog/overrides`, body);
  return normalizeMenuItem(res.data as Record<string, unknown>);
}

export async function updateMenuItem(
  slug: string,
  sku: string,
  data: Partial<CreateMenuItemRequest & { isAvailable: boolean }>,
): Promise<MenuItem> {
  const body: Record<string, unknown> = {};
  if (data.basePrice !== undefined) body.basePrice = data.basePrice;
  if (data.isAvailable !== undefined) body.isAvailable = data.isAvailable;
  if (data.isFeatured !== undefined) body.isFeatured = data.isFeatured;
  if (data.imageUrlOverride) body.imageUrlOverride = data.imageUrlOverride;
  if (data.leadTimeMinutes !== undefined) body.leadTimeMinutes = data.leadTimeMinutes;
  if (data.displayOrder !== undefined) body.displayOrder = data.displayOrder;
  if (data.displaySection) body.displaySection = data.displaySection;
  const res = await api.put(`${slug}/catalog/overrides/${sku}`, body);
  return normalizeMenuItem(res.data as Record<string, unknown>);
}

export async function deleteMenuItem(slug: string, sku: string): Promise<void> {
  await api.delete(`${slug}/catalog/overrides/${sku}`);
}

// ─── Outlet Booking Deposit ─────────────────────────────────────────

export interface OutletBookingDeposit {
  outletId: string;
  bookingDepositPercent: number;
}

/**
 * Set an outlet's booking-deposit percentage (0-100; 0 = pay full). Requires auth
 * + orders.manage. NOTE: ordering-frontend has no per-outlet admin surface (outlets
 * are managed in the outlet-management app — pos-ui/inventory-ui/auth "My
 * Organization"). This client + its mutation hook exist so the control is ready to
 * wire wherever outlets are edited.
 */
export async function setOutletBookingDeposit(
  slug: string,
  outletId: string,
  percent: number,
): Promise<OutletBookingDeposit> {
  const res = await api.put(`${slug}/admin/outlets/${outletId}/booking-deposit`, { percent });
  return {
    outletId: (res.data?.outletId ?? res.data?.outlet_id ?? outletId) as string,
    bookingDepositPercent: (res.data?.bookingDepositPercent ??
      res.data?.booking_deposit_percent ??
      percent) as number,
  };
}
