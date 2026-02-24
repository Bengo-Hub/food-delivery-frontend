"use client";

import { ChevronDown, Star, Tag } from "lucide-react";
import { useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useIsPickupMode } from "@/store/dining-mode";

export interface FilterOption {
  id: string;
  label: string;
  value: string | number | boolean;
}

export interface ActiveFilters {
  offers: boolean;
  deliveryFee: string | null;
  maxTime: number | null;
  highestRated: boolean;
  minRating: number | null;
  sortBy: string | null;
}

interface FilterBarProps {
  /** External filter state - if not provided, internal state is used */
  filters?: ActiveFilters;
  /** Callback when filters change - if not provided, internal state is used */
  onFilterChange?: (filters: ActiveFilters) => void;
  className?: string;
}

const deliveryFeeOptions: FilterOption[] = [
  { id: "free", label: "Free delivery", value: "free" },
  { id: "under-50", label: "Under KES 50", value: "under-50" },
  { id: "under-100", label: "Under KES 100", value: "under-100" },
  { id: "any", label: "Any", value: "any" },
];

const ratingOptions: FilterOption[] = [
  { id: "4.5", label: "4.5+", value: 4.5 },
  { id: "4.0", label: "4.0+", value: 4.0 },
  { id: "3.5", label: "3.5+", value: 3.5 },
  { id: "any", label: "Any rating", value: 0 },
];

const sortOptions: FilterOption[] = [
  { id: "recommended", label: "Recommended", value: "recommended" },
  { id: "rating", label: "Rating", value: "rating" },
  { id: "delivery_time", label: "Delivery time", value: "delivery_time" },
  { id: "distance", label: "Distance", value: "distance" },
];

const priceOptions: FilterOption[] = [
  { id: "1", label: "$", value: 1 },
  { id: "2", label: "$$", value: 2 },
  { id: "3", label: "$$$", value: 3 },
  { id: "4", label: "$$$$", value: 4 },
];

export function FilterBar({
  filters: externalFilters,
  onFilterChange: externalOnChange,
  className,
}: FilterBarProps) {
  const isPickupMode = useIsPickupMode();
  const [priceFilter, setPriceFilter] = useState<number | null>(null);
  const [internalFilters, setInternalFilters] = useState<ActiveFilters>(defaultFilters);

  // Use external state if provided, otherwise use internal state
  const filters = externalFilters ?? internalFilters;
  const onFilterChange = externalOnChange ?? setInternalFilters;

  const toggleOffers = () => {
    onFilterChange({ ...filters, offers: !filters.offers });
  };

  const toggleHighestRated = () => {
    onFilterChange({ ...filters, highestRated: !filters.highestRated });
  };

  const toggleUnder30 = () => {
    onFilterChange({
      ...filters,
      maxTime: filters.maxTime === 30 ? null : 30,
    });
  };

  const setDeliveryFee = (value: string | null) => {
    onFilterChange({ ...filters, deliveryFee: value });
  };

  const setRating = (value: number | null) => {
    onFilterChange({ ...filters, minRating: value });
  };

  const setSort = (value: string | null) => {
    onFilterChange({ ...filters, sortBy: value });
  };

  return (
    <div className={cn("scrollbar-hide flex items-center gap-2 overflow-x-auto pb-2", className)}>
      {/* Offers Filter */}
      <FilterChip
        active={filters.offers}
        onClick={toggleOffers}
        icon={<Tag className="size-3.5" />}
      >
        Offers
      </FilterChip>

      {/* Delivery Fee Filter - Only in delivery mode */}
      {!isPickupMode && (
        <FilterDropdown
          label="Delivery fee"
          value={filters.deliveryFee}
          options={deliveryFeeOptions}
          onChange={setDeliveryFee}
        />
      )}

      {/* Under 30 min */}
      <FilterChip active={filters.maxTime === 30} onClick={toggleUnder30}>
        Under 30 min
      </FilterChip>

      {/* Highest Rated */}
      <FilterChip
        active={filters.highestRated}
        onClick={toggleHighestRated}
        icon={<Star className="size-3.5" />}
      >
        Highest rated
      </FilterChip>

      {/* Rating Filter */}
      <FilterDropdown
        label="Rating"
        value={filters.minRating?.toString() || null}
        options={ratingOptions}
        onChange={(val) => setRating(val ? parseFloat(val) : null)}
        icon={<Star className="size-3.5 fill-current" />}
      />

      {/* Price Filter - Only in pickup mode */}
      {isPickupMode && (
        <FilterDropdown
          label="Price"
          value={priceFilter?.toString() || null}
          options={priceOptions}
          onChange={(val) => setPriceFilter(val ? parseInt(val) : null)}
        />
      )}

      {/* Sort Filter */}
      <FilterDropdown
        label="Sort"
        value={filters.sortBy}
        options={sortOptions}
        onChange={setSort}
      />
    </div>
  );
}

interface FilterChipProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

function FilterChip({ children, active = false, onClick, icon, className }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-all active:scale-95",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-background text-foreground hover:border-foreground/50",
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

interface FilterDropdownProps {
  label: string;
  value: string | null;
  options: FilterOption[];
  onChange: (value: string | null) => void;
  icon?: React.ReactNode;
}

function FilterDropdown({ label, value, options, onChange, icon }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-all active:scale-95",
            value
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-background text-foreground hover:border-foreground/50",
          )}
        >
          {icon}
          {selectedOption ? selectedOption.label : label}
          <ChevronDown className="size-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-48 p-1">
        <div className="space-y-0.5">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                onChange(option.id === value ? null : option.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
                option.id === value && "bg-muted font-medium",
              )}
            >
              {option.label}
              {option.id === value && <span className="text-primary">&#10003;</span>}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Default filter state
export const defaultFilters: ActiveFilters = {
  offers: false,
  deliveryFee: null,
  maxTime: null,
  highestRated: false,
  minRating: null,
  sortBy: null,
};
