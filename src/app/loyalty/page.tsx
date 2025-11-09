import { GiftIcon, SparklesIcon, WalletIcon } from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";
import { brand } from "@/config/brand";

const loyaltyBenefits = [
  {
    title: "Unified loyalty wallet",
    description:
      "Customers earn and redeem across channels with balances stored in backend loyalty services (sprint 3).",
    icon: <WalletIcon className="size-6 text-brand-emphasis" aria-hidden />,
  },
  {
    title: "Personalized promos",
    description:
      "Segmentation, auto-applied perks, and referral journeys stay in sync with notification templates (sprint 6).",
    icon: <SparklesIcon className="size-6 text-brand-emphasis" aria-hidden />,
  },
  {
    title: "Partner rewards",
    description:
      "Multi-tenant support allows white-label programs and outlet-specific offers while sharing infrastructure.",
    icon: <GiftIcon className="size-6 text-brand-emphasis" aria-hidden />,
  },
];

export default function LoyaltyPage() {
  return (
    <SiteShell>
      <section className="border-b border-slate-200 bg-brand-muted/50 py-16 dark:border-slate-800 dark:bg-brand-dark/20">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 text-center">
          <h1 className="text-4xl font-semibold text-slate-900 dark:text-white md:text-5xl">
            Build loyalty programs that scale with every cafe.
          </h1>
          <p className="mx-auto max-w-3xl text-base text-slate-600 dark:text-slate-300">
            {brand.shortName} keeps loyalty logic centralized, offering configurable thresholds, cross-sell nudges,
            and treasury-backed redemption flows ready for SaaS distribution.
          </p>
        </div>
      </section>
      <section className="bg-white py-16 dark:bg-slate-950">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 md:grid-cols-3">
          {loyaltyBenefits.map((benefit) => (
            <article
              key={benefit.title}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
            >
              <div className="mb-5 inline-flex size-12 items-center justify-center rounded-2xl bg-brand-muted">
                {benefit.icon}
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{benefit.title}</h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}

