"use client";

import { fetchPublicEvent, type PublicEvent } from "@/lib/api/events";
import { useCartStore } from "@/store/cart";
import { CalendarDays, Clock, Loader2, MapPin, Minus, Plus, Share2, Sparkles, Ticket } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function formatMoney(amount: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-KE", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatTimeRange(start?: string, end?: string) {
  if (!start) return "";
  const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
  const s = new Date(start).toLocaleTimeString("en-KE", opts);
  if (!end) return s;
  return `${s} – ${new Date(end).toLocaleTimeString("en-KE", opts)}`;
}

function slugifyTier(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Guarantee every tier has a unique, stable id (mirrors inventory-api's derivation). Without this,
// tiers with a blank tier_id collapse to one shared quantity and overcharge the buyer.
function normalizeTiers(e: PublicEvent): PublicEvent {
  return {
    ...e,
    tiers: e.tiers.map((t, i) => ({
      ...t,
      tier_id: (t.tier_id && t.tier_id.trim()) || slugifyTier(t.name) || `tier-${i}`,
    })),
  };
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
      .then((e) => { if (active) { setEvent(normalizeTiers(e)); setError(false); } })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [orgSlug, eventId]);

  const setTierQty = (tierId: string, delta: number, max: number) =>
    setQty((q) => ({ ...q, [tierId]: Math.max(0, Math.min(max, (q[tierId] ?? 0) + delta)) }));

  const total = useMemo(
    () => (event ? event.tiers.reduce((sum, t) => sum + (qty[t.tier_id] ?? 0) * t.price, 0) : 0),
    [event, qty],
  );
  const totalSeats = useMemo(() => Object.values(qty).reduce((a, b) => a + b, 0), [qty]);

  function handleAddToCart() {
    if (!event || totalSeats === 0) return;
    for (const tier of event.tiers) {
      const n = qty[tier.tier_id] ?? 0;
      if (n <= 0) continue;
      addItem({
        id: `${event.id}::${tier.tier_id}`,
        name: `${event.name} — ${tier.name}`,
        price: tier.price,
        quantity: n,
        inventorySku: event.sku,
        notes: `Event ticket · ${tier.name}`,
        metadata: { is_ticket: true, tier_id: tier.tier_id, tier_name: tier.name, event_item_id: event.id },
        ...(event.image_url ? { image: event.image_url } : {}),
      });
    }
    router.push(`/${orgSlug}/cart`);
  }

  async function handleShare() {
    const url = typeof window !== "undefined" ? `${window.location.origin}/${orgSlug}/event/${eventId}` : "";
    const shareUrl = event?.share_url || url;
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: event?.name ?? "Event", url: shareUrl }); return; } catch { /* copy */ }
    }
    try { await navigator.clipboard.writeText(shareUrl); alert("Event link copied to clipboard"); } catch { /* noop */ }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3 text-muted-foreground">
        <Ticket className="h-12 w-12 opacity-30" />
        <p>Event not found or no longer available.</p>
        <Link href={`/${orgSlug}`} className="text-primary hover:underline text-sm">Back to home</Link>
      </div>
    );
  }

  const ticketPanel = (
    <div className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-xl shadow-black/5 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border/60">
        <Ticket className="h-4 w-4 text-primary" />
        <h2 className="font-bold tracking-tight">Get Tickets</h2>
      </div>

      <div className="p-4 space-y-3">
        {event.sold_out && (
          <div className="p-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-semibold text-center">
            🎫 This event is sold out
          </div>
        )}
        {event.tiers.length === 0 && !event.sold_out && (
          <p className="text-sm text-muted-foreground py-6 text-center">No ticket tiers available yet.</p>
        )}

        {event.tiers.map((tier) => {
          const n = qty[tier.tier_id] ?? 0;
          const disabled = tier.sold_out || tier.remaining <= 0;
          const lowStock = !disabled && tier.remaining <= 5;
          const selected = n > 0;
          return (
            <div
              key={tier.tier_id}
              className={`group relative rounded-2xl border p-4 transition-all duration-300
                ${selected ? "border-primary/60 bg-primary/5 ring-1 ring-primary/30" : "border-border/60 bg-background/40 hover:border-primary/40"}
                ${disabled ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-foreground truncate">{tier.name}</p>
                  <p className="mt-0.5 text-lg font-extrabold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {formatMoney(tier.price)}
                  </p>
                  {disabled ? (
                    <span className="mt-1 inline-block text-xs font-semibold text-red-500">Sold out</span>
                  ) : lowStock ? (
                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Only {tier.remaining} left
                    </span>
                  ) : (
                    <span className="mt-1 inline-block text-xs text-muted-foreground">{tier.remaining} available</span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setTierQty(tier.tier_id, -1, tier.remaining)}
                    disabled={disabled || n === 0}
                    className="h-9 w-9 rounded-full border border-border flex items-center justify-center disabled:opacity-30 hover:bg-muted hover:scale-105 active:scale-95 transition-all"
                    aria-label="Decrease"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center font-bold tabular-nums">{n}</span>
                  <button
                    onClick={() => setTierQty(tier.tier_id, 1, tier.remaining)}
                    disabled={disabled || n >= tier.remaining}
                    className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 hover:brightness-110 hover:scale-105 active:scale-95 transition-all shadow-sm shadow-primary/30"
                    aria-label="Increase"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order summary + CTA (desktop) */}
      {event.tiers.length > 0 && !event.sold_out && (
        <div className="hidden lg:block border-t border-border/60 p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{totalSeats} ticket{totalSeats !== 1 ? "s" : ""}</span>
            <span className="text-xl font-extrabold">{formatMoney(total)}</span>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={totalSeats === 0}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:brightness-105 active:scale-[0.99] disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed transition-all"
          >
            <Sparkles className="h-4 w-4" />
            {totalSeats === 0 ? "Select tickets" : "Book now"}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative min-h-screen">
      {/* Ambient blurred backdrop from the event image — immersive depth */}
      {event.image_url && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 opacity-30 blur-3xl scale-110"
          style={{ backgroundImage: `url(${event.image_url})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
      )}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-background/60 via-background/90 to-background" />

      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <div className="relative rounded-[1.75rem] overflow-hidden shadow-2xl shadow-black/20 ring-1 ring-white/10 aspect-[16/10] sm:aspect-[21/9]">
          {event.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.image_url} alt={event.name} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-background flex items-center justify-center">
              <Ticket className="h-20 w-20 text-primary/40" />
            </div>
          )}
          {/* Legibility gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />

          {/* Share (floating, glassy) */}
          <button
            onClick={handleShare}
            className="absolute top-4 right-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-sm font-semibold hover:bg-white/25 transition-colors"
          >
            <Share2 className="h-4 w-4" /> Share
          </button>

          {/* Title + meta overlay */}
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-[11px] font-bold uppercase tracking-wider shadow-lg">
              <Sparkles className="h-3 w-3" /> Live Event
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-lg max-w-3xl leading-[1.05]">
              {event.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {event.event_start_at && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm">
                  <CalendarDays className="h-3.5 w-3.5" /> {formatDate(event.event_start_at)}
                </span>
              )}
              {event.event_start_at && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm">
                  <Clock className="h-3.5 w-3.5" /> {formatTimeRange(event.event_start_at, event.event_end_at)}
                </span>
              )}
              {event.venue && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm max-w-full">
                  <MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{event.venue}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="mt-6 lg:mt-8 grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">
          {/* Left: details */}
          <div className="space-y-6 min-w-0">
            {event.description && (
              <section className="rounded-3xl border border-border/60 bg-card/50 backdrop-blur-sm p-5 sm:p-6">
                <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> About this event
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-foreground/80 whitespace-pre-line">
                  {event.description}
                </p>
              </section>
            )}

            <section className="grid sm:grid-cols-2 gap-3">
              {event.event_start_at && (
                <div className="rounded-2xl border border-border/60 bg-card/50 p-4 flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">When</p>
                    <p className="text-sm font-medium">{formatDate(event.event_start_at)}</p>
                    <p className="text-xs text-muted-foreground">{formatTimeRange(event.event_start_at, event.event_end_at)}</p>
                  </div>
                </div>
              )}
              {event.venue && (
                <div className="rounded-2xl border border-border/60 bg-card/50 p-4 flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Where</p>
                    <p className="text-sm font-medium break-words">{event.venue}</p>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Right: sticky ticket panel */}
          <div className="lg:sticky lg:top-6">{ticketPanel}</div>
        </div>
      </div>

      {/* Mobile sticky checkout bar */}
      {totalSeats > 0 && (
        <div className="lg:hidden sticky bottom-0 inset-x-0 z-20 p-3 bg-gradient-to-t from-background via-background/95 to-transparent">
          <button
            onClick={handleAddToCart}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold shadow-xl shadow-primary/30 active:scale-[0.99] transition-transform"
          >
            <span className="flex items-center gap-2"><Ticket className="h-5 w-5" /> {totalSeats} ticket{totalSeats !== 1 ? "s" : ""}</span>
            <span className="flex items-center gap-1.5">{formatMoney(total)} <Sparkles className="h-4 w-4" /></span>
          </button>
        </div>
      )}
    </div>
  );
}
