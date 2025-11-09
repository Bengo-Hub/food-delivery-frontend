"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/primitives/button";
import { Input, Textarea } from "@/components/primitives/input";
import { cn } from "@/lib/utils";

const contactSchema = z.object({
  name: z.string().min(2, "Please enter at least 2 characters."),
  email: z.string().email("Please provide a valid email address."),
  company: z.string().optional(),
  message: z.string().min(12, "Tell us a little more about your request."),
});

type ContactRequest = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactRequest>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      message: "",
    },
  });

  const onSubmit = async (values: ContactRequest) => {
    setStatus("submitting");
    try {
      // Placeholder request – replace with baseapi call when the backend endpoint is ready.
      await new Promise((resolve) => setTimeout(resolve, 800));
      setStatus("success");
      reset();
    } catch (error) {
      console.error("Failed to submit contact form", error);
      setStatus("error");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft dark:border-slate-800 dark:bg-slate-900/70"
    >
      <div>
        <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
          Name
        </label>
        <Input id="name" autoComplete="name" placeholder="Your name" {...register("name")} />
        {errors.name ? (
          <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
          Email
        </label>
        <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" {...register("email")} />
        {errors.email ? (
          <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="company" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
          Company (optional)
        </label>
        <Input id="company" autoComplete="organization" placeholder="Your cafe or organisation" {...register("company")} />
      </div>

      <div>
        <label htmlFor="message" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
          How can we help?
        </label>
        <Textarea id="message" placeholder="Share a bit about your needs, timeline, or current tooling." {...register("message")} />
        {errors.message ? (
          <p className="mt-1 text-xs text-red-500">{errors.message.message}</p>
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <p
          className={cn(
            "text-xs font-medium",
            status === "success" ? "text-emerald-600" : status === "error" ? "text-red-500" : "text-slate-500",
          )}
        >
          {status === "success"
            ? "Thanks! Our team will reach out soon."
            : status === "error"
              ? "Something went wrong. Try again in a moment."
              : "We respond within one business day."}
        </p>
        <Button type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? (
            <>
              <Loader2Icon className="mr-2 size-4 animate-spin" aria-hidden />
              Sending…
            </>
          ) : (
            "Send message"
          )}
        </Button>
      </div>
    </form>
  );
}

