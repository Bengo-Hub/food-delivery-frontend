"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useOrgSlug } from "@/providers/org-slug-provider";

// ─── Types ───────────────────────────────────────────────────────────

interface RiderLocation {
  lat: number;
  lng: number;
}

interface OrderEvent {
  type: string;
  timestamp: string;
  message?: string;
}

interface OrderSSEState {
  status: string | null;
  riderLocation: RiderLocation | null;
  eta: string | null;
  events: OrderEvent[];
  connected: boolean;
  error: string | null;
}

// ─── Hook ────────────────────────────────────────────────────────────

const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1/";
const NORMALISED_BASE_URL = DEFAULT_BASE_URL.endsWith("/") ? DEFAULT_BASE_URL : `${DEFAULT_BASE_URL}/`;

export function useOrderSSE(orderId: string | null): OrderSSEState {
  const slug = useOrgSlug();
  const [state, setState] = useState<OrderSSEState>({
    status: null,
    riderLocation: null,
    eta: null,
    events: [],
    connected: false,
    error: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!orderId || !slug) return;

    const url = `${NORMALISED_BASE_URL}${slug}/orders/${orderId}/track`;
    const es = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = es;

    es.onopen = () => {
      setState((prev) => ({ ...prev, connected: true, error: null }));
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setState((prev) => ({
          ...prev,
          status: data.status ?? prev.status,
          riderLocation: data.rider_location ?? prev.riderLocation,
          eta: data.eta ?? prev.eta,
          events: data.event ? [...prev.events, data.event] : prev.events,
        }));
      } catch {
        // Ignore malformed messages
      }
    };

    es.onerror = () => {
      es.close();
      setState((prev) => ({ ...prev, connected: false, error: "Connection lost" }));

      // Auto-reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5_000);
    };
  }, [orderId, slug]);

  useEffect(() => {
    connect();

    return () => {
      eventSourceRef.current?.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return state;
}
