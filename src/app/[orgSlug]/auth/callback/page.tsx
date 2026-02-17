"use client";

import { Suspense, useEffect } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { GoogleIcon } from "@/components/icons/google";
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
  const state = searchParams?.get("state");
  const oauthError = searchParams?.get("error");
  const completeGoogleOAuth = useAuthStore((state) => state.completeGoogleOAuth);
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (oauthError) return;
    if (!code) {
      router.replace(orgRoute(orgSlug, "/auth"));
      return;
    }
    void completeGoogleOAuth({ code, state });
  }, [code, state, oauthError, completeGoogleOAuth, router, orgSlug]);

  useEffect(() => {
    if (status === "authenticated" && user) {
      // Redirect to profile completion if critical info is missing
      if (!user.phone) {
        router.replace(orgRoute(orgSlug, "/profile"));
        return;
      }

      // Ordering frontend is customer-facing. Redirect staff/rider roles to their owning
      // services (cafe website / logistics) so we avoid duplicating those UIs here.
      if (userHasRole(user, ["staff", "admin", "superuser"])) {
        const cafeUrl =
          process.env.NEXT_PUBLIC_CAFE_WEBSITE_URL ?? "https://theurbanloftcafe.com";
        // preserve return_url where possible
        window.location.href = cafeUrl;
        return;
      }

      if (userHasRole(user, ["rider"])) {
        const logisticsUrl =
          process.env.NEXT_PUBLIC_LOGISTICS_UI_URL ?? "https://logistics.codevertexitsolutions.com";
        window.location.href = logisticsUrl;
        return;
      }

      if (userHasRole(user, ["customer"])) {
        router.replace(orgRoute(orgSlug, "/dashboard/customer"));
        return;
      }

      router.replace(orgRoute(orgSlug, "/profile"));
    }
  }, [status, user, router, orgSlug]);

  if (oauthError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <GoogleIcon className="size-8 text-destructive" />
        <h1 className="text-2xl font-semibold text-foreground">Google sign-in failed</h1>
        <p className="text-muted-foreground">
          {oauthError === "access_denied"
            ? "You denied the permissions requested by Google. Please try again."
            : "We were unable to complete your Google sign-in."}
        </p>
        <Button onClick={() => router.replace(orgRoute(orgSlug, "/auth"))} variant="outline">
          Return to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <GoogleIcon className="size-8 text-brand-emphasis" />
      <h1 className="text-2xl font-semibold text-foreground">Completing Google sign-in…</h1>
      <p className="text-muted-foreground">
        Hold on while we secure your session and apply your organization permissions.
      </p>
      <p className="text-xs text-muted-foreground">Status: {status}</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
