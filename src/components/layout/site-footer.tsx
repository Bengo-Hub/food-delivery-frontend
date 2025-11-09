import Link from "next/link";

import { brand } from "@/config/brand";

const footerLinks = [
  { href: "/riders/signup", label: "Rider onboarding" },
  { href: "/auth", label: "Sign in" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/cookies", label: "Cookies" },
  { href: "/status", label: "Status" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white/80 py-10 dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 text-sm text-slate-500 dark:text-slate-400 md:flex-row md:items-center md:justify-between">
        <div>
          <p>
            &copy; {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>
          <p className="mt-1 text-xs">
            {brand.support.email} · {brand.support.phone} · {brand.support.headquarters}
          </p>
        </div>
        <nav className="flex flex-wrap gap-4">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href as any} className="hover:text-brand-emphasis">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
