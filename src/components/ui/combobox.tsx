"use client";

import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import * as React from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  /** Stable value submitted on selection (e.g. a user id). */
  value: string;
  /** Primary label shown in the trigger and list. */
  label: string;
  /** Optional secondary line (e.g. an email). */
  description?: string;
}

export interface ComboboxProps {
  /** Currently selected value (controlled). */
  value: string;
  /** Fired with the chosen option's value (or "" when cleared). */
  onChange: (value: string) => void;
  /** Options to display. When `onSearchChange` is provided these are assumed to
   *  already be filtered server-side; otherwise they are filtered client-side. */
  options: ComboboxOption[];
  /** Current search text (controlled). Provide together with onSearchChange for
   *  server-side / debounced search. */
  search?: string;
  /** Fired as the user types in the search box. */
  onSearchChange?: (search: string) => void;
  /** Shows a spinner in the list while options are loading. */
  loading?: boolean;
  /** Trigger placeholder when nothing is selected. */
  placeholder?: string;
  /** Search input placeholder. */
  searchPlaceholder?: string;
  /** Message shown when there are no options. */
  emptyMessage?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/**
 * Combobox — a searchable, keyboard-navigable single-select.
 *
 * Use it instead of forcing users to paste a raw id: it filters a dropdown list
 * (client-side, or server-side via `search`/`onSearchChange`) and submits the
 * chosen option's `value`. Built on the Radix Popover already in the design
 * system (no extra dependency).
 *
 * Accessibility: the trigger is a combobox button; the list uses role="listbox"
 * with role="option" rows, aria-selected/aria-activedescendant, and full arrow /
 * Enter / Escape keyboard support.
 */
export function Combobox({
  value,
  onChange,
  options,
  search,
  onSearchChange,
  loading = false,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyMessage = "No results.",
  disabled = false,
  id,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [internalSearch, setInternalSearch] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const reactId = React.useId();
  const listboxId = `${id ?? reactId}-listbox`;

  const controlledSearch = onSearchChange != null;
  const searchValue = controlledSearch ? (search ?? "") : internalSearch;

  // When search is controlled, options are assumed pre-filtered by the parent.
  const visibleOptions = React.useMemo(() => {
    if (controlledSearch) return options;
    const q = internalSearch.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.description ? o.description.toLowerCase().includes(q) : false),
    );
  }, [controlledSearch, internalSearch, options]);

  const selected = options.find((o) => o.value === value);

  // Keep the active (highlighted) row within bounds as the list changes.
  React.useEffect(() => {
    setActiveIndex((i) => Math.min(Math.max(i, 0), Math.max(visibleOptions.length - 1, 0)));
  }, [visibleOptions.length]);

  // Focus the search input and reset the highlight when opening.
  React.useEffect(() => {
    if (open) {
      setActiveIndex(0);
      // Defer so the popover content is mounted before focusing.
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  const updateSearch = (next: string) => {
    if (controlledSearch) onSearchChange?.(next);
    else setInternalSearch(next);
  };

  const choose = (option: ComboboxOption) => {
    onChange(option.value);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, visibleOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const option = visibleOptions[activeIndex];
      if (option) choose(option);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  // Scroll the active option into view.
  React.useEffect(() => {
    if (!open || !listRef.current) return;
    const node = listRef.current.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open, visibleOptions.length]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          disabled={disabled}
          className={cn(
            "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 text-left text-sm text-foreground shadow-sm transition-all duration-150 focus-visible:border-brand-emphasis focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emphasis focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60",
            className,
          )}
        >
          {selected ? (
            <span className="flex min-w-0 flex-col">
              <span className="truncate">{selected.label}</span>
              {selected.description ? (
                <span className="truncate text-xs text-muted-foreground">
                  {selected.description}
                </span>
              ) : null}
            </span>
          ) : (
            <span className="truncate text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={searchValue}
            onChange={(e) => updateSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={searchPlaceholder}
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              visibleOptions[activeIndex] ? `${listboxId}-opt-${activeIndex}` : undefined
            }
            className="h-10 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <div ref={listRef} role="listbox" id={listboxId} className="max-h-60 overflow-y-auto p-1">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading…
            </div>
          ) : visibleOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</div>
          ) : (
            visibleOptions.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;
              return (
                <div
                  key={option.value}
                  id={`${listboxId}-opt-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => choose(option)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm",
                    isActive ? "bg-muted" : "",
                  )}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{option.label}</span>
                    {option.description ? (
                      <span className="truncate text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                  {isSelected ? <Check className="size-4 shrink-0 text-primary" /> : null}
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
