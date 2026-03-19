export type UserRole = "customer" | "rider" | "staff" | "admin" | "superuser";

export type Permission =
  | "orders:view"
  | "orders:manage"
  | "orders:refund"
  | "orders:add"
  | "orders:read"
  | "orders:read_own"
  | "orders:change"
  | "orders:change_own"
  | "orders:delete"
  | "orders:manage_own"
  | "catalog:view"
  | "catalog:manage"
  | "catalog:add"
  | "catalog:read"
  | "catalog:change"
  | "catalog:delete"
  | "catalog:manage_own"
  | "payments:view"
  | "payments:manage"
  | "logistics:view"
  | "logistics:dispatch"
  | "operations:kitchen"
  | "operations:inventory"
  | "profile:update"
  | "preferences:update"
  | "loyalty:view"
  | "loyalty:redeem"
  | "notifications:view"
  | "notifications:manage"
  | "analytics:view"
  | "analytics:export"
  | "riders:onboard"
  | "staff:invite"
  | "support:view"
  | "support:manage"
  | "admin:manage";

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  sessionId: string;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  roles: UserRole[];
  permissions: Permission[];
  avatarUrl?: string | null;
  loyaltyPoints: number;
  availableCoupons: number;
  defaultLocationLabel?: string | null;
  twoFactorEnabled: boolean;
  backupCodesEnabled: boolean;
  preferences: {
    theme: "light" | "dark" | "system";
    notifications: NotificationPreferences;
    language: "en" | "sw";
  };
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  tenant_id?: string;
  tenant_slug?: string;
  is_platform_owner?: boolean;
}

export interface AuthResponse {
  session: SessionTokens;
  user: UserProfile;
  /** Tenant UUID from auth/ordering-backend; set in X-Tenant-ID and localStorage after login */
  tenant_id?: string;
  /** Tenant slug (e.g. urban-loft); set in localStorage for path/headers */
  tenant_slug?: string;
}

export interface ProfileUpdateInput {
  fullName?: string;
  phone?: string;
  avatarUrl?: string | null;
}

export interface PreferencesUpdateInput {
  theme?: "light" | "dark" | "system";
  notifications?: NotificationPreferences;
  language?: "en" | "sw";
}

export interface SecurityUpdateInput {
  enableTwoFactor?: boolean;
  disableTwoFactor?: boolean;
}

export interface OrderSummary {
  id: string;
  status: "pending" | "preparing" | "enroute" | "delivered" | "cancelled";
  total: number;
  placedAt: string;
  eta?: string;
}
