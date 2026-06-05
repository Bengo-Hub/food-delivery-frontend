"use client";

import {
  DollarSign,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api/base";
import { updateServiceConfig } from "@/lib/api/settings";
import {
  listZones,
  createZone,
  updateZone,
  deleteZone,
  type DeliveryZone,
  type CreateZoneRequest,
} from "@/lib/api/zones";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { cn } from "@/lib/utils";

type FormData = {
  name: string;
  deliveryFee: string;
  minimumOrder: string;
  estimatedTimeMinutes: string;
};

const emptyForm: FormData = {
  name: "",
  deliveryFee: "0",
  minimumOrder: "0",
  estimatedTimeMinutes: "30",
};

export default function DeliveryZonesPage() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);

  // Fee config state
  const [baseFee, setBaseFee] = useState("100");
  const [perKmRate, setPerKmRate] = useState("30");
  const [freeDeliveryMin, setFreeDeliveryMin] = useState("2000");
  const [configSaved, setConfigSaved] = useState(false);

  // Load fee config from tenant settings
  const { data: tenantConfig } = useQuery({
    queryKey: ["tenant-config", slug],
    queryFn: async () => {
      const res = await api.get(`${slug}/config`);
      return res.data;
    },
  });

  useEffect(() => {
    const fc = tenantConfig?.features?.fee_config;
    if (fc) {
      if (fc.delivery_fee_base) setBaseFee(String(fc.delivery_fee_base));
      if (fc.delivery_fee_per_km) setPerKmRate(String(fc.delivery_fee_per_km));
      if (fc.free_delivery_minimum) setFreeDeliveryMin(String(fc.free_delivery_minimum));
    }
  }, [tenantConfig]);

  const saveFeeConfig = useMutation({
    mutationFn: async () => {
      // Persist via the tenant service-config store under the "fee_config" key.
      // The backend (UpsertTenantSetting) parses the {tenant} path segment as a
      // UUID, so we pass the tenant UUID (localStorage "tenantId") rather than slug.
      const tenantId =
        typeof window !== "undefined" ? localStorage.getItem("tenantId") : null;
      if (!tenantId) {
        throw new Error("Missing tenant ID — please sign in again.");
      }
      const existing = tenantConfig?.features?.fee_config ?? {};
      await updateServiceConfig(tenantId, "fee_config", {
        ...existing,
        delivery_fee_base: parseFloat(baseFee) || 100,
        delivery_fee_per_km: parseFloat(perKmRate) || 30,
        free_delivery_minimum: parseFloat(freeDeliveryMin) || 2000,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-config"] });
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 2000);
    },
  });

  const { data: zones = [], isLoading } = useQuery({
    queryKey: ["admin-delivery-zones", slug],
    queryFn: () => listZones(slug),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateZoneRequest) => createZone(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-zones"] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateZoneRequest> }) =>
      updateZone(slug, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-zones"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteZone(slug, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-zones"] });
    },
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingZone(null);
    setShowForm(false);
  };

  const openEdit = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setForm({
      name: zone.name,
      deliveryFee: String(zone.deliveryFee),
      minimumOrder: String(zone.minimumOrder),
      estimatedTimeMinutes: String(zone.estimatedTimeMinutes),
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    const payload: CreateZoneRequest = {
      name: form.name.trim(),
      deliveryFee: parseFloat(form.deliveryFee) || 0,
      minimumOrder: parseFloat(form.minimumOrder) || 0,
      estimatedTimeMinutes: parseInt(form.estimatedTimeMinutes) || 30,
    };

    if (!payload.name) return;

    if (editingZone) {
      updateMutation.mutate({ id: editingZone.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <MapPin className="size-6" />
              Delivery Zones
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage delivery areas, fees, and estimated times.
            </p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="gap-1.5">
              <Plus className="size-4" />
              Add Zone
            </Button>
          )}
        </div>

        {/* Delivery fee config */}
        <div className="mb-6 rounded-xl border border-border p-5">
          <div className="mb-3 flex items-center gap-2">
            <DollarSign className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Auto-Calculation Settings</h2>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            When a delivery address doesn&apos;t match any zone polygon, fees are auto-calculated:
            Base Fee + (Per-Km Rate x distance from outlet).
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Base Fee (KES)
              </label>
              <Input
                type="number"
                min="0"
                step="10"
                value={baseFee}
                onChange={(e) => setBaseFee(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Per-Km Rate (KES)
              </label>
              <Input
                type="number"
                min="0"
                step="5"
                value={perKmRate}
                onChange={(e) => setPerKmRate(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Free Delivery Above (KES)
              </label>
              <Input
                type="number"
                min="0"
                step="100"
                value={freeDeliveryMin}
                onChange={(e) => setFreeDeliveryMin(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => saveFeeConfig.mutate()}
              disabled={saveFeeConfig.isPending}
            >
              {saveFeeConfig.isPending ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : (
                <Save className="mr-1.5 size-4" />
              )}
              Save Config
            </Button>
            {configSaved && (
              <span className="text-xs text-green-600">Saved!</span>
            )}
          </div>
        </div>

        {/* Create / Edit form */}
        {showForm && (
          <div className="mb-6 rounded-xl border border-border p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                {editingZone ? "Edit Zone" : "New Delivery Zone"}
              </h2>
              <button onClick={resetForm} className="rounded-full p-1 hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Zone Name
                </label>
                <Input
                  placeholder="e.g. Busia Township, Suburbs, Kiambu"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Delivery Fee (KES)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="10"
                  value={form.deliveryFee}
                  onChange={(e) => setForm((f) => ({ ...f, deliveryFee: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Minimum Order (KES)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="50"
                  value={form.minimumOrder}
                  onChange={(e) => setForm((f) => ({ ...f, minimumOrder: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Estimated Time (minutes)
                </label>
                <Input
                  type="number"
                  min="5"
                  step="5"
                  value={form.estimatedTimeMinutes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, estimatedTimeMinutes: e.target.value }))
                  }
                />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Zones without a polygon act as fallback — all locations match them.
              Add polygons later for precise area targeting.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={resetForm}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={isPending || !form.name.trim()}>
                {isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                {editingZone ? "Save Changes" : "Create Zone"}
              </Button>
            </div>
          </div>
        )}

        {/* Zones list */}
        <div className="rounded-xl border border-border">
          <div className="border-b bg-muted/30 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Active Zones</span>
              <Badge variant="outline">{zones.length}</Badge>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : zones.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <MapPin className="mx-auto mb-2 size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No delivery zones yet.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Create a zone to enable delivery in your area.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/20"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{zone.name}</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          zone.isActive ? "border-green-300 text-green-700" : "text-muted-foreground",
                        )}
                      >
                        {zone.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {!zone.zonePolygon && (
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                          Fallback
                        </Badge>
                      )}
                    </div>
                    <div className="mt-0.5 flex gap-4 text-xs text-muted-foreground">
                      <span>Fee: KES {zone.deliveryFee}</span>
                      <span>Min: KES {zone.minimumOrder}</span>
                      <span>ETA: {zone.estimatedTimeMinutes} min</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(zone)}
                      className="size-8 p-0"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete zone "${zone.name}"?`)) {
                          deleteMutation.mutate(zone.id);
                        }
                      }}
                      className="size-8 p-0 text-destructive hover:text-destructive"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SiteShell>
  );
}
