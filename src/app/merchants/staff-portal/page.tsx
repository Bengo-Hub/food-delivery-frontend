import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";

export default function StaffPortalPage() {
  return (
    <SiteShell>
      <section className="border-b border-slate-200 bg-brand-muted/50 py-16 dark:border-slate-800 dark:bg-brand-dark/20">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 text-center">
          <h1 className="text-4xl font-semibold text-slate-900 dark:text-white md:text-5xl">Staff portal sign in</h1>
          <p className="text-base text-slate-600 dark:text-slate-300">
            Use the invitation email sent by your merchant administrator. Staff accounts inherit the permissions
            configured for your role.
          </p>
        </div>
      </section>

      <section className="bg-white py-16 dark:bg-slate-950">
        <div className="mx-auto w-full max-w-md px-4">
          <form className="space-y-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft dark:border-slate-800 dark:bg-slate-900/70">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
                Work email
              </label>
              <Input id="email" name="email" type="email" placeholder="you@merchant.com" required />
            </div>
            <div>
              <label htmlFor="portalCode" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
                Portal access code
              </label>
              <Input id="portalCode" name="portalCode" type="password" placeholder="6-digit code" required />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Codes are generated for each invitation and can be reset by merchant administrators.
              </p>
            </div>
            <div>
              <label htmlFor="remember" className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
                <input id="remember" name="remember" type="checkbox" className="rounded border-slate-300 text-brand focus:ring-brand-emphasis" />
                Remember this device
              </label>
            </div>
            <Button type="submit">Sign in</Button>
          </form>
        </div>
      </section>
    </SiteShell>
  );
}

