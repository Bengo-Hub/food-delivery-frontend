import Link from "next/link";

import { Clock3Icon, MapPinIcon, SmartphoneIcon } from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/primitives/button";
import { brand } from "@/config/brand";

const features = [
  {
    title: "Curated cafés, anytime",
    description: "Discover seasonal menus, loyalty rewards, and localized offers across Busia and beyond.",
    icon: <MapPinIcon className="size-6 text-brand-emphasis" aria-hidden />,
  },
  {
    title: "Realtime delivery tracking",
    description: "Follow your rider on the map with accurate ETAs, proof of delivery, and proactive updates.",
    icon: <Clock3Icon className="size-6 text-brand-emphasis" aria-hidden />,
  },
  {
    title: "Offline-ready experiences",
    description: "Continue browsing, carting, and checking out even when connectivity drops in the field.",
    icon: <SmartphoneIcon className="size-6 text-brand-emphasis" aria-hidden />,
  },
];

export default function HomePage() {
  return (
    <SiteShell className="bg-gradient-to-b from-brand-muted/60 via-white to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
      <div className="flex-1">
        <section className="relative overflow-hidden py-24">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center rounded-full bg-brand-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
                {brand.shortName} Platform
              </span>
              <h1 className="text-4xl font-semibold leading-tight text-slate-900 dark:text-white md:text-5xl">
                {brand.tagline}
              </h1>
              <p className="max-w-xl text-lg text-slate-600 dark:text-slate-300">
                {brand.description}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link href="/menu">Start an order</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/riders/signup">Become a rider</Link>
                </Button>
                <Button variant="ghost" size="lg" asChild>
                  <Link href="/merchants/signup">Launch merchant SaaS</Link>
                </Button>
              </div>
            </div>
            <div className="flex h-full items-center justify-center">
              <div className="relative grid aspect-[3/4] w-full max-w-sm place-items-center overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#f36a0c33,transparent_60%)]" aria-hidden />
                <div className="relative flex h-full w-full flex-col justify-between p-6">
                  <header className="flex items-center justify-between text-sm text-slate-500">
                    <span>{brand.shortName}</span>
                    <span>ETA 18 min</span>
                  </header>
                  <div className="space-y-3 text-slate-900 dark:text-white">
                    <p className="text-lg font-semibold">Rider en route</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Track your delivery, tip riders, and manage preferences with a single tap.
                    </p>
                  </div>
                  <footer className="flex items-center justify-between rounded-2xl bg-brand text-white px-4 py-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide">Order</p>
                      <p className="text-base font-semibold">#A9X4</p>
                    </div>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs">Follow</span>
                  </footer>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="border-t border-slate-200 bg-white py-20 dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-brand-muted">
                  {feature.icon}
                </div>
                <h2 className="mb-2 text-2xl font-semibold text-slate-900 dark:text-white">{feature.title}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="border-t border-slate-200 bg-brand-surface/60 py-20 dark:border-slate-800 dark:bg-brand-dark/20">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 md:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">Verified rider network</h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Submit KYC details, upload your bike documents, and activate deliveries once the operations team
                verifies your profile. Only verified riders receive assignments, in-app navigation, and treasury-backed payouts.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>• National ID, proof of residency, and recent profile photo</li>
                <li>• Motorbike logbook or lease agreement plus insurance document</li>
                <li>• Safety and customer care onboarding before your first shift</li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button size="sm" asChild>
                  <Link href="/riders/signup">Start rider onboarding</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth#rider">Rider sign in</Link>
                </Button>
              </div>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">SaaS merchant workspace</h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Roll out branded storefronts, manage menus, and invite cafe staff from a single portal. Staff logins
                inherit your permissions and billing while treasury services reconcile payouts automatically.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>• Capture store locations and opening hours per outlet</li>
                <li>• Invite staff with role-based access to kitchen, rider, or finance tools</li>
                <li>• Configure look &amp; feel tokens that will sync from backend admin preferences</li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button size="sm" asChild>
                  <Link href="/merchants/signup">Create merchant account</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/merchants/staff-portal">Staff portal</Link>
                </Button>
              </div>
            </article>
          </div>
        </section>
        {/* Admin note intentionally omitted from public landing. Admin tools are accessed post sign-in. */}
      </div>
    </SiteShell>
  );
}
