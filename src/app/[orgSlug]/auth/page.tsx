"use client";

import { Suspense } from "react";

import { ShieldCheckIcon } from "lucide-react";

import { buildSignupUrl } from "@/lib/auth/api";
import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";

function AuthPageContent() {
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);
  const redirectToSSO = useAuthStore((s) => s.redirectToSSO);

  const handleSignup = () => {
    if (typeof window !== "undefined") {
      window.location.href = buildSignupUrl(window.location.href);
    }
  };

  return (
    <SiteShell>
      <div className="flex min-h-[60vh] items-center justify-center py-12">
        <div className="mx-auto w-full max-w-md px-4">
          <div className="space-y-6 rounded-3xl border border-border bg-card p-8 text-center shadow-xl">
            <div className="mx-auto h-20 w-20 overflow-hidden rounded-full bg-muted/10">
              <ShieldCheckIcon className="m-4 h-12 w-12 text-brand-emphasis" aria-hidden />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to continue ordering</p>
            {error ? <span className="text-sm font-medium text-destructive">{error}</span> : null}

            <div className="space-y-4">
              <Button
                type="button"
                className="w-full justify-center gap-2"
                onClick={() => redirectToSSO()}
                disabled={status === "loading"}
              >
                <ShieldCheckIcon className="size-4" />
                {status === "loading" ? "Redirecting to SSO..." : "Sign in with BengoBox"}
              </Button>

              <p className="text-xs text-muted-foreground">
                Your BengoBox account gives you access to ordering, loyalty rewards, and more.
              </p>

              <Button
                type="button"
                variant="outline"
                className="w-full justify-center"
                onClick={handleSignup}
                disabled={status === "loading"}
              >
                Create New Account
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Need help? Contact your cafe or visit our{" "}
              <a href="https://theurbanloftcafe.com/contact" className="font-semibold text-primary">
                support page
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
