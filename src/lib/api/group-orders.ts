import { api } from "./base";

// ─── Types ───────────────────────────────────────────────────────────

export interface GroupOrder {
  id: string;
  code: string;
  outletId: string;
  status: string;
  hostUserId: string;
  participants: { userId: string; name: string; itemCount: number }[];
  createdAt: string;
  updatedAt: string;
}

// ─── API Functions ───────────────────────────────────────────────────

export async function createGroupOrder(
  slug: string,
  data: { outletId: string },
): Promise<GroupOrder> {
  const res = await api.post(`${slug}/group-orders`, data);
  return res.data;
}

export async function joinGroupOrder(slug: string, code: string): Promise<GroupOrder> {
  const res = await api.post(`${slug}/group-orders/join`, { code });
  return res.data;
}

export async function lockGroupOrder(slug: string, groupOrderId: string): Promise<GroupOrder> {
  const res = await api.post(`${slug}/group-orders/${groupOrderId}/lock`);
  return res.data;
}

export async function getGroupOrder(slug: string, groupOrderId: string): Promise<GroupOrder> {
  const res = await api.get(`${slug}/group-orders/${groupOrderId}`);
  return res.data;
}
