"use client";

import Link from "next/link";
import { Suspense } from "react";

import { ShieldCheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { GoogleIcon } from "@/components/icons/google";
import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/ui/button";
import { orgRoute } from "@/lib/routes";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useAuthStore } from "@/store/auth";

function AuthPageContent() {
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);
  const beginGoogleOAuth = useAuthStore((s) => s.beginGoogleOAuth);
  const loginWithEmail = useAuthStore((s) => s.loginWithEmail);
  const router = useRouter();
  const orgSlug = useOrgSlug();

  return (
    <SiteShell>
      <div className="flex min-h-[60vh] items-center justify-center py-12">
        <div className="mx-auto w-full max-w-md px-4">
          <div className="space-y-6 rounded-3xl border border-border bg-card p-8 text-center shadow-xl">
            <div className="mx-auto h-20 w-20 overflow-hidden rounded-full bg-muted/10">
              {/* logo */}
              <ShieldCheckIcon className="m-4 h-12 w-12 text-brand-emphasis" aria-hidden />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to continue ordering</p>
            {error ? <span className="text-sm font-medium text-destructive">{error}</span> : null}

            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center gap-2"
                onClick={() => beginGoogleOAuth({ role: "customer" })}
                disabled={status === "loading"}
              >
                <GoogleIcon className="size-4" />
                Continue with Google
              </Button>
              <div className="relative">
                <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  or
                </div>
                <form
                  className="space-y-3 pt-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget as HTMLFormElement);
                    const email = String(form.get("email") ?? "");
                    // simple demo fallback - use loginWithEmail if available
                    try {
                      await loginWithEmail({ email, password: "", role: "customer" });
                      router.push(orgRoute(orgSlug, "/dashboard/customer"));
                    } catch {
                      // noop - error state stored in auth store
                    }
                  }}
                >
                  {/* small inline email form kept for accessibility */}
                  <div>
                    <label className="sr-only" htmlFor="customerEmail">
                      Email
                    </label>
                    <input
                      id="customerEmail"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      defaultValue="customer@demo.com"
                      required
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Sign in
                  </Button>
                </form>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              New here?{" "}
              <Link href={orgRoute(orgSlug, "/customers/signup")} className="font-semibold text-primary">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}

// NOTE: CustomerSignIn component was removed — a compact login card is rendered instead.

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
