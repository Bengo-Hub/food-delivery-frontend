"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { LogInIcon, ShieldIcon, UserCogIcon, UsersIcon } from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { useAuthStore } from "@/store/auth";

type AuthTab = "rider" | "merchant" | "staff" | "admin";

const tabs: Array<{ id: AuthTab; label: string; icon: React.ReactNode; description: string }> = [
  {
    id: "rider",
    label: "Rider",
    icon: <ShieldIcon className="size-4" aria-hidden />,
    description: "Verify with Google or email before accessing rider tasks.",
  },
  {
    id: "merchant",
    label: "Merchant admin",
    icon: <UsersIcon className="size-4" aria-hidden />,
    description: "Manage outlets, menus, and staff invitations.",
  },
  {
    id: "staff",
    label: "Staff portal",
    icon: <LogInIcon className="size-4" aria-hidden />,
    description: "Use your invitation code to access assigned tools.",
  },
  {
    id: "admin",
    label: "Admin",
    icon: <UserCogIcon className="size-4" aria-hidden />,
    description: "Platform and tenant administration (invitation only).",
  },
];

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<AuthTab>("rider");

  return (
    <SiteShell>
      <section className="border-b border-slate-200 bg-brand-muted/60 py-16 dark:border-slate-800 dark:bg-brand-dark/20">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 text-center">
          <h1 className="text-4xl font-semibold text-slate-900 dark:text-white md:text-5xl">Sign in</h1>
          <p className="text-base text-slate-600 dark:text-slate-300">
            Choose the role that matches your invitation. Riders must be verified. Admin accounts are created by a
            superuser; no public admin sign up is available.
          </p>
        </div>
      </section>

      <section className="bg-white py-16 dark:bg-slate-950">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4">
          <div className="flex flex-wrap justify-center gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "border-brand-emphasis bg-brand-emphasis/10 text-brand-emphasis"
                    : "border-slate-200 text-slate-600 hover:border-brand-emphasis hover:text-brand-emphasis dark:border-slate-700 dark:text-slate-300"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            {tabs.find((tab) => tab.id === activeTab)?.description}
          </p>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft dark:border-slate-800 dark:bg-slate-900/70">
            {activeTab === "rider" ? <RiderSignIn /> : null}
            {activeTab === "merchant" ? <MerchantSignIn /> : null}
            {activeTab === "staff" ? <StaffSignIn /> : null}
            {activeTab === "admin" ? <AdminSignIn /> : null}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function RiderSignIn() {
  const loginWithEmail = useAuthStore((s) => s.loginWithEmail);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const router = useRouter();

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    await loginWithEmail({ email, password, role: "rider" });
    router.push("/");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Rider sign in</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Verified riders can sign in with Google OAuth or their registered email address. Need to join?{" "}
          <Link href="/riders/signup" className="font-semibold text-brand-emphasis">
            Start onboarding
          </Link>
          .
        </p>
      </div>
      <Button variant="outline" className="w-full justify-center" onClick={() => loginWithGoogle("rider")}>
        Continue with Google
      </Button>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label htmlFor="riderEmail" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
            Email
          </label>
          <Input id="riderEmail" name="email" type="email" placeholder="you@example.com" required />
        </div>
        <div>
          <label htmlFor="riderPassword" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
            Password
          </label>
          <Input id="riderPassword" name="password" type="password" placeholder="Your password" required />
        </div>
        <Button type="submit" className="w-full">
          Sign in as rider
        </Button>
      </form>
    </div>
  );
}

function MerchantSignIn() {
  const loginWithEmail = useAuthStore((s) => s.loginWithEmail);
  const router = useRouter();

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    await loginWithEmail({ email, password, role: "merchant" });
    router.push("/merchants");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Merchant admin</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Merchant administrators manage outlets, menus, and payouts. New to the platform?{" "}
          <Link href="/merchants/signup" className="font-semibold text-brand-emphasis">
            Create a merchant account
          </Link>
          .
        </p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label htmlFor="merchantEmail" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
            Email
          </label>
          <Input id="merchantEmail" name="email" type="email" placeholder="ops@merchant.com" required />
        </div>
        <div>
          <label htmlFor="merchantPassword" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
            Password
          </label>
          <Input id="merchantPassword" name="password" type="password" placeholder="Strong password" required />
        </div>
        <div>
          <label htmlFor="workspace" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
            Workspace slug
          </label>
          <Input id="workspace" name="workspace" placeholder="urbancafe" required />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Workspace slugs are created during onboarding and shared with your leadership team.
          </p>
        </div>
        <Button type="submit" className="w-full">
          Sign in as merchant admin
        </Button>
      </form>
    </div>
  );
}

function StaffSignIn() {
  const loginWithEmail = useAuthStore((s) => s.loginWithEmail);
  const router = useRouter();

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const code = String(form.get("code") ?? "");
    await loginWithEmail({ email, password: code, role: "staff" });
    router.push("/merchants");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Staff portal</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Use your invitation email and one-time code shared by your administrator.
        </p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label htmlFor="staffEmail" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
            Email
          </label>
          <Input id="staffEmail" name="email" type="email" placeholder="staff@merchant.com" required />
        </div>
        <div>
          <label htmlFor="staffCode" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
            Invitation code
          </label>
          <Input id="staffCode" name="code" placeholder="6-digit code" required />
        </div>
        <Button type="submit" className="w-full">
          Sign in as staff
        </Button>
      </form>
    </div>
  );
}

function AdminSignIn() {
  const loginWithEmail = useAuthStore((s) => s.loginWithEmail);
  const router = useRouter();

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    await loginWithEmail({ email, password, role: "admin" });
    router.push("/");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Admin sign in</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Admin accounts are created by a superuser (developer). If you need access, ask your platform owner.
        </p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label htmlFor="adminEmail" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
            Email
          </label>
          <Input id="adminEmail" name="email" type="email" placeholder="admin@domain.com" required />
        </div>
        <div>
          <label htmlFor="adminPassword" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
            Password
          </label>
          <Input id="adminPassword" name="password" type="password" placeholder="Strong password" required />
        </div>
        <Button type="submit" className="w-full">
          Sign in as admin
        </Button>
      </form>
    </div>
  );
}

