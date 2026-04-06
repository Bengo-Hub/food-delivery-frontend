"use client";

import { Mail, Phone, User } from "lucide-react";

import { Input } from "@/components/ui/input";

interface GuestContactFormProps {
  email: string;
  phone: string;
  name: string;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSignIn: () => void;
}

export function GuestContactForm({
  email,
  phone,
  name,
  onEmailChange,
  onPhoneChange,
  onNameChange,
  onSignIn,
}: GuestContactFormProps) {
  return (
    <section className="rounded-xl border border-border p-4">
      <h2 className="mb-3 text-sm font-medium">Contact Information</h2>
      <div className="space-y-3">
        <div className="relative">
          <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Email address *"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className="min-h-[44px] pl-10"
          />
        </div>
        <div className="relative">
          <Phone className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            type="tel"
            placeholder="Phone number (optional)"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            className="min-h-[44px] pl-10"
          />
        </div>
        <div className="relative">
          <User className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="min-h-[44px] pl-10"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          We&apos;ll use this to send your order confirmation and delivery updates.{" "}
          <button onClick={onSignIn} className="font-medium text-primary hover:underline">
            Sign in instead
          </button>
        </p>
      </div>
    </section>
  );
}
