"use client";

import { Suspense, useEffect } from "react";

import { Loader2 } from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";
import { useAuthStore } from "@/store/auth";
import { useParams, useSearchParams } from "next/navigation";

/**
 * Auth page: no standalone form. Immediately redirects to SSO (OIDC + PKCE).
 * All login entry points should land here or trigger redirectToSSO(); this page
 * just redirects with optional returnTo from query. Passes org slug as tenant for token/tenant sync.
 */
function AuthPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const redirectToSSO = useAuthStore((s) => s.redirectToSSO);
  const orgSlug = params?.orgSlug as string | undefined;

  useEffect(() => {
    const returnTo = searchParams?.get("redirectTo") ?? undefined;
    redirectToSSO(returnTo, orgSlug);
  }, [redirectToSSO, searchParams, orgSlug]);

  return (
    <SiteShell>
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">Redirecting to sign in…</p>
      </div>
    </SiteShell>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  );
}
