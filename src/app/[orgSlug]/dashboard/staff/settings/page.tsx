"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  Check,
  CreditCard,
  Loader2,
  Package,
  Plus,
  Settings,
  Smartphone,
  Mail,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";

import { RequireAuth } from "@/components/auth/require-auth";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { treasuryApi, notificationsApi, subscriptionsApi } from "@/lib/api/platform-services";

// ── Types ────────────────────────────────────────────────────────────────────

interface AvailableGateway {
  id: string;
  gateway_type: string;
  name: string;
  transaction_fee_type: string;
  transaction_fee_percentage: number;
  transaction_fee_fixed: number;
}

interface SelectedGateway {
  gateway_type: string;
  name: string;
}

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

type ActiveTab = "payments" | "notifications" | "subscription";

// ── Main Component ───────────────────────────────────────────────────────────

export default function TenantSettingsPage() {
  const params = useParams();
  const tenantSlug = params.orgSlug as string;
  const [activeTab, setActiveTab] = useState<ActiveTab>("payments");

  const tabs: { key: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "payments", label: "Payments", icon: CreditCard },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "subscription", label: "Add-ons", icon: Package },
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
        </div>
      </SiteShell>
    </RequireAuth>
  );
}

// ── Payment Settings ─────────────────────────────────────────────────────────

function PaymentSettingsTab({ tenantSlug }: { tenantSlug: string }) {
  const [available, setAvailable] = useState<AvailableGateway[]>([]);
  const [selected, setSelected] = useState<SelectedGateway | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [avRes, selRes] = await Promise.allSettled([
        treasuryApi.get(`/api/v1/${tenantSlug}/gateways/available`),
        treasuryApi.get(`/api/v1/${tenantSlug}/gateways/selected`),
      ]);
      if (avRes.status === "fulfilled") setAvailable(avRes.value.data || []);
      if (selRes.status === "fulfilled") setSelected(selRes.value.data || null);
    } catch {
      // Silently handle - gateways may not be configured yet
    } finally {
      setIsLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSelect = async (gatewayType: string) => {
    setIsSelecting(gatewayType);
    try {
      await treasuryApi.post(`/api/v1/${tenantSlug}/gateways/select/${gatewayType}`);
      toast.success("Payment gateway updated");
      fetchData();
    } catch {
      toast.error("Failed to select gateway");
    } finally {
      setIsSelecting(null);
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-5" />
            Payment Gateway
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selected && (
            <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-medium text-muted-foreground">Currently using</p>
              <p className="text-lg font-bold">{selected.name}</p>
              <Badge variant="default" className="mt-1">
                {selected.gateway_type.replace(/_/g, " ")}
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
              <p className="text-sm text-muted-foreground mb-3">Select a payment gateway for your organization:</p>
              {available.map((gw) => {
                const isSelected = selected?.gateway_type === gw.gateway_type;
                return (
                  <div
                    key={gw.id}
                    className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                      isSelected ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div>
                      <p className="font-medium">{gw.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {gw.gateway_type.replace(/_/g, " ")}
                        {gw.transaction_fee_percentage > 0 && ` · ${gw.transaction_fee_percentage}% fee`}
                        {gw.transaction_fee_fixed > 0 && ` + KES ${gw.transaction_fee_fixed}`}
                      </p>
                    </div>
                    {isSelected ? (
                      <Badge variant="default">
                        <Check className="size-3 mr-1" /> Selected
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isSelecting === gw.gateway_type}
                        onClick={() => handleSelect(gw.gateway_type)}
                      >
                        {isSelecting === gw.gateway_type ? (
                          <Loader2 className="size-3 animate-spin mr-1" />
                        ) : null}
                        Select
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

  const fetchData = useCallback(async () => {
    try {
      const [avRes, selRes, brandRes] = await Promise.allSettled([
        notificationsApi.get(`/api/v1/${tenantSlug}/providers/available`),
        notificationsApi.get(`/api/v1/${tenantSlug}/providers/selected`),
        notificationsApi.get(`/api/v1/${tenantSlug}/branding`),
      ]);
      if (avRes.status === "fulfilled") setAvailableProviders(avRes.value.data || []);
      if (selRes.status === "fulfilled") setSelectedProviders(selRes.value.data || {});
      if (brandRes.status === "fulfilled") setBranding(brandRes.value.data || branding);
    } catch {
      // Silently handle
    } finally {
      setIsLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveBranding = async () => {
    setIsSaving(true);
    try {
      await notificationsApi.put(`/api/v1/${tenantSlug}/branding`, branding);
      toast.success("Branding updated");
    } catch {
      toast.error("Failed to update branding");
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
    } catch {
      toast.error("Failed to update provider");
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

  const fetchData = useCallback(async () => {
    try {
      const [avRes, actRes] = await Promise.allSettled([
        subscriptionsApi.get(`/api/v1/${tenantSlug}/addons/available`),
        subscriptionsApi.get(`/api/v1/${tenantSlug}/addons/active`),
      ]);
      if (avRes.status === "fulfilled") setAvailableAddons(avRes.value.data || []);
      if (actRes.status === "fulfilled") setActiveAddons(actRes.value.data || []);
    } catch {
      // Silently handle
    } finally {
      setIsLoading(false);
    }
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
    } catch {
      toast.error("Failed to activate add-on");
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
    } catch {
      toast.error("Failed to remove add-on");
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
