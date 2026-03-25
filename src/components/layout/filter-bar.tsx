"use client";

import { Check, ChevronDown, Star, Tag } from "lucide-react";
import { useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTenantConfig } from "@/hooks/use-tenant-config";
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
  maxDistance: number | null;
  categories: string[];
  pickupOnly: boolean;
  scheduledOnly: boolean;
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
  { id: "recommended", label: "Most relevant", value: "recommended" },
  { id: "distance", label: "Closest", value: "distance" },
  { id: "cheapest_delivery", label: "Cheapest delivery", value: "cheapest_delivery" },
  { id: "delivery_time", label: "Fastest delivery", value: "delivery_time" },
  { id: "rating", label: "Best Rating", value: "rating" },
];

const distanceOptions: FilterOption[] = [
  { id: "1", label: "1 km or less", value: 1 },
  { id: "2", label: "2 km or less", value: 2 },
  { id: "3", label: "3 km or less", value: 3 },
];

const categoryOptions: { id: string; label: string; emoji: string }[] = [
  { id: "pizza", label: "Pizza", emoji: "\uD83C\uDF55" },
  { id: "chicken", label: "Chicken", emoji: "\uD83C\uDF57" },
  { id: "burgers", label: "Burgers", emoji: "\uD83C\uDF54" },
  { id: "fast-food", label: "Fast-food", emoji: "\uD83C\uDF1F" },
  { id: "indian", label: "Indian", emoji: "\uD83C\uDDEE\uD83C\uDDF3" },
  { id: "dessert", label: "Dessert", emoji: "\uD83C\uDF70" },
  { id: "african", label: "African", emoji: "\uD83C\uDF0D" },
  { id: "shawarma", label: "Shawarma", emoji: "\uD83E\uDD59" },
  { id: "breakfast", label: "Breakfast", emoji: "\uD83C\uDF73" },
  { id: "sandwich", label: "Sandwich", emoji: "\uD83E\uDD6A" },
  { id: "pasta", label: "Pasta", emoji: "\uD83C\uDF5D" },
  { id: "stores", label: "Stores", emoji: "\uD83D\uDED2" },
];

export function FilterBar({
  filters: externalFilters,
  onFilterChange: externalOnChange,
  className,
}: FilterBarProps) {
  const isPickupMode = useIsPickupMode();
  const { copy } = useTenantConfig();
  const [internalFilters, setInternalFilters] = useState<ActiveFilters>(defaultFilters);

  // Use external state if provided, otherwise use internal state
  const filters = externalFilters ?? internalFilters;
  const onChange = externalOnChange ?? setInternalFilters;

  const update = (partial: Partial<ActiveFilters>) => {
    onChange({ ...filters, ...partial });
  };

  const toggleOffers = () => update({ offers: !filters.offers });

  const toggleHighestRated = () => update({ highestRated: !filters.highestRated });

  const toggleUnder30 = () => update({ maxTime: filters.maxTime === 30 ? null : 30 });

  const togglePickupOnly = () => update({ pickupOnly: !filters.pickupOnly });

  const toggleScheduledOnly = () => update({ scheduledOnly: !filters.scheduledOnly });

  const setDeliveryFee = (value: string | null) => update({ deliveryFee: value });

  const setRating = (value: number | null) => update({ minRating: value });

  const setSort = (value: string | null) => update({ sortBy: value });

  const setDistance = (value: number | null) => update({ maxDistance: value });

  const toggleCategory = (catId: string) => {
    const current = filters.categories;
    const next = current.includes(catId)
      ? current.filter((c) => c !== catId)
      : [...current, catId];
    update({ categories: next });
  };

  return (
    <div className={cn("scrollbar-hide flex items-center gap-2 overflow-x-auto pb-2", className)}>
      {/* Sort */}
      <FilterDropdown
        label="Sort"
        value={filters.sortBy}
        options={sortOptions}
        onChange={setSort}
      />

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

      {/* Distance */}
      <FilterDropdown
        label="Distance"
        value={filters.maxDistance?.toString() ?? null}
        options={distanceOptions}
        onChange={(val) => setDistance(val ? parseInt(val) : null)}
      />

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

      {/* Category multi-select */}
      <CategoryMultiSelect
        selected={filters.categories}
        onToggle={toggleCategory}
        categoryLabel={copy.categoryLabel}
      />

      {/* Pickup toggle */}
      <FilterChip active={filters.pickupOnly} onClick={togglePickupOnly}>
        Pickup available
      </FilterChip>

      {/* Scheduled orders toggle */}
      <FilterChip active={filters.scheduledOnly} onClick={toggleScheduledOnly}>
        Scheduled orders
      </FilterChip>
    </div>
  );
}

// =============================================================================
// FilterChip
// =============================================================================

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

// =============================================================================
// FilterDropdown
// =============================================================================

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

// =============================================================================
// CategoryMultiSelect
// =============================================================================

function CategoryMultiSelect({
  selected,
  onToggle,
  categoryLabel,
}: {
  selected: string[];
  onToggle: (id: string) => void;
  categoryLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const count = selected.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-all active:scale-95",
            count > 0
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-background text-foreground hover:border-foreground/50",
          )}
        >
          {count > 0 ? `${categoryLabel} (${count})` : categoryLabel}
          <ChevronDown className="size-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1">
        <div className="space-y-0.5">
          {categoryOptions.map((cat) => {
            const isSelected = selected.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => onToggle(cat.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
                  isSelected && "bg-muted font-medium",
                )}
              >
                <span className="text-base">{cat.emoji}</span>
                <span className="flex-1 text-left">{cat.label}</span>
                {isSelected && <Check className="size-4 text-primary" />}
              </button>
            );
          })}
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
  maxDistance: null,
  categories: [],
  pickupOnly: false,
  scheduledOnly: false,
};
