"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { PlusIcon, TrashIcon } from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/primitives/button";
import { Input, Textarea } from "@/components/primitives/input";

type SubmitState = "idle" | "submitting" | "success" | "error";

type StaffMember = {
  key: string;
  name: string;
  email: string;
  role: string;
};

const generateKey = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto && crypto.randomUUID()) ||
  Math.random().toString(36).slice(2);

const defaultStaffMember = (): StaffMember => ({
  key: generateKey(),
  name: "",
  email: "",
  role: "",
});

export default function MerchantSignupPage() {
  const [status, setStatus] = useState<SubmitState>("idle");
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([defaultStaffMember()]);

  const staffCount = useMemo(() => staffMembers.length, [staffMembers]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");

    window.setTimeout(() => {
      setStatus("success");
    }, 900);
  };

  const updateStaffMember = (key: string, field: keyof StaffMember, value: string) => {
    setStaffMembers((prev) =>
      prev.map((member) => (member.key === key ? { ...member, [field]: value } : member)),
    );
  };

  const removeStaffMember = (key: string) => {
    setStaffMembers((prev) => (prev.length === 1 ? prev : prev.filter((member) => member.key !== key)));
  };

  const addStaffMember = () => {
    setStaffMembers((prev) => [...prev, defaultStaffMember()]);
  };

  return (
    <SiteShell>
      <section className="border-b border-slate-200 bg-brand-muted/60 py-16 dark:border-slate-800 dark:bg-brand-dark/20">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 text-center">
          <h1 className="text-4xl font-semibold text-slate-900 dark:text-white md:text-5xl">
            Merchant workspace signup
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300">
            Share company details and invite core staff. Invitations will be sent once the account is approved by our
            onboarding team.
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
                <label htmlFor="businessName" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
                  Business name
                </label>
                <Input id="businessName" name="businessName" placeholder="Urban Café Collective" required />
              </div>
              <div>
                <label htmlFor="businessEmail" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
                  Business email
                </label>
                <Input id="businessEmail" name="businessEmail" type="email" placeholder="ops@urbancafe.com" required />
              </div>
              <div>
                <label htmlFor="contactPerson" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
                  Primary contact person
                </label>
                <Input id="contactPerson" name="contactPerson" placeholder="Mary Atieno" required />
              </div>
              <div>
                <label htmlFor="contactPhone" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
                  Contact phone
                </label>
                <Input id="contactPhone" name="contactPhone" type="tel" placeholder="+254 7xx xxx xxx" required />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="industry" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
                  Industry / concept
                </label>
                <Input id="industry" name="industry" placeholder="Specialty café, dark kitchen, or multi-brand food hall" />
              </div>
              <div>
                <label htmlFor="locations" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
                  Locations
                </label>
                <Textarea
                  id="locations"
                  name="locations"
                  placeholder="List outlet names and addresses. e.g. Market Street Café – Busia CBD, Riverside Café – Kisumu"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-3xl border border-dashed border-slate-300 bg-brand-muted/40 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
              <p className="font-semibold uppercase tracking-wide text-brand-emphasis">
                Staff invitations ({staffCount})
              </p>
              {staffMembers.map((member, index) => (
                <div key={member.key} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/80 md:grid-cols-[1.2fr_1.2fr_auto]">
                  <Input
                    name={`staff[${index}][name]`}
                    placeholder="Full name"
                    value={member.name}
                    onChange={(event) => updateStaffMember(member.key, "name", event.target.value)}
                    required
                  />
                  <Input
                    type="email"
                    name={`staff[${index}][email]`}
                    placeholder="Email"
                    value={member.email}
                    onChange={(event) => updateStaffMember(member.key, "email", event.target.value)}
                    required
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      name={`staff[${index}][role]`}
                      placeholder="Role (e.g. Manager)"
                      value={member.role}
                      onChange={(event) => updateStaffMember(member.key, "role", event.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeStaffMember(member.key)}
                      className="inline-flex size-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-red-500 hover:text-red-500 dark:border-slate-700 dark:text-slate-300"
                      aria-label="Remove staff member"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="ghost" size="sm" onClick={addStaffMember} className="inline-flex items-center gap-2 self-start">
                <PlusIcon className="size-4" />
                Add staff member
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="logo" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
                  Brand logo (optional)
                </label>
                <Input id="logo" name="logo" type="file" accept="image/*" />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  If omitted, the platform uses the default shared logo until admins update settings via backend.
                </p>
              </div>
              <div>
                <label htmlFor="attachment" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
                  Business registration (optional)
                </label>
                <Input id="attachment" name="attachment" type="file" accept="image/*,.pdf" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button type="submit" disabled={status === "submitting"}>
                {status === "submitting" ? "Submitting…" : "Submit merchant application"}
              </Button>
              {status === "success" ? (
                <p className="text-xs font-medium text-emerald-600">
                  Application received. Expect onboarding instructions within one business day.
                </p>
              ) : null}
            </div>
          </form>

          <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">What we verify</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Business registration or operating license (where available).</li>
              <li>Proof of banking / treasury account for payouts.</li>
              <li>Menus and dietary information readiness for catalog import.</li>
              <li>Support channels for customer escalations.</li>
            </ul>
            <p>
              After approval you can manage theme tokens, brand assets, and outlet-specific settings directly inside the
              admin dashboard.
            </p>
            <Button variant="ghost" asChild>
              <Link href="/merchants">Back to merchant overview</Link>
            </Button>
          </aside>
        </div>
      </section>
    </SiteShell>
  );
}

