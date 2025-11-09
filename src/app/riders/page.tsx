import Link from "next/link";

import { BadgeCheckIcon, BikeIcon, FileCheck2Icon, ShieldCheckIcon } from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/primitives/button";
import { brand } from "@/config/brand";

const onboardingSteps = [
  {
    title: "Submit your details",
    description:
      "Complete a short form with personal information, bike details, and emergency contacts so the operations team can review your profile.",
    icon: <FileCheck2Icon className="size-6 text-brand-emphasis" aria-hidden />,
  },
  {
    title: "Upload required documents",
    description:
      "Provide national ID, proof of residency, motorbike logbook or lease agreement, insurance, and a clear bike photo.",
    icon: <BadgeCheckIcon className="size-6 text-brand-emphasis" aria-hidden />,
  },
  {
    title: "Verification & activation",
    description:
      "Training and safety briefings are scheduled once your documents pass review. Only verified riders receive delivery tasks.",
    icon: <ShieldCheckIcon className="size-6 text-brand-emphasis" aria-hidden />,
  },
];

export default function RidersPage() {
  return (
    <SiteShell>
      <section className="border-b border-slate-200 bg-brand-muted/50 py-16 dark:border-slate-800 dark:bg-brand-dark/20">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 text-center">
          <span className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-emphasis/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-brand-emphasis">
            <BikeIcon className="size-4" aria-hidden />
            Rider network
          </span>
          <h1 className="text-4xl font-semibold text-slate-900 dark:text-white md:text-5xl">
            Deliver for {brand.shortName} and earn with confidence.
          </h1>
          <p className="mx-auto max-w-3xl text-base text-slate-600 dark:text-slate-300">
            Verified riders enjoy realtime task assignments, automated payouts, and priority support. We take KYC
            seriously to protect customers, merchants, and our fleet community.
          </p>
          <div className="flex justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/riders/signup">Start rider onboarding</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/auth#rider">Rider sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 dark:bg-slate-950">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 md:grid-cols-3">
          {onboardingSteps.map((step) => (
            <article
              key={step.title}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
            >
              <div className="mb-5 inline-flex size-12 items-center justify-center rounded-2xl bg-brand-muted">
                {step.icon}
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{step.title}</h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-brand-surface/50 py-16 dark:border-slate-800 dark:bg-brand-dark/20">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl space-y-4">
            <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">Document checklist</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Upload clear scans or photos. Submissions are encrypted in transit, reviewed by compliance, and stored
              securely according to Kenyan data protection standards.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <li>• National ID or passport (front and back)</li>
            <li>• Proof of residency (utility bill or tenancy agreement, less than 3 months old)</li>
            <li>• Motorbike logbook/lease and insurance certificate</li>
            <li>• High-resolution bike photo (side view) and recent rider selfie</li>
            <li>• Optional: Certificate of good conduct or rider training badges</li>
          </ul>
        </div>
      </section>
    </SiteShell>
  );
}

