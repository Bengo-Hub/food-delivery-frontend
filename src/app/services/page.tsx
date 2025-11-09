import { Columns3Icon, ConciergeBellIcon, CreditCardIcon, RadioTowerIcon } from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/primitives/button";
import { brand } from "@/config/brand";

const offerings = [
  {
    title: "Ordering & loyalty suite",
    description:
      "Menu management, loyalty balances, personalized promos, and cart orchestration backed by the orders domain.",
    icon: <ConciergeBellIcon className="size-6 text-brand-emphasis" aria-hidden />,
    backendReference: "Aligned with backend sprint 3 – Orders & Cart.",
  },
  {
    title: "Realtime delivery operations",
    description:
      "Live order timelines, rider hand-off, proof-of-delivery capture, and WebSocket/SSE updates powered by fulfilment services.",
    icon: <RadioTowerIcon className="size-6 text-brand-emphasis" aria-hidden />,
    backendReference: "Aligned with backend sprint 5 – Fulfilment & Dispatch.",
  },
  {
    title: "Cafe dashboards & analytics",
    description:
      "Kitchen display queues, menu scheduling, and snapshot analytics with data surfaced from cafe operations modules.",
    icon: <Columns3Icon className="size-6 text-brand-emphasis" aria-hidden />,
    backendReference: "Aligned with backend sprint 7 – Admin Console & Analytics.",
  },
  {
    title: "Treasury & payments visibility",
    description:
      "Customer checkout flows, payout visibility, and settlement timelines integrated via the treasury service APIs.",
    icon: <CreditCardIcon className="size-6 text-brand-emphasis" aria-hidden />,
    backendReference: "Aligned with backend sprint 4 – Payments Core.",
  },
];

export default function ServicesPage() {
  return (
    <SiteShell>
      <section className="border-b border-slate-200 bg-brand-muted/50 py-16 dark:border-slate-800 dark:bg-brand-dark/20">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 text-center">
          <span className="inline-flex items-center justify-center rounded-full bg-brand-emphasis/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-brand-emphasis">
            Services
          </span>
          <h1 className="text-4xl font-semibold text-slate-900 dark:text-white md:text-5xl">
            Platform capabilities for every stakeholder.
          </h1>
          <p className="mx-auto max-w-3xl text-base text-slate-600 dark:text-slate-300">
            {brand.shortName} delivers a SaaS-ready experience with configurable branding, per-tenant menus, and
            shared infrastructure. Each service is coordinated with the backend roadmap to guarantee parity across
            clients.
          </p>
          <div className="flex justify-center gap-3">
            <Button asChild size="lg">
              <a href="/contact">Book a demo</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 dark:bg-slate-950">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 md:grid-cols-2">
          {offerings.map((offering) => (
            <article
              key={offering.title}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
            >
              <div className="mb-5 inline-flex size-12 items-center justify-center rounded-2xl bg-brand-muted">
                {offering.icon}
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{offering.title}</h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{offering.description}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-brand-emphasis">
                {offering.backendReference}
              </p>
            </article>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}

