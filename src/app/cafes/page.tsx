import { BarChart3Icon, ClipboardListIcon, CookingPotIcon } from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";

const cafeFeatures = [
  {
    title: "Kitchen display & prep queues",
    description:
      "Live order boards, prep timing, and substitution flows draw from the backend cafe operations roadmap (sprint 4).",
    icon: <CookingPotIcon className="size-6 text-brand-emphasis" aria-hidden />,
  },
  {
    title: "Menu & promotion tooling",
    description:
      "Update menus, pricing, and promos with guardrails coordinated through backend catalog and promotions modules (sprint 2).",
    icon: <ClipboardListIcon className="size-6 text-brand-emphasis" aria-hidden />,
  },
  {
    title: "Operations analytics",
    description:
      "Dashboards surface revenue, SLA compliance, and stock signals using data aggregated by backend analytics (sprint 7).",
    icon: <BarChart3Icon className="size-6 text-brand-emphasis" aria-hidden />,
  },
];

export default function CafesPage() {
  return (
    <SiteShell>
      <section className="border-b border-slate-200 bg-brand-muted/40 py-16 dark:border-slate-800 dark:bg-brand-dark/20">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 text-center">
          <h1 className="text-4xl font-semibold text-slate-900 dark:text-white md:text-5xl">
            Cafe dashboards that stay in lockstep with operations.
          </h1>
          <p className="mx-auto max-w-3xl text-base text-slate-600 dark:text-slate-300">
            Provide cafe teams with actionable insights and seamless menu management while the backend enforces
            data integrity, inventory sync, and treasury settlements.
          </p>
        </div>
      </section>
      <section className="bg-white py-16 dark:bg-slate-950">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 md:grid-cols-3">
          {cafeFeatures.map((feature) => (
            <article
              key={feature.title}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
            >
              <div className="mb-5 inline-flex size-12 items-center justify-center rounded-2xl bg-brand-muted">
                {feature.icon}
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{feature.title}</h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}

