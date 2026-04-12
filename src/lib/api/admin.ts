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
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  preparationTime?: number;
  calories?: number;
  variants?: MenuItemVariant[];
  dietaryTags?: string[];
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

export interface CreateMenuItemRequest {
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string | null | undefined;
  isAvailable?: boolean;
  preparationTime?: number;
  calories?: number;
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

/** Map backend Order JSON to AdminOrder, resolving guest contact info from metadata. */
function normalizeOrder(o: Record<string, unknown>): AdminOrder {
  const meta = (o.metadata ?? {}) as Record<string, unknown>;
  const isGuest = !!meta.guest;
  return {
    ...o,
    customerName: (o.customerName ?? (isGuest ? meta.contactName : "") ?? "") as string,
    customerPhone: (o.customerPhone ?? (isGuest ? meta.contactPhone : "") ?? "") as string,
    customerEmail: (o.customerEmail ?? (isGuest ? meta.contactEmail : "") ?? "") as string,
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
    deliveryAddress: (o.instructions ?? "") as string,
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

// ─── Catalog API ────────────────────────────────────────────────────

export async function listCategories(
  slug: string,
  params?: { isActive?: boolean; search?: string },
): Promise<Category[]> {
  const res = await api.get(`${slug}/catalog/admin/categories`, { params });
  return res.data;
}

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

export async function listMenuItems(
  slug: string,
  params?: { categoryId?: string; isAvailable?: boolean; search?: string },
): Promise<MenuItem[]> {
  const res = await api.get(`${slug}/catalog/admin/items`, { params });
  return res.data;
}

export async function createMenuItem(slug: string, data: CreateMenuItemRequest): Promise<MenuItem> {
  const res = await api.post(`${slug}/catalog/items`, data);
  return res.data;
}

export async function updateMenuItem(
  slug: string,
  id: string,
  data: Partial<CreateMenuItemRequest & { isAvailable: boolean }>,
): Promise<MenuItem> {
  const res = await api.put(`${slug}/catalog/items/${id}`, data);
  return res.data;
}

export async function deleteMenuItem(slug: string, id: string): Promise<void> {
  await api.delete(`${slug}/catalog/items/${id}`);
}
