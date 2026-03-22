export type UserRole = "customer" | "rider" | "staff" | "admin" | "superuser";

export type Permission =
  // New dot-prefix format (canonical)
  // Orders
  | "ordering.orders.add"
  | "ordering.orders.read"
  | "ordering.orders.read_own"
  | "ordering.orders.change"
  | "ordering.orders.change_own"
  | "ordering.orders.delete"
  | "ordering.orders.manage"
  | "ordering.orders.manage_own"
  | "ordering.orders.refund"
  // Catalog
  | "ordering.catalog.add"
  | "ordering.catalog.read"
  | "ordering.catalog.read_own"
  | "ordering.catalog.change"
  | "ordering.catalog.change_own"
  | "ordering.catalog.delete"
  | "ordering.catalog.manage"
  | "ordering.catalog.manage_own"
  // Payments
  | "ordering.payments.add"
  | "ordering.payments.read"
  | "ordering.payments.read_own"
  | "ordering.payments.change"
  | "ordering.payments.change_own"
  | "ordering.payments.delete"
  | "ordering.payments.manage"
  | "ordering.payments.manage_own"
  // Logistics
  | "ordering.logistics.add"
  | "ordering.logistics.read"
  | "ordering.logistics.read_own"
  | "ordering.logistics.change"
  | "ordering.logistics.change_own"
  | "ordering.logistics.delete"
  | "ordering.logistics.manage"
  | "ordering.logistics.manage_own"
  // Operations
  | "ordering.operations.add"
  | "ordering.operations.read"
  | "ordering.operations.read_own"
  | "ordering.operations.change"
  | "ordering.operations.change_own"
  | "ordering.operations.delete"
  | "ordering.operations.manage"
  | "ordering.operations.manage_own"
  // Loyalty
  | "ordering.loyalty.add"
  | "ordering.loyalty.read"
  | "ordering.loyalty.read_own"
  | "ordering.loyalty.change"
  | "ordering.loyalty.change_own"
  | "ordering.loyalty.delete"
  | "ordering.loyalty.manage"
  | "ordering.loyalty.manage_own"
  // Notifications
  | "ordering.notifications.add"
  | "ordering.notifications.read"
  | "ordering.notifications.read_own"
  | "ordering.notifications.change"
  | "ordering.notifications.change_own"
  | "ordering.notifications.delete"
  | "ordering.notifications.manage"
  | "ordering.notifications.manage_own"
  // Analytics
  | "ordering.analytics.add"
  | "ordering.analytics.read"
  | "ordering.analytics.read_own"
  | "ordering.analytics.change"
  | "ordering.analytics.change_own"
  | "ordering.analytics.delete"
  | "ordering.analytics.manage"
  | "ordering.analytics.manage_own"
  // Riders
  | "ordering.riders.add"
  | "ordering.riders.read"
  | "ordering.riders.read_own"
  | "ordering.riders.change"
  | "ordering.riders.change_own"
  | "ordering.riders.delete"
  | "ordering.riders.manage"
  | "ordering.riders.manage_own"
  // Staff
  | "ordering.staff.add"
  | "ordering.staff.read"
  | "ordering.staff.read_own"
  | "ordering.staff.change"
  | "ordering.staff.change_own"
  | "ordering.staff.delete"
  | "ordering.staff.manage"
  | "ordering.staff.manage_own"
  // Support
  | "ordering.support.add"
  | "ordering.support.read"
  | "ordering.support.read_own"
  | "ordering.support.change"
  | "ordering.support.change_own"
  | "ordering.support.delete"
  | "ordering.support.manage"
  | "ordering.support.manage_own"
  // Config
  | "ordering.config.view"
  | "ordering.config.manage"
  // Users
  | "ordering.users.manage"
  // Legacy colon format (backward compat)
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
  isSuperUser?: boolean;
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
