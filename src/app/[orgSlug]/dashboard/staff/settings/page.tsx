"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  Check,
  CreditCard,
  DatabaseBackup,
  Globe,
  Link2,
  Loader2,
  Lock,
  Package,
  Pencil,
  Plus,
  Save,
  Settings,
  ShieldAlert,
  SlidersHorizontal,
  Smartphone,
  Mail,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";

import { RequireAuth } from "@/components/auth/require-auth";
import { SiteShell } from "@/components/layout/site-shell";
import { useBrandConfig } from "@/hooks/use-brand";
import {
  useAdminServiceConfig,
  useServiceConfig,
  useUpdateAdminServiceConfig,
  useUpdateServiceConfig,
} from "@/hooks/use-service-config";
import type { ServiceConfigItem } from "@/lib/api/settings";
import { useAuthStore } from "@/store/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useBackupSettings,
  useUpdateBackupSettings,
} from "@/hooks/use-backup-settings";
import type { BackupSettings } from "@/lib/api/backups";
import { toast } from "@/lib/toast";
import { apiErrorMessage } from "@/lib/api/error-message";
import { notificationsApi, subscriptionsApi } from "@/lib/api/platform-services";
import {
  useAvailableGateways,
  useDeactivateGateway,
  useSelectGateway,
  useSelectedGateways,
} from "@/hooks/use-gateways";

// ── Types ────────────────────────────────────────────────────────────────────

interface AvailableProvider {
  id: string;
  channel: string;
  provider_name: string;
}

interface SelectedProviders {
  sms?: string;
  email?: string;
  push?: string;
}

interface Branding {
  from_email: string;
  from_name: string;
  logo_url: string;
}

interface Addon {
  id: string;
  code: string;
  name: string;
  description: string;
  monthly_price: number;
  is_active?: boolean;
}

type ActiveTab =
  | "payments"
  | "notifications"
  | "subscription"
  | "integrations"
  | "configuration";

// ── App brand summary (from GET /api/v1/{tenant}/config) ──────────────────────

