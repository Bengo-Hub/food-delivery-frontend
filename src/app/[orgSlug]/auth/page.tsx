"use client";

import { Suspense, useCallback, useEffect, useState } from "react";

import { Fingerprint, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { SiteShell } from "@/components/layout/site-shell";
import { useBiometric } from "@/hooks/use-biometric";
import { orgRoute } from "@/lib/routes";
import { useAuthStore } from "@/store/auth";
import { useParams, useSearchParams } from "next/navigation";

/**
 * Auth page: no standalone form. Immediately redirects to SSO (OIDC + PKCE).
 * All login entry points should land here or trigger redirectToSSO(); this page
 * just redirects with optional returnTo from query. Passes org slug as tenant for token/tenant sync.
 * If a stored email + biometric credential exist, shows a fingerprint shortcut before redirecting.
 */
function AuthPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectToSSO = useAuthStore((s) => s.redirectToSSO);
  const hydrateFromWebAuthn = useAuthStore((s) => s.hydrateFromWebAuthn);
  const orgSlug = params?.orgSlug as string | undefined;

  const [storedEmail, setStoredEmail] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const email = localStorage.getItem("sso_last_email");
      const biometricRegistered = localStorage.getItem("pwa_biometric_registered") === "true";
      if (email && biometricRegistered) {
        setStoredEmail(email);
      }
    }
  }, []);

  const handleBiometricSuccess = useCallback(
    async (tokens: { accessToken: string; refreshToken: string; expiresIn: number }) => {
      try {
        await hydrateFromWebAuthn(tokens, orgSlug);
        router.replace(orgRoute(orgSlug ?? "", "/"));
      } catch {
        // fall through — biometric hook already sets error state
      }
    },
    [hydrateFromWebAuthn, orgSlug, router]
  );

  const { isSupported, hasRegisteredCredential, isLoading, error, authenticate } = useBiometric({
    onAuthSuccess: handleBiometricSuccess,
  });

  const showBiometric = !!storedEmail && isSupported && hasRegisteredCredential;

  useEffect(() => {
    if (showBiometric) return; // don't auto-redirect if biometric shortcut is shown
    const returnTo = searchParams?.get("redirectTo") ?? undefined;
    redirectToSSO(returnTo, orgSlug);
  }, [showBiometric, redirectToSSO, searchParams, orgSlug]);

  const handleBiometricClick = useCallback(() => {
    if (storedEmail) {
      authenticate(storedEmail, orgSlug);
    }
  }, [authenticate, storedEmail, orgSlug]);

  const handleUseSSOInstead = useCallback(() => {
    const returnTo = searchParams?.get("redirectTo") ?? undefined;
    redirectToSSO(returnTo, orgSlug);
  }, [redirectToSSO, searchParams, orgSlug]);

  return (
    <SiteShell>
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-12">
        {showBiometric ? (
          <>
            <button
              type="button"
              onClick={handleBiometricClick}
              disabled={isLoading}
              className="flex flex-col items-center gap-3 rounded-xl border border-input bg-background px-10 py-8 shadow-sm transition hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
              aria-label="Sign in with biometrics"
            >
              {isLoading ? (
                <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
              ) : (
                <Fingerprint className="h-10 w-10 text-primary" aria-hidden />
              )}
              <span className="text-sm font-medium text-foreground">
                {isLoading ? "Verifying…" : "Sign in with biometrics"}
              </span>
              {storedEmail && (
                <span className="text-xs text-muted-foreground">{storedEmail}</span>
              )}
            </button>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <button
              type="button"
              onClick={handleUseSSOInstead}
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Use a different account
            </button>
          </>
        ) : (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">Redirecting to sign in…</p>
          </>
        )}
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
