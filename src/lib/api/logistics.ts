import axios from "axios";

const LOGISTICS_BASE_URL =
  (process.env.NEXT_PUBLIC_LOGISTICS_API_URL || "https://logisticsapi.codevertexitsolutions.com/api/v1").replace(/\/$/, "");

const logisticsApi = axios.create({
  baseURL: LOGISTICS_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

logisticsApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("ordering.auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        const token = parsed?.session?.accessToken;
        if (token) config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore
    }
    const tenantId = localStorage.getItem("tenantId");
    if (tenantId) config.headers["X-Tenant-ID"] = tenantId;
    const tenantSlug = localStorage.getItem("tenantSlug");
    if (tenantSlug) config.headers["X-Tenant-Slug"] = tenantSlug;
  }
  return config;
});

export interface FleetMember {
  id: string;
  user_id: string;
  fleet_id: string;
  status: string;
  id_number?: string;
  license_no?: string;
  average_rating: number;
  total_ratings: number;
  edges?: {
    user?: {
      id: string;
      full_name: string;
      email: string;
      phone?: string;
    };
    vehicle?: {
      id: string;
      vehicle_type: string;
      make?: string;
      model?: string;
      license_plate?: string;
    };
  };
}

export async function listAvailableRiders(tenantSlug: string): Promise<FleetMember[]> {
  const res = await logisticsApi.get<{ members: FleetMember[] } | FleetMember[]>(
    `/${tenantSlug}/fleet/members`,
    { params: { status: "active" } }
  );
  const data = res.data;
  if (Array.isArray(data)) return data;
  return (data as { members: FleetMember[] }).members ?? [];
}

export async function assignRiderToTask(
  tenantSlug: string,
  logisticsTaskId: string,
  fleetMemberId: string
): Promise<void> {
  await logisticsApi.post(`/${tenantSlug}/tasks/${logisticsTaskId}/assign`, {
    fleet_member_id: fleetMemberId,
  });
}
