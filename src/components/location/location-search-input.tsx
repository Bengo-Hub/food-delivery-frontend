"use client";

import type { ChangeEvent, FocusEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import type { LatLngTuple } from "leaflet";
import { Loader2Icon, MapPinIcon, StoreIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/base";
import type { SearchBounds } from "@/lib/geofence";

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";

export type LocationSearchInputProps = {
  value?: string | null;
  status: "idle" | "loading" | "resolved" | "error";
  error?: string | null;
  helper?: string | null;
  onSelect: (coords: LatLngTuple, label: string) => void;
  onUseCurrent: () => void;
  onClear?: () => void;
  canClear?: boolean;
  label?: string;
  placeholder?: string;
  autoFocus?: boolean;
  /** Optional bounds to bias the Nominatim search. Pass null/undefined for global search. */
  searchBounds?: SearchBounds | null;
  /** Optional country code(s) to restrict results (comma-separated, e.g. "ke" or "ke,ug"). */
  countryCodes?: string;
  /** Optional org slug to enable outlet/business search alongside address search. */
  orgSlug?: string | undefined;
  /** Optional user coordinates for finding adjacent outlets sorted by distance. */
  userCoords?: LatLngTuple | null;
};

type Suggestion = {
  type: "address" | "outlet";
  label: string;
  subtitle?: string | undefined;
  coords: LatLngTuple;
};

interface OutletSearchResult {
  id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export function LocationSearchInput({
  value,
  status,
  error,
  helper,
  onSelect,
  onUseCurrent,
  onClear,
  canClear = false,
  label = "Delivery location",
  placeholder = "Search for an address or landmark",
  autoFocus,
  searchBounds,
  countryCodes,
  orgSlug,
  userCoords,
}: LocationSearchInputProps) {
  const [query, setQuery] = useState<string>(value ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    setQuery(value ?? "");
  }, [value]);

  useEffect(() => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        setSearchError(null);

        // Build Nominatim request
        const nominatimParams = new URLSearchParams({
          format: "json",
          addressdetails: "1",
          limit: "5",
          q: query,
        });
        if (countryCodes) {
          nominatimParams.set("countrycodes", countryCodes);
        }
        if (searchBounds) {
          nominatimParams.set(
            "viewbox",
            `${searchBounds.minLng},${searchBounds.maxLat},${searchBounds.maxLng},${searchBounds.minLat}`,
          );
          nominatimParams.set("bounded", "0");
        }

        const nominatimPromise = fetch(
          `${NOMINATIM_ENDPOINT}?${nominatimParams.toString()}`,
          {
            headers: {
              "Accept-Language": "en",
              "User-Agent": "OrderingApp/1.0 (support@codevertexitsolutions.com)",
            },
            signal: controller.signal,
          },
        ).then(async (res) => {
          if (!res.ok) throw new Error("Unable to reach location service.");
          const data: Array<{ lat: string; lon: string; display_name: string }> =
            await res.json();
          return data.map(
            (item): Suggestion => ({
              type: "address",
              label: item.display_name,
              coords: [parseFloat(item.lat), parseFloat(item.lon)] as [number, number],
            }),
          );
        });

        // Outlet search — find outlets adjacent to user's location, sorted by distance.
        // Falls back to listing all outlets if no coordinates available.
        const outletParams = new URLSearchParams({ limit: "5" });
        if (userCoords) {
          outletParams.set("lat", String(userCoords[0]));
          outletParams.set("lng", String(userCoords[1]));
          outletParams.set("sort", "distance");
        }
        const outletPromise: Promise<Suggestion[]> = orgSlug
          ? api
              .get<{ data: OutletSearchResult[] }>(
                `${orgSlug}/outlets?${outletParams.toString()}`,
                { signal: controller.signal },
              )
              .then((res) =>
                (res.data.data ?? [])
                  .filter((o) => o.latitude && o.longitude)
                  .map(
                    (o): Suggestion => ({
                      type: "outlet",
                      label: o.name,
                      subtitle: o.address || undefined,
                      coords: [o.latitude!, o.longitude!] as [number, number],
                    }),
                  ),
              )
              .catch(() => [] as Suggestion[])
          : Promise.resolve([]);

        const [addressResults, outletResults] = await Promise.all([
          nominatimPromise,
          outletPromise,
        ]);

        // Outlet results first, then address results
        setSuggestions([...outletResults, ...addressResults]);
      } catch (err) {
        if ((err as DOMException).name === "AbortError") return;
        setSearchError((err as Error).message ?? "Could not search for that location.");
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, searchBounds, countryCodes, orgSlug]);

  const helperMessage = useMemo(() => {
    if (searchError) return searchError;
    if (error) return error;
    return helper ?? null;
  }, [error, helper, searchError]);

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    event.target.select();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleSelect = (suggestion: Suggestion) => {
    setSuggestions([]);
    setQuery(suggestion.label);
    onSelect(suggestion.coords, suggestion.label);
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <div className="relative z-30">
        <Input
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-label={label}
        />
        {(isSearching || status === "loading") && (
          <Loader2Icon
            className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden
          />
        )}
        {onClear && canClear ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-10 top-1/2 size-8 -translate-y-1/2"
            onClick={() => onClear()}
            aria-label="Clear custom location"
          >
            x
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-3 top-1/2 size-8 -translate-y-1/2"
          onClick={onUseCurrent}
          aria-label="Use current location"
        >
          <MapPinIcon className="size-4" />
        </Button>
        {suggestions.length > 0 ? (
          <ul className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-2xl border border-border bg-card text-sm shadow-2xl">
            {suggestions.map((item, idx) => (
              <li key={`${item.type}-${idx}-${item.coords[0]}-${item.coords[1]}`}>
                <button
                  type="button"
                  className="flex w-full items-start gap-3 px-4 py-2 text-left transition hover:bg-muted"
                  onClick={() => handleSelect(item)}
                >
                  <span className="mt-0.5 shrink-0 text-muted-foreground">
                    {item.type === "outlet" ? (
                      <StoreIcon className="size-4" />
                    ) : (
                      <MapPinIcon className="size-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{item.label}</span>
                    {item.subtitle ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.subtitle}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {helperMessage ? <p className="text-xs text-muted-foreground">{helperMessage}</p> : null}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>
          Status:{" "}
          {status === "resolved"
            ? "location detected"
            : status === "loading"
              ? "locating"
              : status === "error"
                ? "location unavailable"
                : "idle"}
        </span>
      </div>
    </div>
  );
}
