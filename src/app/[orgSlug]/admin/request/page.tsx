"use client";

import { useMemo, useState } from "react";

import { MailIcon, StoreIcon } from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brand } from "@/config/brand";

type SubmitState = "idle" | "submitting" | "success";

export default function AdminRequestPage() {
  const [state, setState] = useState<SubmitState>("idle");
  const [org, setOrg] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [usecase, setUsecase] = useState("");

  const body = useMemo(() => {
    const details = [
      `Organization: ${org}`,
      `Contact: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Use case / Notes: ${usecase}`,
    ].join("%0D%0A");
    return `Admin account request for ${brand.shortName}%0D%0A%0D%0A${details}%0D%0A%0D%0ARequested via public portal.`;
  }, [org, name, email, phone, usecase]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState("submitting");
    // Submit via mailto (no backend required yet)
    const to = "codevertexitsolutions@gmail.com";
    const subject = encodeURIComponent("Admin Account Request – Ordering Platform");
    const href = `mailto:${to}?subject=${subject}&body=${body}`;
    window.location.href = href;
    // Fallback acknowledgment
    setTimeout(() => setState("success"), 600);
  };

  return (
    <SiteShell>
      <section className="border-b border-border bg-brand-muted/60 py-16">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 text-center">
          <span className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-emphasis/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-brand-emphasis">
            <StoreIcon className="size-4" aria-hidden />
            Admin request
          </span>
          <h1 className="text-4xl font-semibold text-foreground md:text-5xl">
            Request an admin demo or trial account
          </h1>
          <p className="mx-auto max-w-3xl text-base text-muted-foreground">
            {brand.shortName} is developed and powered by CodeVertex IT Solutions. Submit the form
            below to request a demo or time-limited trial account (upgradeable after the period
            expires).
          </p>
        </div>
      </section>
      <section className="bg-card py-16">
        <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 lg:grid-cols-[1.1fr_0.9fr]">
          <form
            onSubmit={onSubmit}
            className="space-y-5 rounded-3xl border border-border bg-card p-8 shadow-soft"
          >
            <div>
              <label
                htmlFor="org"
                className="block text-xs font-semibold uppercase text-muted-foreground"
              >
                Organization
              </label>
              <Input
                id="org"
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                placeholder="Your Organization"
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-semibold uppercase text-muted-foreground"
                >
                  Contact name
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mary Atieno"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase text-muted-foreground"
                >
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={brand.support.email}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs font-semibold uppercase text-muted-foreground"
                >
                  Phone
                </label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 7xx xxx xxx"
                />
              </div>
              <div>
                <label
                  htmlFor="usecase"
                  className="block text-xs font-semibold uppercase text-muted-foreground"
                >
                  Use case
                </label>
                <Input
                  id="usecase"
                  value={usecase}
                  onChange={(e) => setUsecase(e.target.value)}
                  placeholder="Demo / Trial account request"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Button type="submit" disabled={state === "submitting"}>
                {state === "submitting" ? "Preparing email…" : "Send request"}
              </Button>
              {state === "success" ? (
                <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <MailIcon className="size-4 text-brand-emphasis" aria-hidden />
                  Your email client should be open now. If not, email
                  codevertexitsolutions@gmail.com.
                </span>
              ) : null}
            </div>
          </form>
          <aside className="space-y-4 rounded-3xl border border-border bg-brand-surface/40 p-8 text-sm text-muted-foreground shadow-sm">
            <h2 className="text-2xl font-semibold text-foreground">About the platform</h2>
            <p>
              {brand.shortName} is a multi-business ordering platform for online delivery and
              shipping orders. developed and powered by CodeVertex IT Solutions. Admin accounts are
              intended for organization owners and operations leads.
            </p>
            <p>
              After your trial, you can upgrade to continue access. Staff users (kitchen, riders,
              finance) are invited by admins from within the platform.
            </p>
          </aside>
        </div>
      </section>
    </SiteShell>
  );
}
