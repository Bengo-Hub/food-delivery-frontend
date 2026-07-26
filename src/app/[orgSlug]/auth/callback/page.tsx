"use client";

import { Suspense, useEffect, useRef } from "react";

import { SSOCallbackError } from "@bengo-hub/shared-ui-lib/auth";
import { CheckCircle2, Loader2, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { userHasPermission, userHasRole } from "@/lib/auth/permissions";
import { consumeState } from "@/lib/auth/pkce";
import { orgRoute } from "@/lib/routes";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useAuthStore } from "@/store/auth";
import { useOutletFilterStore } from "@/store/outlet-filter";
import { ORDERING_SELECTED_OUTLET_KEY } from "@/app/[orgSlug]/auth/select-outlet/page";

// The stored return URL was captured BEFORE the SSO hop. If the user switched
// organisation mid-login, its slug is stale — re-point the first path segment
// at the org the token was actually issued for. Cross-origin values are dropped.
function sanitizedReturnTo(raw: string | null, orgSlug: string): string | null {
  if (!raw) return null;
  try {
    const url = raw.startsWith("http") ? new URL(raw) : new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    const segments = url.pathname.split("/");
    if (segments[1] && segments[1] !== orgSlug) segments[1] = orgSlug;
    return segments.join("/") + url.search + url.hash;
  } catch {
    return null;
  }
}

