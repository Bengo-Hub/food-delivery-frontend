"use client";

import { Suspense, useEffect, useRef } from "react";

import { CheckCircle2, Loader2, RefreshCw, ShieldCheckIcon, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { userHasRole } from "@/lib/auth/permissions";
import { orgRoute } from "@/lib/routes";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useAuthStore } from "@/store/auth";

function AuthCallbackContent() {
  const router = useRouter();
  const orgSlug = useOrgSlug();
  const searchParams = useSearchParams();
  const code = searchParams?.get("code");
  const oauthError = searchParams?.get("error");
  const handleSSOCallback = useAuthStore((s) => s.handleSSOCallback);
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const error = useAuthStore((s) => s.error);
  const hasStarted = useRef(false);

  // Step 1: Exchange code for tokens and sync user (pass orgSlug so fetchProfile has tenant)
  useEffect(() => {
    if (oauthError || !code || hasStarted.current) return;
    hasStarted.current = true;

    const callbackUrl = `${window.location.origin}${window.location.pathname}`;
    void handleSSOCallback(code, callbackUrl, orgSlug);
  }, [code, oauthError, handleSSOCallback, orgSlug]);

  // Subscription enforcement: redirect to subscribe if subscription_required
  useEffect(() => {
    if (status === 'subscription_required') {
      const subsUrl = process.env.NEXT_PUBLIC_SUBSCRIPTIONS_UI_URL || 'https://pricing.codevertexitsolutions.com';
      window.location.href = `${subsUrl}/subscribe`;
    }
  }, [status]);

  // Step 2: Once synced and authenticated, redirect to the right destination
  useEffect(() => {
    if (status !== "authenticated" || !user) return;

    // Allow brief time for the user to see the confirmation
    const timer = setTimeout(() => {
      // Check if profile needs completion
      if (!user.phone) {
        router.replace(orgRoute(orgSlug, "/profile"));
        return;
      }

      // Route based on role
      if (userHasRole(user, ["staff", "admin", "superuser"])) {
        const cafeUrl = process.env.NEXT_PUBLIC_CAFE_WEBSITE_URL ?? "https://theurbanloftcafe.com";
        window.location.href = cafeUrl;
        return;
      }

      if (userHasRole(user, ["rider"])) {
        const logisticsUrl = process.env.NEXT_PUBLIC_LOGISTICS_UI_URL ?? "https://logistics.codevertexitsolutions.com";
        window.location.href = logisticsUrl;
        return;
      }

      // Prefer dashboard over landing so navbar shows authenticated state
      let returnTo = typeof window !== "undefined"
        ? sessionStorage.getItem("sso_return_to") ?? orgRoute(orgSlug, "/dashboard/customer")
        : orgRoute(orgSlug, "/dashboard/customer");
      const landingPath = orgRoute(orgSlug, "/");
      if (returnTo === landingPath || returnTo === `/${orgSlug}` || returnTo === `/${orgSlug}/`) {
        returnTo = orgRoute(orgSlug, "/dashboard/customer");
      }
      sessionStorage.removeItem("sso_return_to");
      router.replace(returnTo);
    }, 1500);

    return () => clearTimeout(timer);
  }, [status, user, router, orgSlug]);

  // Error state from SSO redirect
  if (oauthError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <ShieldCheckIcon className="size-8 text-destructive" />
        <h1 className="text-2xl font-semibold text-foreground">Sign-in failed</h1>
        <p className="text-muted-foreground">
          {oauthError === "access_denied"
            ? "You denied the permissions requested. Please try again."
            : "We were unable to complete your sign-in."}
        </p>
        <Button onClick={() => router.replace(orgRoute(orgSlug, "/auth"))} variant="outline">
          Return to sign in
        </Button>
      </div>
    );
  }

  // Auth store error
  if (status === "error" && error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <ShieldCheckIcon className="size-8 text-destructive" />
        <h1 className="text-2xl font-semibold text-foreground">Something went wrong</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button
          onClick={() => {
            hasStarted.current = false;
            router.replace(orgRoute(orgSlug, "/auth"));
          }}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="size-4" />
          Try again
        </Button>
      </div>
    );
  }

  // Synced - show user confirmation
  if (status === "authenticated" && user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <CheckCircle2 className="size-12 text-green-500" />
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome{user.fullName ? `, ${user.fullName}` : ""}!
        </h1>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
          <User className="size-5 text-brand-emphasis" />
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">{user.email}</p>
            <p className="text-xs capitalize text-muted-foreground">
              {user.roles.join(", ")}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Redirecting you now...</p>
      </div>
    );
  }

  // Default: syncing/loading
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <Loader2 className="size-10 text-brand-emphasis animate-spin" />
      <h1 className="text-2xl font-semibold text-foreground">
        {status === "syncing" ? "Syncing your account..." : "Completing sign-in..."}
      </h1>
      <p className="text-muted-foreground">
        Hold on while we sync your profile and apply your permissions.
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
