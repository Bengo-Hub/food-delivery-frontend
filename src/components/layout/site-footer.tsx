import Link from "next/link";

import { brand } from "@/config/brand";

const footerLinks = [
  { href: "/auth", label: "Sign in" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/cookies", label: "Cookies" },
  { href: "/status", label: "Status" },
];

import { useTenantBranding } from "@/providers/branding-provider";

export function SiteFooter() {
  const { tenant } = useTenantBranding();
  const tenantName = tenant?.orgName || tenant?.name || "Urban Loft Cafe";

  return (
    <footer className="hidden border-t border-border bg-card/80 py-10 md:block">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div>
          <p>
            All Rights Reserved. {tenantName} &copy; {new Date().getFullYear()}.
          </p>
          <a
            href="https://codevertexitsolutions.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-primary transition-colors mt-1"
          >
            Powered by <span className="font-semibold text-primary">Codevertex IT Solutions</span>
          </a>
        </div>
        <nav className="flex flex-wrap gap-4">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={{ pathname: link.href }}
              className="hover:text-brand-emphasis"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