function AuthCallbackContent() {
  const router = useRouter();
  const orgSlug = useOrgSlug();
  const searchParams = useSearchParams();
  const code = searchParams?.get("code");
  const oauthError = searchParams?.get("error");
  const oauthErrorDescription = searchParams?.get("error_description");
  const handleSSOCallback = useAuthStore((s) => s.handleSSOCallback);
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const error = useAuthStore((s) => s.error);
  const hasStarted = useRef(false);

  // Step 1: Exchange code for tokens and sync user (pass orgSlug so fetchProfile has tenant)
  useEffect(() => {
    if (oauthError || !code || hasStarted.current) return;
    hasStarted.current = true;

    // Verify CSRF state parameter
    const urlState = searchParams?.get("state");
    const storedState = consumeState();
    if (urlState && storedState && urlState !== storedState) {
      console.error("CSRF state mismatch — possible attack");
      router.replace(orgRoute(orgSlug, "/auth"));
      return;
    }

    const callbackUrl = `${window.location.origin}${window.location.pathname}`;
    void handleSSOCallback(code, callbackUrl, orgSlug);
  }, [code, oauthError, handleSSOCallback, orgSlug, searchParams, router]);

  // Step 2: Once synced and authenticated, redirect to the right destination
  useEffect(() => {
    if (status !== "authenticated" || !user) return;

    // Allow brief time for the user to see the confirmation
    const timer = setTimeout(() => {
      // Read sso_return_to early — must be captured before any redirect clears it.
      // Sanitized: if the user switched organisation mid-login the stored URL
      // still carries the old slug.
      const returnTo = typeof window !== "undefined"
        ? sanitizedReturnTo(sessionStorage.getItem("sso_return_to"), orgSlug) ?? orgRoute(orgSlug, "/")
        : orgRoute(orgSlug, "/");

      // --- Outlet context setup ---
      // Only applies to staff/admin users who need outlet context for backend calls.
      if (
        userHasRole(user, ["staff", "admin", "superuser"]) &&
        !userHasRole(user, ["customer", "member"])
      ) {
        const storedOutlet = typeof window !== "undefined"
          ? localStorage.getItem(ORDERING_SELECTED_OUTLET_KEY)
          : null;

        if (!storedOutlet) {
          // Check for JWT outlet_id (non-HQ users auto-preselect)
          const jwtOutletId = (user as any)?.outlet_id || (user as any)?.outletId;
          const isHqUser = (user as any)?.is_hq_user || (user as any)?.isHqUser;

          if (jwtOutletId && !isHqUser) {
            // Auto-preselect from JWT — no selector needed
            useOutletFilterStore.getState().selectOutlet({
              id: jwtOutletId,
              code: (user as any)?.outlet_code ?? '',
              name: (user as any)?.outlet_code ?? '',
              useCase: (user as any)?.outlet_use_case,
            });
            localStorage.setItem(ORDERING_SELECTED_OUTLET_KEY, jwtOutletId);
          } else if (isHqUser) {
            // HQ user: redirect to outlet selector before proceeding
            sessionStorage.removeItem("sso_return_to");
            const next = returnTo !== orgRoute(orgSlug, "/")
              ? `?returnTo=${encodeURIComponent(returnTo)}`
              : '';
            router.replace(orgRoute(orgSlug, `/auth/select-outlet${next}`));
            return;
          }
        }
      }
      // --- End outlet context setup ---

      // Check if profile needs completion — skip for privileged roles (they use SSO profile page)
      if (!user.phone && !userHasRole(user, ["staff", "admin", "superuser", "member"])) {
        const profileUrl = orgRoute(orgSlug, "/profile");
        const dest = returnTo !== orgRoute(orgSlug, "/")
          ? `${profileUrl}?next=${encodeURIComponent(returnTo)}`
          : profileUrl;
        sessionStorage.removeItem("sso_return_to");
        router.replace(dest);
        return;
      }

      sessionStorage.removeItem("sso_return_to");

      // Route based on role
      if (userHasRole(user, ["superuser"])) {
        // Platform owner (superuser on the codevertex org) → platform dashboard
        if (orgSlug === "codevertex") {
          router.replace(orgRoute(orgSlug, "/platform"));
        } else {
          router.replace(orgRoute(orgSlug, "/dashboard/staff"));
        }
        return;
      }

      if (userHasRole(user, ["staff", "admin"])) {
        router.replace(orgRoute(orgSlug, "/dashboard/staff"));
        return;
      }

      if (userHasRole(user, ["rider"])) {
        const logisticsUrl = process.env.NEXT_PUBLIC_LOGISTICS_UI_URL ?? "https://logistics.codevertexafrica.com";
        window.location.href = `${logisticsUrl}/${orgSlug}`;
        return;
      }

      // Member with any ordering staff permission → staff dashboard.
      // Checks both the JWT-level permissions (from SSO) since ordering-backend
      // service-level RBAC is not available yet at callback time (JIT sync pending).
      if (
        userHasRole(user, ["member"]) &&
        userHasPermission(user, [
          "ordering.orders.manage",
          "ordering.orders.add",
          "ordering.orders.read",      // can view all orders (not own-only)
          "ordering.orders.change",    // can update any order status
          "ordering.catalog.manage",
          "ordering.catalog.change",
          "ordering.operations.manage",
        ], "or")
      ) {
        router.replace(orgRoute(orgSlug, "/dashboard/staff"));
        return;
      }

      // Customer / member without staff permissions → original destination or home
      router.replace(returnTo);
    }, 1500);

    return () => clearTimeout(timer);
  }, [status, user, router, orgSlug]);

  // Error state from SSO redirect (?error=...) or from the auth store
  // (token exchange / profile sync failure). The shared card explains
  // wrong-organisation denials properly; "Sign in again" restarts the SSO
  // flow (/auth auto-triggers redirectToSSO with fresh PKCE + authorize).
  if (oauthError || (status === "error" && error)) {
    return (
      <SSOCallbackError
        error={oauthError}
        errorDescription={oauthError ? oauthErrorDescription : error}
        orgSlug={orgSlug}
        lastKnownTenant={typeof window !== "undefined" ? localStorage.getItem("tenantSlug") : null}
        onRetry={() => {
          hasStarted.current = false;
          router.replace(orgRoute(orgSlug, "/auth"));
        }}
        onSwitchTenant={(slug) => router.replace(orgRoute(slug, "/auth"))}
      />
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
