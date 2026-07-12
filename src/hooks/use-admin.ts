"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  cancelAdminOrder,
  assignOrderRider,
  deleteAdminOrder,
  createCategory,
  createMenuItem,
  deleteCategory,
  deleteMenuItem,
  getAdminOrder,
  listAdminOrders,
  listCategories,
  listMenuItems,
  setOutletBookingDeposit,
  updateCategory,
  updateMenuItem,
  updateOrderStatus,
  type AdminOrderFilters,
  type CreateCategoryRequest,
  type CreateMenuItemRequest,
} from "@/lib/api/admin";
import { listAvailableRiders } from "@/lib/api/logistics";
import { useOrgSlug } from "@/providers/org-slug-provider";

// ─── Query Keys ──────────────────────────────────────────────────────

export const adminKeys = {
  all: ["admin"] as const,
  orders: () => [...adminKeys.all, "orders"] as const,
  orderList: (filters: AdminOrderFilters) => [...adminKeys.orders(), filters] as const,
  orderDetail: (id: string) => [...adminKeys.orders(), id] as const,
  categories: () => [...adminKeys.all, "categories"] as const,
  categoryList: (filters: Record<string, unknown>) => [...adminKeys.categories(), filters] as const,
  menuItems: () => [...adminKeys.all, "menu-items"] as const,
  menuItemList: (filters: Record<string, unknown>) => [...adminKeys.menuItems(), filters] as const,
};

// ─── Order Queries ───────────────────────────────────────────────────

export function useAdminOrders(filters?: AdminOrderFilters) {
  const slug = useOrgSlug();
  return useQuery({
    queryKey: adminKeys.orderList(filters ?? {}),
    queryFn: () => listAdminOrders(slug, filters),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useAdminOrder(orderId: string) {
  const slug = useOrgSlug();
  return useQuery({
    queryKey: adminKeys.orderDetail(orderId),
    queryFn: () => getAdminOrder(slug, orderId),
    enabled: !!orderId,
    staleTime: 10_000,
  });
}

export function useUpdateOrderStatus() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      updateOrderStatus(slug, orderId, status),
    onSuccess: (_data, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.orderDetail(orderId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.orders() });
    },
  });
}

export function useCancelAdminOrder() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      cancelAdminOrder(slug, orderId, reason),
    onSuccess: (_data, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.orderDetail(orderId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.orders() });
    },
  });
}

export function useDeleteAdminOrder() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => deleteAdminOrder(slug, orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.orders() });
    },
  });
}

// ─── Rider Assignment ────────────────────────────────────────────────

export function useAvailableRiders(enabled = false) {
  const slug = useOrgSlug();
  return useQuery({
    queryKey: ["logistics", "riders", slug],
    queryFn: () => listAvailableRiders(slug),
    enabled: !!slug && enabled,
    staleTime: 30_000,
  });
}

export function useAssignRider() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    // Assign via the ordering-backend canonical endpoint, which auto-creates the logistics
    // task if missing, assigns the rider, and transitions the order to out_for_delivery —
    // keeping order status in sync (the old direct logistics call left it stuck at "ready").
    mutationFn: ({ orderId, fleetMemberId }: { orderId: string; fleetMemberId: string }) =>
      assignOrderRider(slug, orderId, fleetMemberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.orders() });
    },
  });
}

// ─── Category Queries ────────────────────────────────────────────────

export function useCategories(params?: { isActive?: boolean; search?: string }) {
  const slug = useOrgSlug();
  return useQuery({
    queryKey: adminKeys.categoryList(params ?? {}),
    queryFn: () => listCategories(slug, params),
    staleTime: 60_000,
  });
}

export function useCreateCategory() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => createCategory(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.categories() });
    },
  });
}

export function useUpdateCategory() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCategoryRequest> }) =>
      updateCategory(slug, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.categories() });
    },
  });
}

export function useDeleteCategory() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(slug, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.categories() });
    },
  });
}

// ─── Menu Item Queries ───────────────────────────────────────────────

export function useMenuItems(params?: { categoryId?: string; isAvailable?: boolean; search?: string }) {
  const slug = useOrgSlug();
  return useQuery({
    queryKey: adminKeys.menuItemList(params ?? {}),
    queryFn: () => listMenuItems(slug, params),
    staleTime: 60_000,
  });
}

export function useCreateMenuItem() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMenuItemRequest) => createMenuItem(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.menuItems() });
    },
  });
}

export function useUpdateMenuItem() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sku, data }: { sku: string; data: Partial<CreateMenuItemRequest & { isAvailable: boolean }> }) =>
      updateMenuItem(slug, sku, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.menuItems() });
    },
  });
}

export function useDeleteMenuItem() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sku: string) => deleteMenuItem(slug, sku),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.menuItems() });
    },
  });
}

// ─── Outlet Booking Deposit ──────────────────────────────────────────

/**
 * Set an outlet's booking-deposit % (0-100). Ready-to-wire for an outlet-settings
 * screen; ordering-frontend has no per-outlet admin surface today (outlets are
 * managed in pos-ui/inventory-ui/auth), so this hook is currently unused here.
 * Invalidates the outlets cache so a refreshed deposit % is picked up at checkout.
 */
export function useSetOutletBookingDeposit() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ outletId, percent }: { outletId: string; percent: number }) =>
      setOutletBookingDeposit(slug, outletId, percent),
    onSuccess: (_data, { outletId }) => {
      queryClient.invalidateQueries({ queryKey: [slug, "outlets", outletId] });
      queryClient.invalidateQueries({ queryKey: ["outlets"] });
    },
  });
}
