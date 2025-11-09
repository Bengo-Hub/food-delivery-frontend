import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";

import { ContactForm } from "@/components/contact/contact-form";
import { SiteShell } from "@/components/layout/site-shell";
import { brand } from "@/config/brand";

export default function ContactPage() {
  return (
    <SiteShell>
      <section className="border-b border-slate-200 bg-brand-muted/50 py-16 dark:border-slate-800 dark:bg-brand-dark/20">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 text-center">
          <span className="inline-flex items-center justify-center rounded-full bg-brand-emphasis/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-brand-emphasis">
            Contact
          </span>
          <h1 className="text-4xl font-semibold text-slate-900 dark:text-white md:text-5xl">
            Let&apos;s build the next chapter of {brand.shortName}.
          </h1>
          <p className="mx-auto max-w-3xl text-base text-slate-600 dark:text-slate-300">
            Share what you&apos;re working on—whether it&apos;s rolling out a white-label delivery experience,
            onboarding cafes, or launching rider fleets. Our team responds within one business day.
          </p>
        </div>
      </section>

      <section className="bg-white py-16 dark:bg-slate-950">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 lg:grid-cols-[1.1fr_0.9fr]">
          <ContactForm />
          <aside className="space-y-6 rounded-3xl border border-slate-200 bg-brand-surface/40 p-8 shadow-sm dark:border-slate-800 dark:bg-brand-dark/30">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Reach our team</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                We tailor onboarding for multi-tenant cafe groups, independent riders, and technology partners.
                Let us know how we can help.
              </p>
            </div>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                <MailIcon className="mt-1 size-4 text-brand-emphasis" aria-hidden />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Email</p>
                  <a href={`mailto:${brand.support.email}`} className="hover:text-brand-emphasis">
                    {brand.support.email}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                <PhoneIcon className="mt-1 size-4 text-brand-emphasis" aria-hidden />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Phone</p>
                  <a href={`tel:${brand.support.phone.replace(/\s+/g, "")}`} className="hover:text-brand-emphasis">
                    {brand.support.phone}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                <MapPinIcon className="mt-1 size-4 text-brand-emphasis" aria-hidden />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Headquarters</p>
                  <p>{brand.support.headquarters}</p>
                </div>
              </li>
            </ul>
          </aside>
        </div>
      </section>
    </SiteShell>
  );
}

