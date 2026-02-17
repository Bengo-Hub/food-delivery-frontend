import { api } from "./base";

// ─── Types ───────────────────────────────────────────────────────────

export interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  cafeId: string;
  items: AdminOrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  grandTotal: number;
  currency: string;
  deliveryAddress: string;
  deliveryNotes: string;
  riderName?: string;
  riderPhone?: string;
  estimatedDeliveryAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderItem {
  menuItemId: string;
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
  imageUrl?: string;
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
  return res.data;
}

export async function getAdminOrder(slug: string, orderId: string): Promise<AdminOrder> {
  const res = await api.get(`${slug}/admin/orders/${orderId}`);
  return res.data;
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

// ─── Catalog API ────────────────────────────────────────────────────

export async function listCategories(
  slug: string,
  params?: { isActive?: boolean; search?: string },
): Promise<Category[]> {
  const res = await api.get(`${slug}/catalog/categories`, { params });
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
  const res = await api.get(`${slug}/catalog/items`, { params });
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
