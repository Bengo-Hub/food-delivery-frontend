import { LineChartIcon, MapIcon, SmartphoneIcon } from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";
import { brand } from "@/config/brand";

const deliveryHighlights = [
  {
    title: "Realtime tracking",
    description:
      "Status timelines, map visualisations, and push updates are streamed from fulfilment events in the backend (sprint 5).",
    icon: <MapIcon className="size-6 text-brand-emphasis" aria-hidden />,
  },
  {
    title: "Rider experience",
    description:
      "Riders manage shifts, navigation, and proof-of-delivery from responsive React Native apps that share logic with the web PWA (sprints 5-6).",
    icon: <SmartphoneIcon className="size-6 text-brand-emphasis" aria-hidden />,
  },
  {
    title: "Operational insights",
    description:
      "Dispatch metrics, SLA tracking, and exception alerts surface analytics ingested from backend telemetry (sprint 7).",
    icon: <LineChartIcon className="size-6 text-brand-emphasis" aria-hidden />,
  },
];

export default function DeliveryPage() {
  return (
    <SiteShell>
      <section className="border-b border-slate-200 bg-brand-muted/60 py-16 dark:border-slate-800 dark:bg-brand-dark/20">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 text-center">
          <h1 className="text-4xl font-semibold text-slate-900 dark:text-white md:text-5xl">
            Delivery visibility, built into every screen.
          </h1>
          <p className="mx-auto max-w-3xl text-base text-slate-600 dark:text-slate-300">
            {brand.shortName} unifies rider updates, notification signals, and treasury payouts, ensuring every
            delivery milestone stays in sync across customers, cafes, and administrators.
          </p>
        </div>
      </section>
      <section className="bg-white py-16 dark:bg-slate-950">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 md:grid-cols-3">
          {deliveryHighlights.map((highlight) => (
            <article
              key={highlight.title}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
            >
              <div className="mb-5 inline-flex size-12 items-center justify-center rounded-2xl bg-brand-muted">
                {highlight.icon}
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{highlight.title}</h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{highlight.description}</p>
            </article>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}

