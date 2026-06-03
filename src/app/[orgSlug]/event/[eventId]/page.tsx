"use client";

import { fetchPublicEvent, type PublicEvent } from "@/lib/api/events";
import { useCartStore } from "@/store/cart";
import { CalendarDays, Loader2, MapPin, Minus, Plus, Share2, Ticket } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function formatMoney(amount: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency }).format(amount);
}

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PublicEventPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params?.orgSlug as string;
  const eventId = params?.eventId as string;

  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [qty, setQty] = useState<Record<string, number>>({});
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchPublicEvent(orgSlug, eventId)
      .then((e) => {
        if (active) {
          setEvent(e);
          setError(false);
        }
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [orgSlug, eventId]);

  const setTierQty = (tierId: string, delta: number, max: number) =>
    setQty((q) => {
      const next = Math.max(0, Math.min(max, (q[tierId] ?? 0) + delta));
      return { ...q, [tierId]: next };
    });

  const total = useMemo(() => {
    if (!event) return 0;
    return event.tiers.reduce((sum, t) => sum + (qty[t.tier_id] ?? 0) * t.price, 0);
  }, [event, qty]);

  const totalSeats = useMemo(
    () => Object.values(qty).reduce((a, b) => a + b, 0),
    [qty],
  );

  function handleAddToCart() {
    if (!event || totalSeats === 0) return;
    for (const tier of event.tiers) {
      const n = qty[tier.tier_id] ?? 0;
      if (n <= 0) continue;
      addItem({
        // composite id keeps each tier a distinct cart line
        id: `${event.id}::${tier.tier_id}`,
        name: `${event.name} — ${tier.name}`,
        price: tier.price,
        quantity: n,
        inventorySku: event.sku,
        notes: `Event ticket · ${tier.name}`,
        // Carried through cart → guest checkout → order item → issuance consumer (tier accuracy).
        metadata: { is_ticket: true, tier_id: tier.tier_id, tier_name: tier.name, event_item_id: event.id },
        ...(event.image_url ? { image: event.image_url } : {}),
      });
    }
    router.push(`/${orgSlug}/cart`);
  }

  async function handleShare() {
    const url = typeof window !== "undefined" ? `${window.location.origin}/${orgSlug}/event/${eventId}` : "";
    const shareUrl = event?.share_url || url;
    if (navigator.share) {
      try {
        await navigator.share({ title: event?.name ?? "Event", url: shareUrl });
        return;
      } catch {
        /* fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Event link copied to clipboard");
    } catch {
      /* noop */
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <Ticket className="h-12 w-12 opacity-30" />
        <p>Event not found or no longer available.</p>
        <Link href={`/${orgSlug}`} className="text-primary hover:underline text-sm">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-muted aspect-[16/9]">
        {event.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.image_url} alt={event.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Ticket className="h-16 w-16 text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* Title + meta + share */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{event.name}</h1>
          {event.event_start_at && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              {formatDate(event.event_start_at)}
              {event.event_end_at ? ` – ${formatDate(event.event_end_at)}` : ""}
            </p>
          )}
          {event.venue && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {event.venue}
            </p>
          )}
        </div>
        <button
          onClick={handleShare}
          className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          <Share2 className="h-4 w-4" /> Share
        </button>
      </div>

      {event.description && (
        <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">{event.description}</p>
      )}

      {/* Ticket tiers */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Tickets</h2>
        {event.sold_out && (
          <div className="p-3 rounded-xl bg-red-500/10 text-red-700 dark:text-red-400 text-sm font-medium">
            This event is sold out.
          </div>
        )}
        {event.tiers.length === 0 && !event.sold_out && (
          <p className="text-sm text-muted-foreground">No ticket tiers available yet.</p>
        )}
        {event.tiers.map((tier) => {
          const n = qty[tier.tier_id] ?? 0;
          const disabled = tier.sold_out || tier.remaining <= 0;
          return (
            <div key={tier.tier_id} className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{tier.name}</p>
                <p className="text-sm text-primary font-medium">{formatMoney(tier.price)}</p>
                <p className="text-xs text-muted-foreground">
                  {disabled ? "Sold out" : `${tier.remaining} left`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setTierQty(tier.tier_id, -1, tier.remaining)}
                  disabled={disabled || n === 0}
                  className="h-9 w-9 rounded-lg border border-border flex items-center justify-center disabled:opacity-40 hover:bg-muted transition-colors"
                  aria-label="Decrease"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-6 text-center font-semibold">{n}</span>
                <button
                  onClick={() => setTierQty(tier.tier_id, 1, tier.remaining)}
                  disabled={disabled || n >= tier.remaining}
                  className="h-9 w-9 rounded-lg border border-border flex items-center justify-center disabled:opacity-40 hover:bg-muted transition-colors"
                  aria-label="Increase"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky checkout bar */}
      {totalSeats > 0 && (
        <div className="sticky bottom-4 z-10">
          <button
            onClick={handleAddToCart}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg hover:bg-primary/90 transition-colors"
          >
            <span>
              {totalSeats} ticket{totalSeats !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-2">
              {formatMoney(total)} <Ticket className="h-5 w-5" />
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
