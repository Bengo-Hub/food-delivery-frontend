import { cn } from "@/lib/utils";

import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

type SiteShellProps = {
  children: React.ReactNode;
  className?: string;
  mainClassName?: string;
};

export function SiteShell({ children, className, mainClassName }: SiteShellProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen flex-col bg-white text-slate-900 transition-colors duration-150 ease-out dark:bg-slate-950 dark:text-slate-100",
        className,
      )}
    >
      <SiteHeader />
      <main className={cn("flex-1", mainClassName)}>{children}</main>
      <SiteFooter />
    </div>
  );
}