function AppBrandSummary() {
  const { data } = useBrandConfig();
  if (!data) return null;
  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardContent className="flex flex-wrap items-center gap-4 py-4">
        {data.logoUrl ? (
          <img
            src={data.logoUrl}
            alt=""
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : null}
        <div>
          <p className="text-sm font-medium text-muted-foreground">App brand (read-only)</p>
          <p className="text-lg font-bold">{data.name}</p>
          <p className="text-xs text-muted-foreground">
            Display name and theme colors come from tenant config. Notification branding (logo, from name) is editable in the Notifications tab.
          </p>
        </div>
        {data.primaryColor ? (
          <div
            className="h-8 w-8 rounded-full border border-border"
            style={{ backgroundColor: data.primaryColor }}
            title="Primary color"
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function TenantSettingsPage() {
  const params = useParams();
  const tenantSlug = params.orgSlug as string;
  const [activeTab, setActiveTab] = useState<ActiveTab>("payments");

  const tabs: { key: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "payments", label: "Payments", icon: CreditCard },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "subscription", label: "Add-ons", icon: Package },
    { key: "integrations", label: "Integrations", icon: Link2 },
    { key: "configuration", label: "Configuration", icon: SlidersHorizontal },
  ];

  return (
    <RequireAuth roles={["admin", "superuser"]} roleOperator="or">
      <SiteShell>
        <div className="mx-auto w-full max-w-4xl px-4 py-6">
          <header className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Organization Settings
            </p>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage payment gateways, notifications, and subscription add-ons
            </p>
          </header>

          <AppBrandSummary />

          {/* Tabs */}
          <div className="mb-6 flex flex-wrap gap-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === "payments" && <PaymentSettingsTab tenantSlug={tenantSlug} />}
          {activeTab === "notifications" && <NotificationSettingsTab tenantSlug={tenantSlug} />}
          {activeTab === "subscription" && <SubscriptionAddonsTab tenantSlug={tenantSlug} />}
          {activeTab === "integrations" && <IntegrationsTab />}
          {activeTab === "configuration" && <ConfigurationTab />}
        </div>
      </SiteShell>
    </RequireAuth>
  );
}

// ── Payment Settings ─────────────────────────────────────────────────────────

function PaymentSettingsTab({ tenantSlug: _tenantSlug }: { tenantSlug: string }) {
  const { data: available = [], isLoading: availableLoading } = useAvailableGateways();
  const { data: selected = [], isLoading: selectedLoading } = useSelectedGateways();
  const selectGateway = useSelectGateway();
  const deactivateGateway = useDeactivateGateway();

  // Track which gateway row has a mutation in flight (for per-row spinners).
  const [pendingType, setPendingType] = useState<string | null>(null);

  const isLoading = availableLoading || selectedLoading;

  // Map enabled gateways by type for quick lookup of active/primary state.
  const selectedByType = new Map(selected.map((g) => [g.gateway_type, g]));
  const primary = selected.find((g) => g.is_primary && g.is_active);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-5" />
            Payment Gateway
          </CardTitle>
        </CardHeader>
        <CardContent>
          {primary && (
            <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-medium text-muted-foreground">Primary gateway</p>
              <p className="text-lg font-bold">{primary.name}</p>
              <Badge variant="default" className="mt-1">
                {primary.gateway_type.replace(/_/g, " ")}
              </Badge>
            </div>
          )}

          {available.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="size-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No payment gateways available. Ask the platform admin to configure gateways.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-3">Enable payment gateways for your organization:</p>
              {available.map((gw) => {
                const sel = selectedByType.get(gw.gateway_type);
                const isEnabled = !!sel?.is_active;
                const isPrimary = !!sel?.is_primary && isEnabled;
                const isPending = pendingType === gw.gateway_type;
                return (
                  <div
                    key={gw.gateway_type}
                    className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                      isEnabled ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {gw.name}
                        {isPrimary && (
                          <Badge variant="default" className="text-[10px]">
                            <Check className="size-3 mr-1" /> Primary
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
                          <Loader2 className="size-3 animate-spin mr-1" />
                        ) : (
                          <X className="size-3 mr-1" />
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
                        {isPending ? (
                          <Loader2 className="size-3 animate-spin mr-1" />
                        ) : null}
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
    </div>
  );
}

// ── Notification Settings ────────────────────────────────────────────────────

function NotificationSettingsTab({ tenantSlug }: { tenantSlug: string }) {
  const [availableProviders, setAvailableProviders] = useState<AvailableProvider[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<SelectedProviders>({});
  const [branding, setBranding] = useState<Branding>({ from_email: "", from_name: "", logo_url: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const fetchData = useCallback(async () => {
    setLoadError(false);
    const [avRes, selRes, brandRes] = await Promise.allSettled([
      notificationsApi.get(`/api/v1/${tenantSlug}/providers/available`),
      notificationsApi.get(`/api/v1/${tenantSlug}/providers/selected`),
      notificationsApi.get(`/api/v1/${tenantSlug}/branding`),
    ]);
    if (avRes.status === "fulfilled") setAvailableProviders(avRes.value.data || []);
    if (selRes.status === "fulfilled") setSelectedProviders(selRes.value.data || {});
    if (brandRes.status === "fulfilled") setBranding(brandRes.value.data || branding);
    // Surface a clear error state instead of silently degrading to empty.
    if (avRes.status === "rejected" && selRes.status === "rejected" && brandRes.status === "rejected") {
      setLoadError(true);
    }
    setIsLoading(false);
  }, [tenantSlug]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveBranding = async () => {
    setIsSaving(true);
    try {
      await notificationsApi.put(`/api/v1/${tenantSlug}/branding`, branding);
      toast.success("Branding updated");
    } catch (e) {
      toast.error(await apiErrorMessage(e, "Failed to update branding"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectProvider = async (channel: string, providerName: string) => {
    try {
      await notificationsApi.post(`/api/v1/${tenantSlug}/providers/select`, {
        channel,
        provider_name: providerName,
      });
      toast.success(`${channel.toUpperCase()} provider updated`);
      fetchData();
    } catch (e) {
      toast.error(await apiErrorMessage(e, "Failed to update provider"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group available providers by channel
  const byChannel = availableProviders.reduce<Record<string, AvailableProvider[]>>((acc, p) => {
    if (!acc[p.channel]) acc[p.channel] = [];
    acc[p.channel].push(p);
    return acc;
  }, {});

  const channelIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    sms: Smartphone,
    email: Mail,
    push: Bell,
  };

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Could not load notification settings. Please retry or contact support if this persists.
        </div>
      )}
      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5" />
            Notification Providers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(byChannel).length === 0 ? (
            <div className="text-center py-8">
              <Bell className="size-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No notification providers available. Ask the platform admin to configure providers.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(byChannel).map(([channel, providers]) => {
                const Icon = channelIcons[channel] || Bell;
                const currentlySelected = selectedProviders[channel as keyof SelectedProviders];
                return (
                  <div key={channel}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="size-4 text-muted-foreground" />
                      <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                        {channel}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {providers.map((p) => {
                        const isActive = currentlySelected === p.provider_name;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectProvider(channel, p.provider_name)}
                            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                              isActive
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:border-muted-foreground/30"
                            }`}
                          >
                            {isActive && <Check className="size-3 inline mr-1" />}
                            {p.provider_name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-5" />
            Notification Branding
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="from-email">From Email</Label>
              <Input
                id="from-email"
                placeholder="orders@yourdomain.com"
                value={branding.from_email}
                onChange={(e) => setBranding({ ...branding, from_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from-name">From Name</Label>
              <Input
                id="from-name"
                placeholder="Your Business Name"
                value={branding.from_name}
                onChange={(e) => setBranding({ ...branding, from_name: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="logo-url">Logo URL</Label>
              <Input
                id="logo-url"
                placeholder="https://yourdomain.com/logo.png"
                value={branding.logo_url}
                onChange={(e) => setBranding({ ...branding, logo_url: e.target.value })}
              />
            </div>
          </div>
          <Button
            className="mt-4"
            onClick={handleSaveBranding}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            Save Branding
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Subscription Add-ons ─────────────────────────────────────────────────────

function SubscriptionAddonsTab({ tenantSlug }: { tenantSlug: string }) {
  const [availableAddons, setAvailableAddons] = useState<Addon[]>([]);
  const [activeAddons, setActiveAddons] = useState<Addon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [unsubscribing, setUnsubscribing] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  const fetchData = useCallback(async () => {
    setLoadError(false);
    const [avRes, actRes] = await Promise.allSettled([
      subscriptionsApi.get(`/api/v1/${tenantSlug}/addons/available`),
      subscriptionsApi.get(`/api/v1/${tenantSlug}/addons/active`),
    ]);
    if (avRes.status === "fulfilled") setAvailableAddons(avRes.value.data || []);
    if (actRes.status === "fulfilled") setActiveAddons(actRes.value.data || []);
    // Surface a clear error state instead of silently degrading to empty.
    if (avRes.status === "rejected" && actRes.status === "rejected") {
      setLoadError(true);
    }
    setIsLoading(false);
  }, [tenantSlug]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const activeCodes = new Set(activeAddons.map((a) => a.code));

  const handleSubscribe = async (addonCode: string) => {
    setSubscribing(addonCode);
    try {
      await subscriptionsApi.post(`/api/v1/${tenantSlug}/addons/subscribe`, {
        product_code: addonCode,
      });
      toast.success("Add-on activated");
      fetchData();
    } catch (e) {
      toast.error(await apiErrorMessage(e, "Failed to activate add-on"));
    } finally {
      setSubscribing(null);
    }
  };

  const handleUnsubscribe = async (addonCode: string) => {
    setUnsubscribing(addonCode);
    try {
      await subscriptionsApi.delete(`/api/v1/${tenantSlug}/addons/${addonCode}`);
      toast.success("Add-on removed");
      fetchData();
    } catch (e) {
      toast.error(await apiErrorMessage(e, "Failed to remove add-on"));
    } finally {
      setUnsubscribing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Could not load subscription add-ons. Please retry or contact support if this persists.
        </div>
      )}
      {/* Active Add-ons */}
      {activeAddons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="size-5 text-green-500" />
              Active Add-ons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeAddons.map((addon) => (
                <div
                  key={addon.code}
                  className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4"
                >
                  <div>
                    <p className="font-medium">{addon.name}</p>
                    <p className="text-xs text-muted-foreground">{addon.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">KES {addon.monthly_price}/mo</span>
                    {unsubscribing === addon.code ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleUnsubscribe(addon.code)}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setUnsubscribing(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setUnsubscribing(addon.code)}
                      >
                        <X className="size-3 mr-1" /> Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Add-ons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-5" />
            Available Add-ons
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableAddons.length === 0 ? (
            <div className="text-center py-8">
              <Package className="size-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No add-on products available at this time.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {availableAddons
                .filter((a) => !activeCodes.has(a.code))
                .map((addon) => (
                  <div
                    key={addon.code}
                    className="rounded-lg border border-border p-4 flex flex-col justify-between"
                  >
                    <div className="mb-3">
                      <p className="font-medium">{addon.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{addon.description}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">KES {addon.monthly_price}/mo</span>
                      <Button
                        size="sm"
                        disabled={subscribing === addon.code}
                        onClick={() => handleSubscribe(addon.code)}
                      >
                        {subscribing === addon.code ? (
                          <Loader2 className="size-3 animate-spin mr-1" />
                        ) : (
                          <Plus className="size-3 mr-1" />
                        )}
                        Add
                      </Button>
                    </div>
                  </div>
                ))}
              {availableAddons.filter((a) => !activeCodes.has(a.code)).length === 0 && (
                <p className="text-sm text-muted-foreground col-span-2 text-center py-4">
                  All available add-ons are already active.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Integrations Settings ────────────────────────────────────────────────────

const AUTH_API_URL_DEFAULT = process.env.NEXT_PUBLIC_AUTH_API_URL || 'https://sso.codevertexafrica.com';
const ORDERING_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://orderingapi.codevertexafrica.com';

function IntegrationsTab() {
  const [authApiUrl, setAuthApiUrl] = useState(AUTH_API_URL_DEFAULT);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle');

  const testAuthConnection = async () => {
    setTestStatus('loading');
    try {
      const res = await fetch(`${authApiUrl}/healthz`);
      setTestStatus(res.ok ? 'ok' : 'fail');
    } catch {
      setTestStatus('fail');
    }
  };

  // NOTE: CORS allowed-origins is configured at deploy time via the backend's
  // ALLOWED_ORIGINS env (router.New(..., allowedOrigins []string)), not via a
  // runtime tenant endpoint. The previous PUT /api/v1/admin/config/allowed_origins
  // call had no {tenant} segment and hit no real route (404), so the save control
  // is disabled until a real endpoint exists.

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="size-4 text-primary" />
            S2S Auth
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Auth-API URL</Label>
            <div className="flex gap-3">
              <Input
                value={authApiUrl}
                onChange={(e) => setAuthApiUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                size="sm"
                onClick={testAuthConnection}
                disabled={testStatus === 'loading'}
              >
                {testStatus === 'loading' ? <Loader2 className="size-3.5 animate-spin" /> : 'Test'}
              </Button>
            </div>
            {testStatus === 'ok' && <p className="text-xs text-green-600">Connection successful</p>}
            {testStatus === 'fail' && <p className="text-xs text-destructive">Connection failed</p>}
          </div>
          <div className="space-y-2">
            <Label>Ordering API URL (this service)</Label>
            <Input value={ORDERING_API_URL} readOnly className="opacity-60 cursor-not-allowed" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="size-4 text-primary" />
            CORS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Allowed Origins</Label>
            <Input
              placeholder="https://app.example.com, https://admin.example.com"
              disabled
              readOnly
              className="opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">Comma-separated list of allowed CORS origins.</p>
          </div>
          <Button size="sm" disabled className="gap-2">
            <Save className="size-3.5" />
            Save
          </Button>
          <p className="text-xs text-muted-foreground">
            Editing CORS origins from the dashboard is not yet available — allowed
            origins are configured at deploy time on the server.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Configuration (service-config store) ─────────────────────────────────────

// Friendly fee_config field map. Keys must match the shape PUT by the
// delivery-zones page (delivery_fee_base / delivery_fee_per_km /
// free_delivery_minimum) so the two screens stay consistent. The remaining
// keys extend that object; unknown keys on the stored object are preserved.
const FEE_CONFIG_FIELDS: { key: string; label: string; hint?: string }[] = [
  { key: "delivery_fee_base", label: "Base delivery fee (KES)" },
  { key: "delivery_fee_per_km", label: "Per-km rate (KES)" },
  { key: "free_delivery_minimum", label: "Free-delivery threshold (KES)" },
  { key: "service_fee_percent", label: "Service fee (%)" },
  { key: "packaging_fee", label: "Packaging fee (KES)" },
  { key: "small_order_fee", label: "Small-order fee (KES)" },
  { key: "small_order_threshold", label: "Small-order threshold (KES)" },
];

type FeeConfigShape = Record<string, unknown>;

function parseFeeConfig(raw: string | undefined): FeeConfigShape {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as FeeConfigShape) : {};
  } catch {
    return {};
  }
}

function maskValue(item: ServiceConfigItem): string {
  if (item.isSecret) return "•••••";
  return item.configValue ?? "";
}

/** Editable structured form for the fee_config key. */
function FeeConfigCard({ item }: { item: ServiceConfigItem | undefined }) {
  const update = useUpdateServiceConfig();
  const [fields, setFields] = useState<Record<string, string>>({});

  useEffect(() => {
    const existing = parseFeeConfig(item?.configValue);
    const next: Record<string, string> = {};
    for (const f of FEE_CONFIG_FIELDS) {
      const v = existing[f.key];
      next[f.key] = v === undefined || v === null ? "" : String(v);
    }
    setFields(next);
  }, [item?.configValue]);

  const handleSave = () => {
    if (!confirm("Save delivery & fee configuration?")) return;
    // Preserve any keys we don't surface in the form.
    const existing = parseFeeConfig(item?.configValue);
    const value: FeeConfigShape = { ...existing };
    for (const f of FEE_CONFIG_FIELDS) {
      const raw = fields[f.key];
      if (raw === "" || raw === undefined) continue;
      const num = Number(raw);
      value[f.key] = Number.isFinite(num) ? num : raw;
    }
    update.mutate(
      { key: "fee_config", value },
      {
        onSettled: async (_data, error) => {
          if (error) toast.error(await apiErrorMessage(error, "Failed to save fee configuration"));
          else toast.success("Fee configuration saved");
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="size-5" />
          Delivery &amp; Fees
          {item?.isOverride && (
            <Badge variant="soft" className="ml-1">
              Override
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEE_CONFIG_FIELDS.map((f) => (
            <div key={f.key} className="space-y-2">
              <Label htmlFor={`fee-${f.key}`}>{f.label}</Label>
              <Input
                id={`fee-${f.key}`}
                type="number"
                min="0"
                step="any"
                value={fields[f.key] ?? ""}
                onChange={(e) =>
                  setFields((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
        <Button className="mt-4" onClick={handleSave} disabled={update.isPending}>
          {update.isPending ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : (
            <Save className="size-4 mr-2" />
          )}
          Save Configuration
        </Button>
      </CardContent>
    </Card>
  );
}

/** Generic edit dialog for a single (non-secret) service-config value. */
function EditConfigDialog({
  item,
  open,
  onOpenChange,
  admin,
}: {
  item: ServiceConfigItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin: boolean;
}) {
  const updateTenant = useUpdateServiceConfig();
  const updateAdmin = useUpdateAdminServiceConfig();
  const mutation = admin ? updateAdmin : updateTenant;
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue(item?.configValue ?? "");
  }, [item]);

  if (!item) return null;

  const handleSave = () => {
    mutation.mutate(
      { key: item.configKey, value },
      {
        onSettled: async (_data, error) => {
          if (error) {
            toast.error(await apiErrorMessage(error, `Failed to update ${item.configKey}`));
          } else {
            toast.success(`${item.configKey} updated`);
            onOpenChange(false);
          }
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit &ldquo;{item.configKey}&rdquo;</DialogTitle>
          <DialogDescription>
            {admin
              ? "Updating the platform default for this key."
              : "Updating the tenant override for this key."}
            {item.description ? ` ${item.description}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="config-value">Value ({item.configType})</Label>
          <Textarea
            id="config-value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Table of service-config items (tenant or platform). */
function ConfigTable({
  items,
  admin,
  onEdit,
}: {
  items: ServiceConfigItem[];
  admin: boolean;
  onEdit: (item: ServiceConfigItem) => void;
}) {
  return (
    <div className="divide-y rounded-lg border border-border">
      <div className="grid grid-cols-[1fr_auto_1.5fr_auto] gap-3 bg-muted/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Key</span>
        <span>Type</span>
        <span>Value</span>
        <span className="sr-only">Actions</span>
      </div>
      {items.map((item) => (
        <div
          key={item.configKey}
          className="grid grid-cols-[1fr_auto_1.5fr_auto] items-center gap-3 px-4 py-3"
        >
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-sm font-medium">
              {item.isSecret && (
                <Lock className="size-3 shrink-0 text-muted-foreground" />
              )}
              {item.configKey}
              {item.isOverride && (
                <Badge variant="soft" className="ml-1 text-[10px]">
                  Override
                </Badge>
              )}
            </p>
            {item.description ? (
              <p className="truncate text-xs text-muted-foreground">
                {item.description}
              </p>
            ) : null}
          </div>
          <Badge variant="outline" className="text-[10px]">
            {item.configType}
          </Badge>
          <code className="truncate font-mono text-xs text-muted-foreground">
            {admin ? item.configValue : maskValue(item)}
          </code>
          <Button
            size="sm"
            variant="ghost"
            className="size-8 p-0"
            disabled={item.isSecret && !admin}
            onClick={() => onEdit(item)}
            title={
              item.isSecret && !admin
                ? "Secret values are masked and cannot be edited here"
                : "Override"
            }
          >
            <Pencil className="size-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}

// ── Automatic backups (per-tenant OPT-IN) ────────────────────────────────────

const DEFAULT_BACKUP_SETTINGS: BackupSettings = {
  auto_enabled: false,
  schedule_hour: 2,
  retention_days: 4,
};

/** Formats an hour (0-23) as a 12-hour label, e.g. 2 → "2:00 AM", 14 → "2:00 PM". */
function formatHourLabel(hour: number): string {
  const period = hour < 12 ? "AM" : "PM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:00 ${period}`;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => h);

/**
 * Accessible toggle switch built inline (the design system has no Switch
 * component and @radix-ui/react-switch is not a dependency).
 */
function Toggle({
  checked,
  onCheckedChange,
  disabled,
  id,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-primary" : "bg-muted-foreground/30"
      }`}
    >
      <span
        className={`inline-block size-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

/** Per-tenant auto-backup activation card (default OFF — opt-in). */
function AutoBackupCard() {
  const { data, isLoading } = useBackupSettings();
  const update = useUpdateBackupSettings();

  const [form, setForm] = useState<BackupSettings>(DEFAULT_BACKUP_SETTINGS);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const baseline = data ?? DEFAULT_BACKUP_SETTINGS;
  const dirty =
    form.auto_enabled !== baseline.auto_enabled ||
    form.schedule_hour !== baseline.schedule_hour ||
    form.retention_days !== baseline.retention_days;

  const handleSave = () => {
    update.mutate(
      {
        auto_enabled: form.auto_enabled,
        schedule_hour: form.schedule_hour,
        retention_days: Math.max(1, form.retention_days || 1),
      },
      {
        onSettled: async (saved, error) => {
          if (error) {
            toast.error(await apiErrorMessage(error, "Failed to save backup settings"));
          } else {
            if (saved) setForm(saved);
            toast.success(
              form.auto_enabled
                ? "Automatic backups activated"
                : "Backup settings saved",
            );
          }
        },
      },
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DatabaseBackup className="size-5" />
          Automatic backups
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
          <div>
            <Label htmlFor="auto-backup-toggle" className="font-medium">
              Enable automatic backups
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Off by default. When enabled, this store&apos;s data is backed up
              automatically once a day at the selected time.
            </p>
          </div>
          <Toggle
            id="auto-backup-toggle"
            checked={form.auto_enabled}
            onCheckedChange={(next) =>
              setForm((prev) => ({ ...prev, auto_enabled: next }))
            }
            disabled={update.isPending}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="backup-hour">Daily backup time</Label>
            <Select
              value={String(form.schedule_hour)}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, schedule_hour: Number(v) }))
              }
              disabled={!form.auto_enabled || update.isPending}
            >
              <SelectTrigger id="backup-hour">
                <SelectValue placeholder="Select a time" />
              </SelectTrigger>
              <SelectContent>
                {HOUR_OPTIONS.map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    {formatHourLabel(h)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="backup-retention">Retention (days)</Label>
            <Input
              id="backup-retention"
              type="number"
              min={1}
              value={form.retention_days}
              disabled={!form.auto_enabled || update.isPending}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  retention_days: Number(e.target.value),
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Backups older than this are deleted automatically.
            </p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={!dirty || update.isPending}>
          {update.isPending ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : (
            <Save className="size-4 mr-2" />
          )}
          Save
        </Button>
      </CardContent>
    </Card>
  );
}

function ConfigurationTab() {
  const user = useAuthStore((s) => s.user);
  const isSuperuser = !!(
    user?.is_platform_owner ||
    user?.isSuperUser ||
    user?.roles?.includes("superuser")
  );

  const { data: configs = [], isLoading } = useServiceConfig();
  const { data: adminConfigs = [], isLoading: isAdminLoading } =
    useAdminServiceConfig(isSuperuser);

  const [editItem, setEditItem] = useState<ServiceConfigItem | null>(null);
  const [editAdmin, setEditAdmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openEdit = (item: ServiceConfigItem, admin: boolean) => {
    setEditItem(item);
    setEditAdmin(admin);
    setDialogOpen(true);
  };

  const feeConfig = configs.find((c) => c.configKey === "fee_config");
  const otherConfigs = configs.filter((c) => c.configKey !== "fee_config");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FeeConfigCard item={feeConfig} />

      <AutoBackupCard />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            Service Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {otherConfigs.length === 0 ? (
            <div className="py-8 text-center">
              <Settings className="mx-auto mb-2 size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No service configuration values yet.
              </p>
            </div>
          ) : (
            <ConfigTable
              items={otherConfigs}
              admin={false}
              onEdit={(item) => openEdit(item, false)}
            />
          )}
        </CardContent>
      </Card>

      {isSuperuser && (
        <Card className="border-amber-300/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-amber-600" />
              Platform Defaults
              <Badge variant="outline" className="ml-1 text-[10px]">
                Superuser
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-xs text-muted-foreground">
              Platform-wide defaults with unmasked secrets. Changes here affect
              every tenant that has not set an override.
            </p>
            {isAdminLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : adminConfigs.length === 0 ? (
              <div className="py-8 text-center">
                <Settings className="mx-auto mb-2 size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No platform default values.
                </p>
              </div>
            ) : (
              <ConfigTable
                items={adminConfigs}
                admin
                onEdit={(item) => openEdit(item, true)}
              />
            )}
          </CardContent>
        </Card>
      )}

      <EditConfigDialog
        item={editItem}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        admin={editAdmin}
      />
    </div>
  );
}
