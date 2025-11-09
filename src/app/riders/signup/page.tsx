"use client";

import { useState } from "react";

import Link from "next/link";

import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/primitives/button";
import { Input, Textarea } from "@/components/primitives/input";

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function RiderSignupPage() {
  const [status, setStatus] = useState<SubmitState>("idle");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");

    // Placeholder network call – integrate with backend onboarding service when available.
    window.setTimeout(() => {
      setStatus("success");
    }, 800);
  };

  return (
    <SiteShell>
      <section className="border-b border-slate-200 bg-brand-muted/60 py-16 dark:border-slate-800 dark:bg-brand-dark/20">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 text-center">
          <h1 className="text-4xl font-semibold text-slate-900 dark:text-white md:text-5xl">
            Rider onboarding
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300">
            Complete the form below with accurate details. Our compliance team reviews every submission to keep
            customers and riders safe. Only verified riders will receive delivery assignments.
          </p>
        </div>
      </section>

      <section className="bg-white py-16 dark:bg-slate-950">
        <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 lg:grid-cols-[1.1fr_0.9fr]">
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft dark:border-slate-800 dark:bg-slate-900/70"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="fullName" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
                  Full name
                </label>
                <Input id="fullName" name="fullName" placeholder="Jane Doe" required />
              </div>
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
                  Email
                </label>
                <Input id="email" name="email" type="email" placeholder="jane@example.com" required />
              </div>
              <div>
                <label htmlFor="phone" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
                  Phone number (WhatsApp preferred)
                </label>
                <Input id="phone" name="phone" type="tel" placeholder="+254 7xx xxx xxx" required />
              </div>
              <div>
                <label htmlFor="city" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
                  Operating city / town
                </label>
                <Input id="city" name="city" placeholder="Busia" required />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="bikeMake" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
                  Bike make &amp; model
                </label>
                <Input id="bikeMake" name="bikeMake" placeholder="Boxer 150" required />
              </div>
              <div>
                <label htmlFor="plateNumber" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
                  Registration number
                </label>
                <Input id="plateNumber" name="plateNumber" placeholder="KDA 123A" required />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="experience" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
                  Riding experience
                </label>
                <Textarea
                  id="experience"
                  name="experience"
                  placeholder="Tell us about your delivery experience, certifications, and availability."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="nationalId" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
                  National ID / Passport
                </label>
                <Input id="nationalId" name="nationalId" type="file" accept="image/*,.pdf" required />
              </div>
              <div>
                <label htmlFor="residency" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
                  Proof of residency
                </label>
                <Input id="residency" name="residency" type="file" accept="image/*,.pdf" required />
              </div>
              <div>
                <label htmlFor="bikePhoto" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
                  Bike photo (side profile)
                </label>
                <Input id="bikePhoto" name="bikePhoto" type="file" accept="image/*" required />
              </div>
              <div>
                <label htmlFor="insurance" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
                  Insurance / logbook
                </label>
                <Input id="insurance" name="insurance" type="file" accept="image/*,.pdf" required />
              </div>
            </div>

            <div>
              <label htmlFor="googleOauth" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
                Quick sign up (Google OAuth)
              </label>
              <Button variant="outline" type="button" asChild className="mt-2">
                <a href="/api/auth/google?role=rider">Continue with Google</a>
              </Button>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                We use Google OAuth for account verification only. You will still need to upload KYC documents.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-brand-muted/50 px-4 py-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
              <AlertCircleIcon className="size-4 text-brand-emphasis" aria-hidden />
              <span>
                By submitting, you confirm that the information provided is accurate. Supplying falsified documents
                will lead to permanent suspension.
              </span>
            </div>

            <div className="flex items-center justify-between">
              <Button type="submit" disabled={status === "submitting"}>
                {status === "submitting" ? "Submitting…" : "Submit for review"}
              </Button>
              {status === "success" ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <CheckCircle2Icon className="size-4" aria-hidden />
                  Documents received. We will reach out within 24 hours.
                </span>
              ) : null}
            </div>
          </form>

          <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">What happens next?</h2>
            <ol className="list-decimal space-y-3 pl-5 text-sm text-slate-600 dark:text-slate-300">
              <li>Operations will validate your KYC documents and contact references if provided.</li>
              <li>Attend onboarding sessions covering customer service, safety, and app usage.</li>
              <li>
                Once verified, access the rider app to view scheduled shifts and accept tasks in real time.
              </li>
            </ol>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Need help? Email{" "}
              <a href="mailto:riders@bengobox.com" className="font-medium text-brand-emphasis">
                riders@bengobox.com
              </a>{" "}
              or call the regional hotline shared after verification.
            </p>
            <Button variant="ghost" asChild>
              <Link href="/riders">Back to rider overview</Link>
            </Button>
          </aside>
        </div>
      </section>
    </SiteShell>
  );
}

