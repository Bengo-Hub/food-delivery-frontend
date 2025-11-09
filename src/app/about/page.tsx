import { HeartHandshakeIcon, LeafIcon, SparklesIcon, UsersIcon } from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";
import { brand } from "@/config/brand";

const pillars = [
  {
    title: "Customer-first moments",
    description:
      "Localized experiences, loyalty insights, and intuitive ordering journeys across web, PWA, and mobile clients.",
    icon: <HeartHandshakeIcon className="size-6 text-brand-emphasis" aria-hidden />,
  },
  {
    title: "Empowered cafe crews",
    description:
      "Kitchen and cafe staff stay in sync with live order queues, stock signals, and menu scheduling sourced from backend orchestration.",
    icon: <SparklesIcon className="size-6 text-brand-emphasis" aria-hidden />,
  },
  {
    title: "Resilient rider ops",
    description:
      "Dispatch-ready rider tools with earnings dashboards, proof of delivery, and treasury-backed payouts.",
    icon: <UsersIcon className="size-6 text-brand-emphasis" aria-hidden />,
  },
  {
    title: "Grounded in community",
    description:
      "Purpose-built for Busia and the broader region with Swahili/English support, offline resilience, and locally inspired menus.",
    icon: <LeafIcon className="size-6 text-brand-emphasis" aria-hidden />,
  },
];

const journey = [
  {
    phase: "Foundations",
    description:
      "Sprint 0 defines shared design tokens, data contracts, and service alignment with the backend foundation (see backend sprint 0).",
  },
  {
    phase: "Ordering & Loyalty",
    description:
      "Customer menus, carts, and loyalty balances align with the backend orders and promo roadmap (backend sprint 3).",
  },
  {
    phase: "Realtime fulfilment",
    description:
      "Live tracking, rider telemetry, and notification hooks depend on the backend fulfilment and notifications sprints (backend sprint 5).",
  },
  {
    phase: "Cafe & Admin intelligence",
    description:
      "Cafe dashboards, admin analytics, and treasury insights surface data from the backend operations roadmap (backend sprint 7).",
  },
];

export default function AboutPage() {
  return (
    <SiteShell>
      <section className="border-b border-slate-200 bg-brand-muted/40 py-16 dark:border-slate-800 dark:bg-brand-dark/20">
        <div className="mx-auto w-full max-w-5xl space-y-6 px-4 text-center">
          <span className="inline-flex items-center justify-center rounded-full bg-brand-emphasis/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-brand-emphasis">
            About {brand.shortName}
          </span>
          <h1 className="text-4xl font-semibold text-slate-900 dark:text-white md:text-5xl">
            A unified cafe experience for every channel and partner.
          </h1>
          <p className="mx-auto max-w-3xl text-base text-slate-600 dark:text-slate-300">
            {brand.description} The frontend brings that vision to life with trusted interfaces for customers,
            riders, cafe teams, and administrators—backed by real-time services orchestrated by our backend.
          </p>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 md:grid-cols-2">
          {pillars.map((pillar) => (
            <article
              key={pillar.title}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
            >
              <div className="mb-5 inline-flex size-12 items-center justify-center rounded-2xl bg-brand-muted">
                {pillar.icon}
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{pillar.title}</h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{pillar.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-brand-surface/60 py-16 dark:bg-brand-dark/20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl space-y-4">
            <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">Product journey</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Each frontend milestone is matched with a backend workstream. Follow the roadmap to see how UI
              features align with domain services, events, and integrations.
            </p>
          </div>
          <ol className="space-y-4">
            {journey.map((item) => (
              <li
                key={item.phase}
                className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
              >
                <p className="text-sm font-semibold uppercase tracking-wide text-brand-emphasis">{item.phase}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </SiteShell>
  );
}

