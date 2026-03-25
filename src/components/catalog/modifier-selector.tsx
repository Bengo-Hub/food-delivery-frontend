"use client";

import { cn } from "@/lib/utils";
import type { ModifierGroup } from "@/types/catalog";

interface ModifierSelectorProps {
  groups: ModifierGroup[];
  selections: Record<string, string[]>; // groupId -> selected optionIds
  onSelectionsChange: (selections: Record<string, string[]>) => void;
  currency: string;
}

export function ModifierSelector({
  groups,
  selections,
  onSelectionsChange,
  currency,
}: ModifierSelectorProps) {
  const handleToggle = (groupId: string, optionId: string, maxSelections: number) => {
    const current = selections[groupId] ?? [];
    const isSelected = current.includes(optionId);

    let next: string[];
    if (isSelected) {
      next = current.filter((id) => id !== optionId);
    } else if (maxSelections === 1) {
      next = [optionId];
    } else if (current.length >= maxSelections) {
      return; // at limit
    } else {
      next = [...current, optionId];
    }

    onSelectionsChange({ ...selections, [groupId]: next });
  };

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const isRadio = group.maxSelections === 1;
        const selectedCount = (selections[group.id] ?? []).length;
        const isSatisfied = !group.isRequired || selectedCount >= group.minSelections;

        return (
          <div key={group.id} className="space-y-3">
            {/* Group header */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">
                {group.name}
                {group.isRequired && (
                  <span
                    className={cn(
                      "ml-2 rounded-full px-2 py-0.5 text-xs font-medium",
                      isSatisfied
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive",
                    )}
                  >
                    Required
                  </span>
                )}
              </h3>
              {group.maxSelections > 1 && (
                <span className="text-xs text-muted-foreground">
                  Select {group.minSelections > 0 ? `${group.minSelections}-` : "up to "}
                  {group.maxSelections}
                </span>
              )}
            </div>

            {/* Options */}
            <div className="grid gap-2 sm:grid-cols-2">
              {group.options.map((option) => {
                const isSelected = selections[group.id]?.includes(option.id) ?? false;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleToggle(group.id, option.id, group.maxSelections)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-left transition",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    {/* Radio / Checkbox indicator */}
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center border-2 transition",
                        isRadio ? "rounded-full" : "rounded",
                        isSelected ? "border-primary bg-primary" : "border-muted-foreground/40",
                      )}
                    >
                      {isSelected && (
                        <span
                          className={cn(
                            "bg-primary-foreground",
                            isRadio ? "size-2 rounded-full" : "size-3",
                          )}
                          style={
                            !isRadio
                              ? {
                                  clipPath:
                                    "polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%)",
                                }
                              : undefined
                          }
                        />
                      )}
                    </span>

                    <span className="flex flex-1 items-center justify-between">
                      <span className="text-sm font-medium">{option.name}</span>
                      {option.priceAdjustment > 0 && (
                        <span className="text-sm text-muted-foreground">
                          +{currency} {option.priceAdjustment.toLocaleString()}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Check whether all required modifier groups have their minimum selections met.
 */
export function validateModifierSelections(
  groups: ModifierGroup[],
  selections: Record<string, string[]>,
): boolean {
  return groups.every((g) => {
    if (!g.isRequired) return true;
    return (selections[g.id]?.length ?? 0) >= g.minSelections;
  });
}

/**
 * Calculate the total price adjustment from selected modifiers.
 */
export function calculateModifierAdjustment(
  groups: ModifierGroup[],
  selections: Record<string, string[]>,
): number {
  let adjustment = 0;
  for (const group of groups) {
    const selectedIds = selections[group.id] ?? [];
    for (const optionId of selectedIds) {
      const option = group.options.find((o) => o.id === optionId);
      if (option) adjustment += option.priceAdjustment;
    }
  }
  return adjustment;
}
