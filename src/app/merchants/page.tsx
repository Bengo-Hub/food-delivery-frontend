import Link from "next/link";

import { Building2Icon, LayersIcon, UsersIcon } from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/primitives/button";
import { brand } from "@/config/brand";

const highlights = [
  {
    title: "Unified storefronts",
    description:
      "Configure menus, availability, and localized pricing per outlet while keeping loyalty balances in sync across channels.",
    icon: <LayersIcon className="size-6 text-brand-emphasis" aria-hidden />,
  },
  {
    title: "Staff management",
    description:
      "Invite managers, kitchen staff, riders, and finance teams with role-based permissions. Staff authenticate through a dedicated portal.",
    icon: <UsersIcon className="size-6 text-brand-emphasis" aria-hidden />,
  },
  {
    title: "Treasury integration",
    description:
      "Payouts, settlements, and tax summaries sync automatically with the treasury service so finance teams stay audit ready.",
    icon: <Building2Icon className="size-6 text-brand-emphasis" aria-hidden />,
  },
];

export default function MerchantsPage() {
  return (
    <SiteShell>
      <section className="border-b border-slate-200 bg-brand-muted/50 py-16 dark:border-slate-800 dark:bg-brand-dark/20">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 text-center">
          <span className="inline-flex items-center justify-center rounded-full bg-brand-emphasis/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-brand-emphasis">
            Merchant SaaS
          </span>
          <h1 className="text-4xl font-semibold text-slate-900 dark:text-white md:text-5xl">
            Launch your own delivery experience with {brand.shortName}.
          </h1>
          <p className="mx-auto max-w-3xl text-base text-slate-600 dark:text-slate-300">
            Build multi-outlet menus, collaborate with staff, and monitor performance from a single dashboard.
            White-label ready portals make it easy to onboard new branches without writing code.
          </p>
          <div className="flex justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/merchants/signup">Create merchant account</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/merchants/staff-portal">Staff portal</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 dark:bg-slate-950">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 md:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
            >
              <div className="mb-5 inline-flex size-12 items-center justify-center rounded-2xl bg-brand-muted">
                {item.icon}
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{item.title}</h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-brand-surface/50 py-16 dark:border-slate-800 dark:bg-brand-dark/20">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4">
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">Implementation checklist</h2>
          <ul className="grid gap-3 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-2">
            <li>• Define outlet hierarchy and assign default tax / service charge rules per location.</li>
            <li>• Upload brand assets; admin-configured themes will override defaults once backend sync is live.</li>
            <li>• Invite staff with email and role selection (manager, kitchen, finance, rider liaison).</li>
            <li>• Connect payment settlement accounts via treasury onboarding flow.</li>
            <li>• Configure notification templates for customer updates and kitchen alerts.</li>
            <li>• Schedule analytics exports or connect data warehouse integrations.</li>
          </ul>
        </div>
      </section>
    </SiteShell>
  );
}

