"use client";

import { useEffect, useRef } from "react";

import { useAuthStore } from "@/store/auth";
import { useSubscriptionStore } from "@/store/subscription";
import type { SubscriptionInfo } from "@/lib/auth/subscription";
import { fetchSubscriptionInfo } from "@/lib/auth/subscription";

export function useSubscription() {
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const subscriptionInfo = useAuthStore((s) => s.subscriptionInfo);
  const setSubscriptionInfo = useAuthStore((s) => s.setSubscriptionInfo);

  const subStore = useSubscriptionStore();

  const tenantSlug =
    (user as any)?.tenant_slug as string | undefined;
  const isPlatformOwner = !!(user as any)?.is_platform_owner || tenantSlug === "codevertex";
  const isServiceCharge = (user as any)?.billing_mode === "service_charge";
  const isDemo = !!(user as any)?.is_demo || tenantSlug === "codevertex-demo";

  useEffect(() => {
    if (status !== "authenticated" || !session?.accessToken || !user) return;

    const slug = tenantSlug ?? "";
    if (slug) {
      useSubscriptionStore.getState().loadFromIDB(slug);
    }
  }, [status, session?.accessToken, user, tenantSlug]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.accessToken || !user) return;
    if (subscriptionInfo !== undefined) return;

    setSubscriptionInfo(null);

    const tenantId = (user as any).tenant_id as string | undefined;
    const slug = tenantSlug ?? "";

    if (!tenantId || isPlatformOwner) {
      const platformInfo = {
        status: "active",
        planCode: "enterprise",
        planName: "Enterprise",
        features: [],
        limits: {},
      };
      setSubscriptionInfo(platformInfo as any);
      useSubscriptionStore.getState().setFromRaw(
        { plan: "ENTERPRISE", status: "ACTIVE", features: [], limits: {} },
        slug,
      );
      return;
    }

    const tenant = (user as any).tenant;
    if (tenant?.subscription_status) {
      const quickInfo = {
        status: (tenant.subscription_status ?? "none").toLowerCase(),
        planCode: tenant.subscription_plan ?? "",
        planName: tenant.subscription_plan ?? "",
        features: tenant.tier_limits ? [] : [],
        limits: tenant.tier_limits ?? {},
        trialEndsAt: tenant.subscription_expires_at,
        currentPeriodEnd: tenant.subscription_expires_at,
      };
      setSubscriptionInfo(quickInfo as any);
      useSubscriptionStore.getState().setFromRaw(
        {
          plan: tenant.subscription_plan ?? null,
          status: tenant.subscription_status ?? null,
          expiresAt: tenant.subscription_expires_at ?? null,
          features: [],
          limits: tenant.tier_limits ?? {},
        },
        slug,
      );

      fetchSubscriptionInfo(tenantId, slug, session.accessToken)
        .then((info) => {
          if (!info) return;
          setSubscriptionInfo(info as any);
          useSubscriptionStore.getState().setFromRaw(
            {
              plan: info.planCode,
              status: info.status,
              expiresAt: info.currentPeriodEnd ?? info.trialEndsAt ?? null,
              features: info.features,
              limits: info.limits,
            },
            slug,
          );
        })
        .catch(() => {});
      return;
    }

    fetchSubscriptionInfo(tenantId, slug, session.accessToken)
      .then((info) => {
        const resolved = info ?? { status: "none", planCode: "", planName: "", features: [], limits: {} };
        setSubscriptionInfo(resolved as any);
        useSubscriptionStore.getState().setFromRaw(
          {
            plan: resolved.planCode || null,
            status: resolved.status || null,
            expiresAt: (resolved as any).currentPeriodEnd ?? (resolved as any).trialEndsAt ?? null,
            features: resolved.features,
            limits: resolved.limits,
          },
          slug,
        );
      })
      .catch(() =>
        setSubscriptionInfo({ status: "none", planCode: "", planName: "", features: [], limits: {} } as any),
      );
  }, [status, session?.accessToken, user, subscriptionInfo, setSubscriptionInfo, tenantSlug, isPlatformOwner]);

  // Refresh subscription on app resume after 5+ minutes away
  const lastHiddenAt = useRef<number | null>(null);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const REFRESH_AFTER_MS = 5 * 60 * 1000;

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        lastHiddenAt.current = Date.now();
        return;
      }
      if (document.visibilityState === "visible" && lastHiddenAt.current !== null) {
        const awayMs = Date.now() - lastHiddenAt.current;
        lastHiddenAt.current = null;
        if (awayMs >= REFRESH_AFTER_MS) {
          const token = useAuthStore.getState().session?.accessToken;
          const u = useAuthStore.getState().user;
          const tenantId = (u as Record<string, unknown> | null)?.tenant_id as string | undefined;
          const slug = (u as Record<string, unknown> | null)?.tenant_slug as string | undefined;
          if (token && tenantId && slug) {
            fetchSubscriptionInfo(tenantId, slug, token)
              .then((info) => {
                if (!info) return;
                useAuthStore.getState().setSubscriptionInfo(info as unknown as Record<string, unknown>);
                useSubscriptionStore.getState().setFromRaw(
                  {
                    plan: info.planCode,
                    status: info.status,
                    expiresAt: info.currentPeriodEnd ?? info.trialEndsAt ?? null,
                    features: info.features,
                    limits: info.limits,
                  },
                  slug,
                );
              })
              .catch(() => {});
          }
        }
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const info = subscriptionInfo as SubscriptionInfo | null | undefined;
  const subStatus = info?.status ?? null;

  return {
    info,
    status: subStatus,
    plan: info?.planCode ?? null,
    isActive: subStatus === "active" || subStatus === "trial" || isServiceCharge || isDemo,
    isPastDue: subStatus === "past_due" || subStatus === "suspended",
    isExpired: subStatus === "expired" || subStatus === "cancelled",
    needsSubscription: subStatus === "none" && !isServiceCharge && !isDemo,
    isLoading: subscriptionInfo === null || subscriptionInfo === undefined,
    isPlatformOwner,
    isServiceCharge,
    isDemo,
    hasFeature: (code: string) => info?.features?.includes(code) ?? false,
    getLimit: (key: string) => info?.limits?.[key] ?? Infinity,
    store: subStore,
  };
}
