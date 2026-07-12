"use client";

import { Mail, User, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { useCartStore, type CartItem } from "@/store/cart";

interface AttendeeInfoSectionProps {
  items: CartItem[];
}

interface Attendee {
  name: string;
  email: string;
}

// Same basic email shape used elsewhere in checkout validation.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Ticket lines carry metadata.is_ticket; only those collect per-seat attendees. */
function isTicketLine(item: CartItem): boolean {
  return (item.metadata as { is_ticket?: boolean } | undefined)?.is_ticket === true;
}

/** Read any previously-entered attendees back off a line's metadata (persisted). */
function readAttendees(item: CartItem): Attendee[] {
  const raw = (item.metadata as { attendees?: unknown } | undefined)?.attendees;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((a): a is Record<string, unknown> => !!a && typeof a === "object")
    .map((a) => ({ name: String(a.name ?? ""), email: String(a.email ?? "") }));
}

/**
 * AttendeeInfoSection — for event-ticket carts, collects a name + email for each
 * ticket seat and writes them to the ticket line's metadata.attendees array. The
 * inventory service issues one personalised ticket per attendee. It is entirely
 * OPTIONAL and never blocks checkout: leaving it empty falls back to one ticket for
 * the whole quantity under the buyer. attendees is only attached once at least one
 * seat has a name. Mirrors the guest-contact-form input styling.
 */
export function AttendeeInfoSection({ items }: AttendeeInfoSectionProps) {
  const ticketLines = useMemo(() => items.filter(isTicketLine), [items]);
  if (ticketLines.length === 0) return null;

  return (
    <section className="rounded-xl border border-border p-4">
      <div className="mb-1 flex items-center gap-2 text-sm font-medium">
        <Users className="size-4 text-primary" />
        <span>Attendee details</span>
        <span className="text-xs font-normal text-muted-foreground">(optional)</span>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Add a name and email for each ticket and we&apos;ll issue a personalised ticket to every
        attendee. Leave blank to issue all tickets under your account.
      </p>
      <div className="space-y-5">
        {ticketLines.map((line) => (
          <AttendeeLineFields key={line.id} line={line} />
        ))}
      </div>
    </section>
  );
}

function AttendeeLineFields({ line }: { line: CartItem }) {
  const updateItemMetadata = useCartStore((s) => s.updateItemMetadata);
  const seatCount = Math.max(1, line.quantity);

  // Seed seat state from any previously-entered attendees so values survive
  // navigating away from and back to checkout.
  const [seats, setSeats] = useState<Attendee[]>(() => {
    const existing = readAttendees(line);
    return Array.from({ length: seatCount }, (_, i) => existing[i] ?? { name: "", email: "" });
  });

  const persist = (next: Attendee[]) => {
    // Attach only filled seats (name required); when none are filled we clear the
    // key so the backend keeps its buyer-fallback behaviour.
    const filled = next
      .map((s) => ({ name: s.name.trim(), email: s.email.trim() }))
      .filter((s) => s.name !== "");
    updateItemMetadata(line.id, { attendees: filled.length > 0 ? filled : undefined });
  };

  const update = (index: number, patch: Partial<Attendee>) => {
    setSeats((prev) => {
      const next = prev.map((s, i) => (i === index ? { ...s, ...patch } : s));
      persist(next);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{line.name}</p>
      {seats.map((seat, i) => {
        const emailInvalid = seat.email.trim() !== "" && !EMAIL_RE.test(seat.email.trim());
        return (
          <div key={i} className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Attendee {i + 1}
            </p>
            <div className="relative">
              <User className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                placeholder="Full name"
                value={seat.name}
                onChange={(e) => update(i, { name: e.target.value })}
                className="min-h-[44px] pl-10"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email address"
                value={seat.email}
                onChange={(e) => update(i, { email: e.target.value })}
                className="min-h-[44px] pl-10"
                aria-invalid={emailInvalid}
              />
            </div>
            {emailInvalid && (
              <p className="text-xs text-destructive">Enter a valid email address.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
