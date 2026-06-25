"use client";

import {
  Activity,
  Check,
  CreditCard,
  DollarSign,
  KeyRound,
  LayoutDashboard,
  Loader2,
  MapPin,
  Package,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { MetricCard } from "@/components/dashboard/metric-card";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/auth";
import { useAdminOrders } from "@/hooks/use-admin";
import {
  useAvailableGateways,
  useDeactivateGateway,
  useSelectGateway,
  useSelectedGateways,
} from "@/hooks/use-gateways";
import { listZones } from "@/lib/api/zones";
import { useUseCaseConfig } from "@/lib/api/use-case";
import {
  useEncryptionKeyStatus,
  useUpdateEncryptionKey,
} from "@/lib/api/encryption-key";
import { useServiceConfig } from "@/hooks/use-service-config";
import { orgRoute } from "@/lib/routes";
import { toast } from "@/lib/toast";
import { apiErrorMessage } from "@/lib/api/error-message";

/* ─── Page ───────────────────────────────────────────────────────────── */

export default function PlatformDashboardPage({
  params,
}: {
  params: { orgSlug?: string };
}) {
  const orgSlug = params?.orgSlug as string;
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isPlatformOwner = !!(
    user?.is_platform_owner ||
    user?.isSuperUser ||
    user?.roles?.includes("superuser")
  );

  const [search, setSearch] = useState("");

  useEffect(() => {
    if (user && !isPlatformOwner) router.replace(`/${orgSlug}`);
  }, [user, isPlatformOwner, orgSlug, router]);

  const { data, isLoading } = useAdminOrders({ limit: 100 });

  // NOTE: the fee-config, use-case and payment-gateway-status admin endpoints do
  // not exist in ordering-backend (they previously 404'd and fell back to
  // placeholders). Their queries have been removed; the corresponding tabs now
  // render an explicit "not available" state until a real endpoint is built.

  // Delivery zones: repointed to the real tenant zones endpoint
  // GET /api/v1/{tenant}/zones (zones handler -> ListZones). Returns the tenant's
  // active delivery zones; an empty list is the normal "none configured" state.
  const { data: deliveryZones } = useQuery({
    queryKey: ["platform", "delivery-zones", orgSlug],
    queryFn: () => listZones(orgSlug),
    enabled: isPlatformOwner,
  });

  const orders = data?.orders ?? [];
  const totalOrders = data?.total ?? 0;

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const processingCount = orders.filter((o) => ["confirmed", "preparing"].includes(o.status)).length;
  const deliveryCount = orders.filter((o) => ["ready", "out_for_delivery"].includes(o.status)).length;

  if (!isPlatformOwner) return null;

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 space-y-8">
        <header className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Platform Operations
          </p>
          <h1 className="text-2xl font-bold">Global Order Monitoring</h1>
          <p className="text-sm text-muted-foreground">
            Monitor ecosystem-wide order flow and system health across all tenants.
          </p>
        </header>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList>
            <TabsTrigger value="orders">
              <ShoppingBag className="mr-1.5 size-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="use-case">
              <Settings className="mr-1.5 size-4" />
              Use-Case Config
            </TabsTrigger>
            <TabsTrigger value="fees">
              <DollarSign className="mr-1.5 size-4" />
              Fees
            </TabsTrigger>
            <TabsTrigger value="payments">
              <CreditCard className="mr-1.5 size-4" />
              Payment Gateways
            </TabsTrigger>
            <TabsTrigger value="zones">
              <MapPin className="mr-1.5 size-4" />
              Delivery Zones
            </TabsTrigger>
            <TabsTrigger value="encryption">
              <KeyRound className="mr-1.5 size-4" />
              Encryption Key
            </TabsTrigger>
          </TabsList>

          {/* ─── Orders Tab (existing content) ─────────────────────── */}
          <TabsContent value="orders" className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-4">
              <MetricCard
                title="Total Active Orders"
                value={totalOrders}
                icon={<Activity className="size-4 text-primary" />}
              />
              <MetricCard
                title="Pending Actions"
                value={pendingCount}
                icon={<Loader2 className="size-4 text-amber-500" />}
              />
              <MetricCard
                title="Processing"
                value={processingCount}
                icon={<Package className="size-4 text-blue-500" />}
              />
              <MetricCard
                title="Delivery / Pickup"
                value={deliveryCount}
                icon={<LayoutDashboard className="size-4 text-green-500" />}
              />
            </section>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="Search global orders by ID or customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                  <Package className="size-10 text-muted-foreground" />
                  <p className="font-medium">No active global orders</p>
                  <p className="text-sm text-muted-foreground">
                    Orders from all tenants will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Global Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.slice(0, 10).map((order) => (
                      <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium">#{order.orderNumber} - {order.customerName}</p>
                          <p className="text-xs text-muted-foreground">Status: {order.status.replace(/_/g, " ")}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">KES {order.grandTotal.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ─── Use-Case Config Tab ───────────────────────────────── */}
          <TabsContent value="use-case" className="space-y-6">
            <UseCaseTab orgSlug={orgSlug} enabled={isPlatformOwner} />
          </TabsContent>

          {/* ─── Fee Configuration Tab ─────────────────────────────── */}
          <TabsContent value="fees" className="space-y-6">
            <FeesTab />
          </TabsContent>

          {/* ─── Payment Gateway Status Tab ────────────────────────── */}
          <TabsContent value="payments" className="space-y-6">
            <PaymentGatewaysTab />
          </TabsContent>

          {/* ─── Delivery Zones Tab ────────────────────────────────── */}
          <TabsContent value="zones" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg">Delivery Zones</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    router.push(orgRoute(orgSlug, "/dashboard/staff/delivery-zones"))
                  }
                >
                  <MapPin className="mr-1.5 size-4" />
                  Manage Geofences
                </Button>
              </CardHeader>
              <CardContent>
                {(deliveryZones?.length ?? 0) === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No delivery zones configured. Click &quot;Manage Geofences&quot; to set up zones.
                  </p>
                ) : (
                  <div className="divide-y">
                    {deliveryZones?.map((zone) => (
                      <div key={zone.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium">{zone.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Base fee: KES {zone.deliveryFee.toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={zone.isActive ? "default" : "outline"}>
                          {zone.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Credential Encryption Key Tab ─────────────────────── */}
          <TabsContent value="encryption" className="space-y-6">
            <EncryptionKeyTab orgSlug={orgSlug} enabled={isPlatformOwner} />
          </TabsContent>
        </Tabs>
      </div>
    </SiteShell>
  );
}

/* ─── Credential Encryption Key Tab ──────────────────────────────────── */
//
// Platform-owner-only management of the encryption key used to protect stored
// Google/OAuth credentials at rest. Data flows through the tenant-scoped (but
// platform-owner gated) admin endpoints:
//   GET/PUT /api/v1/{slug}/admin/encryption-key
//
// The raw key is never returned by the backend or shown here — only a
// fingerprint and the active key source.

function extractApiError(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { error?: string; message?: string } } };
  return e?.response?.data?.error || e?.response?.data?.message || fallback;
}

function EncryptionKeyTab({ orgSlug, enabled }: { orgSlug: string; enabled: boolean }) {
  const { data, isLoading } = useEncryptionKeyStatus(orgSlug, enabled);
  const updateKey = useUpdateEncryptionKey(orgSlug);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [manualKey, setManualKey] = useState("");
  const [keyError, setKeyError] = useState<string | null>(null);

  const source = data?.source;
  const badge =
    source === "db"
      ? { label: "Configured (database)", className: "border-transparent bg-green-500/15 text-green-600 dark:text-green-400" }
      : source === "env"
        ? { label: "Using environment fallback", className: "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400" }
        : { label: "Insecure dev key — set a key", className: "border-transparent bg-red-500/15 text-red-600 dark:text-red-400" };

  const handleGenerate = () => {
    setKeyError(null);
    updateKey.mutate(
      { generate: true },
      {
        onSuccess: () => toast.success("New encryption key generated and activated"),
        onError: (err) => toast.error(extractApiError(err, "Failed to generate key")),
      },
    );
  };

  const handleSaveManual = () => {
    setKeyError(null);
    const key = manualKey.trim();
    if (!key) {
      setKeyError("Enter a base64-encoded 32-byte key.");
      return;
    }
    updateKey.mutate(
      { key },
      {
        onSuccess: () => {
          setManualKey("");
          setShowAdvanced(false);
          toast.success("Encryption key updated");
        },
        onError: (err) => {
          const msg = extractApiError(err, "Failed to set key");
          setKeyError(msg);
          toast.error(msg);
        },
      },
    );
  };

  const isPending = updateKey.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="size-5" />
          Credential Encryption Key
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <Badge className={badge.className}>{badge.label}</Badge>
                <dl className="space-y-1 text-sm">
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground">Fingerprint:</dt>
                    <dd className="font-mono">{data?.key_fingerprint || "—"}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground">Last updated:</dt>
                    <dd>
                      {data?.updated_at
                        ? new Date(data.updated_at).toLocaleString()
                        : "Never"}
                    </dd>
                  </div>
                </dl>
              </div>
              <Button onClick={handleGenerate} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <KeyRound className="mr-1.5 size-4" />
                )}
                Generate &amp; activate new key
              </Button>
            </div>

            {/* Info note */}
            <p className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
              New tokens encrypt with the active key; existing tokens stay
              readable (decryption tries previous keys). The raw key is never
              shown.
            </p>

            {/* Advanced: paste key */}
            <div className="border-t pt-4">
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => setShowAdvanced((v) => !v)}
              >
                {showAdvanced ? "Hide advanced" : "Advanced — set a specific key"}
              </button>
              {showAdvanced && (
                <div className="mt-3 space-y-2">
                  <Label htmlFor="encryption-key-input">
                    Base64-encoded 32-byte key
                  </Label>
                  <Textarea
                    id="encryption-key-input"
                    value={manualKey}
                    onChange={(e) => {
                      setManualKey(e.target.value);
                      if (keyError) setKeyError(null);
                    }}
                    placeholder="Paste a base64-encoded 32-byte key…"
                    rows={2}
                    className="font-mono text-xs"
                    spellCheck={false}
                  />
                  {keyError && (
                    <p className="text-xs text-destructive">{keyError}</p>
                  )}
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleSaveManual}
                      disabled={isPending}
                    >
                      {isPending ? (
                        <Loader2 className="mr-1.5 size-4 animate-spin" />
                      ) : null}
                      Save key
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Payment Gateways Tab ───────────────────────────────────────────── */
//
// Platform owners have config.manage, so the enable/disable controls mirror the
// tenant settings page. Data flows through the ordering-backend payments proxy
// via the shared gateway hooks (no browser-direct treasury-api calls).

function PaymentGatewaysTab() {
  const { data: available = [], isLoading: availableLoading } = useAvailableGateways();
  const { data: selected = [], isLoading: selectedLoading } = useSelectedGateways();
  const selectGateway = useSelectGateway();
  const deactivateGateway = useDeactivateGateway();

  const [pendingType, setPendingType] = useState<string | null>(null);

  const isLoading = availableLoading || selectedLoading;
  const selectedByType = new Map(selected.map((g) => [g.gateway_type, g]));

  const handleEnable = (gatewayType: string) => {
    setPendingType(gatewayType);
    selectGateway.mutate(
      { gatewayType },
      {
        onSuccess: () => toast.success("Payment gateway enabled"),
        onError: async (err) => toast.error(await apiErrorMessage(err, "Failed to enable gateway")),
        onSettled: () => setPendingType(null),
      },
    );
  };

  const handleDisable = (gatewayType: string) => {
    setPendingType(gatewayType);
    deactivateGateway.mutate(gatewayType, {
      onSuccess: () => toast.success("Payment gateway disabled"),
      onError: async (err) => toast.error(await apiErrorMessage(err, "Failed to disable gateway")),
      onSettled: () => setPendingType(null),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="size-5" />
          Payment Gateways
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : available.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No payment gateways available. Configure gateways in treasury first.
          </p>
        ) : (
          <div className="space-y-3">
            {available.map((gw) => {
              const sel = selectedByType.get(gw.gateway_type);
              const isEnabled = !!sel?.is_active;
              const isPrimary = !!sel?.is_primary && isEnabled;
              const isPending = pendingType === gw.gateway_type;
              return (
                <div
                  key={gw.gateway_type}
                  className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                    isEnabled ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div>
                    <p className="flex items-center gap-2 font-medium">
                      {gw.name}
                      {isPrimary && (
                        <Badge variant="default" className="text-[10px]">
                          <Check className="mr-1 size-3" /> Primary
                        </Badge>
                      )}
                      {sel && (
                        <Badge variant={isEnabled ? "default" : "outline"} className="text-[10px]">
                          {sel.status || (isEnabled ? "active" : "inactive")}
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {gw.gateway_type.replace(/_/g, " ")}
                      {gw.transaction_fee_type && ` · ${gw.transaction_fee_type.replace(/_/g, " ")} fee`}
                      {gw.supports_stk_push && " · STK push"}
                    </p>
                  </div>
                  {isEnabled ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      disabled={isPending}
                      onClick={() => handleDisable(gw.gateway_type)}
                    >
                      {isPending ? (
                        <Loader2 className="mr-1 size-3 animate-spin" />
                      ) : (
                        <X className="mr-1 size-3" />
                      )}
                      Disable
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleEnable(gw.gateway_type)}
                    >
                      {isPending ? <Loader2 className="mr-1 size-3 animate-spin" /> : null}
                      Enable
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Use-Case Config Tab ────────────────────────────────────────────── */
//
// Read-only view of the tenant's business use_case, the available use-cases
// ordering supports, and each outlet's individual use_case. Data flows through
// GET /api/v1/{slug}/admin/use-case (config.view permission).

function formatUseCase(value: string): string {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function UseCaseTab({ orgSlug, enabled }: { orgSlug: string; enabled: boolean }) {
  const { data, isLoading } = useUseCaseConfig(orgSlug, enabled);

  const useCase = data?.use_case ?? "";
  const available = data?.available_use_cases ?? [];
  const outlets = data?.outlets ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="size-5" />
          Tenant Use-Case
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Primary use-case</p>
                <p className="text-base font-medium">{formatUseCase(useCase)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {available.length === 0 ? (
                  <span className="text-sm text-muted-foreground">
                    No use-cases available
                  </span>
                ) : (
                  available.map((uc) => (
                    <Badge
                      key={uc}
                      variant={uc === useCase ? "default" : "outline"}
                    >
                      {formatUseCase(uc)}
                    </Badge>
                  ))
                )}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Outlets</p>
              {outlets.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No outlets configured for this tenant.
                </p>
              ) : (
                <div className="divide-y rounded-lg border">
                  {outlets.map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <p className="text-sm font-medium">{o.name}</p>
                      <Badge variant="outline">{formatUseCase(o.use_case)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Fee Configuration Tab ──────────────────────────────────────────── */
//
// Read-only view of the existing `fee_config` service-config item. Field labels
// mirror the editable FeeConfigCard in the staff settings page so the two views
// stay consistent. No dedicated fee endpoint — reuses the service-config store.

const PLATFORM_FEE_FIELDS: { key: string; label: string }[] = [
  { key: "delivery_fee_base", label: "Base delivery fee (KES)" },
  { key: "delivery_fee_per_km", label: "Per-km rate (KES)" },
  { key: "free_delivery_minimum", label: "Free-delivery threshold (KES)" },
  { key: "service_fee_percent", label: "Service fee (%)" },
  { key: "packaging_fee", label: "Packaging fee (KES)" },
  { key: "small_order_fee", label: "Small-order fee (KES)" },
  { key: "small_order_threshold", label: "Small-order threshold (KES)" },
];

function parsePlatformFeeConfig(
  raw: string | undefined,
): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function FeesTab() {
  const { data: configs = [], isLoading } = useServiceConfig();
  const feeConfig = configs.find((c) => c.configKey === "fee_config");
  const values = parsePlatformFeeConfig(feeConfig?.configValue);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="size-5" />
          Fee Configuration
          {feeConfig?.isOverride && (
            <Badge variant="outline" className="ml-1">
              Override
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : !feeConfig ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No fee configuration set. Configure delivery &amp; fees from the
            settings page.
          </p>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2">
            {PLATFORM_FEE_FIELDS.map((f) => {
              const v = values[f.key];
              const display =
                v === undefined || v === null || v === "" ? "—" : String(v);
              return (
                <div key={f.key} className="space-y-1">
                  <dt className="text-sm text-muted-foreground">{f.label}</dt>
                  <dd className="text-base font-medium">{display}</dd>
                </div>
              );
            })}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
