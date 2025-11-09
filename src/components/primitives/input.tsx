import { forwardRef } from "react";

import { cn } from "@/lib/utils";

type InputProps = React.ComponentPropsWithoutRef<"input">;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = "text", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm transition-all duration-150 placeholder:text-slate-400 focus-visible:border-brand-emphasis focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emphasis focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-offset-slate-950",
        className,
      )}
      {...props}
    />
  );
});

type TextareaProps = React.ComponentPropsWithoutRef<"textarea">;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[9rem] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-all duration-150 placeholder:text-slate-400 focus-visible:border-brand-emphasis focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emphasis focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-offset-slate-950",
        className,
      )}
      {...props}
    />
  );
});

