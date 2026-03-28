"use client";

import type { ChangeEvent, FocusEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import type { LatLngTuple } from "leaflet";
import { Loader2Icon, MapPinIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
};

type Suggestion = {
  label: string;
  coords: LatLngTuple;
};

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
        const params = new URLSearchParams({
          format: "json",
          addressdetails: "1",
          limit: "5",
          q: query,
        });

        // Add country codes filter if provided
        if (countryCodes) {
          params.set("countrycodes", countryCodes);
        }

        // Add viewbox bias if search bounds are provided
        if (searchBounds) {
          params.set(
            "viewbox",
            `${searchBounds.minLng},${searchBounds.maxLat},${searchBounds.maxLng},${searchBounds.minLat}`,
          );
          // Use bounded=0 to prefer (not restrict) results within viewbox
          params.set("bounded", "0");
        }

        const response = await fetch(`${NOMINATIM_ENDPOINT}?${params.toString()}`, {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "OrderingApp/1.0 (support@codevertexitsolutions.com)",
          },
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Unable to reach location service.");
        }
        const data: Array<{ lat: string; lon: string; display_name: string }> =
          await response.json();
        const mapped: Suggestion[] = data.map((item) => ({
          label: item.display_name,
          coords: [parseFloat(item.lat), parseFloat(item.lon)] as [number, number],
        }));
        setSuggestions(mapped);
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
  }, [query, searchBounds, countryCodes]);

  const helperMessage = useMemo(() => {
    if (searchError) return searchError;
    if (error) return error;
    return helper ?? null;
  }, [error, helper, searchError]);

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    onUseCurrent();
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
            {suggestions.map((item) => (
              <li key={`${item.coords[0]}-${item.coords[1]}`}>
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left transition hover:bg-muted"
                  onClick={() => handleSelect(item)}
                >
                  {item.label}
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
