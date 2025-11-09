import Link from "next/link";

export function SiteFooter(): JSX.Element {
  return (
    <footer className="border-t border-slate-200 bg-white/80 py-10 dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 text-sm text-slate-500 dark:text-slate-400 md:flex-row md:items-center md:justify-between">
        <p>&copy; {new Date().getFullYear()} BengoBox Urban Café. All rights reserved.</p>
        <nav className="flex flex-wrap gap-4">
          <Link href="/privacy" className="hover:text-brand-emphasis">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-brand-emphasis">
            Terms
          </Link>
          <Link href="/cookies" className="hover:text-brand-emphasis">
            Cookies
          </Link>
          <Link href="/status" className="hover:text-brand-emphasis">
            Status
          </Link>
        </nav>
      </div>
    </footer>
  );
}
