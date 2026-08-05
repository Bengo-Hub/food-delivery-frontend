"use client";

/**
 * CategorySidebar — "Shop by Category" left rail for retail/pharmacy/wholesale
 * profiles. Builds a parent→children tree client-side from the flat
 * `MenuCategory[]` (parentId/parentName/depth/path now come from inventory-api,
 * see fetchCategories in lib/api/catalog.ts) and renders it as:
 *  - Desktop: a vertical list of top-level categories; a parent with children
 *    opens a flyout panel (hover or click) listing its children. A parent with
 *    no children is a plain clickable row (e.g. a genuine standalone root like
 *    "COPYS").
 *  - Mobile: a simple drill-down accordion (no new UI dependency — this repo
 *    has no Accordion/Collapsible primitive yet, so expand/collapse is done
 *    with local state, matching the disclosure pattern already used elsewhere).
 *
 * Deliberately NOT a replacement for CategoryCarousel — that icon-rail stays
 * as-is for hospitality/quick_service. This is a new, parallel component.
 */

import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { cn } from "@/lib/utils";
import type { MenuCategory } from "@/types/catalog";

export interface CategorySidebarProps {
  categories: MenuCategory[];
  activeCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
  /** Storefront's effective use_case — drives the SVG placeholder for categories with no icon. */
  useCase?: string;
  /** Heading label above the tree (defaults to "Shop by Category"). */
  title?: string;
  className?: string;
}

interface CategoryNode extends MenuCategory {
  children: MenuCategory[];
}

function buildTree(categories: MenuCategory[]): CategoryNode[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const childrenByParent = new Map<string, MenuCategory[]>();
  const roots: MenuCategory[] = [];

  for (const cat of categories) {
    // A parentId that doesn't resolve to a known category (stale/cross-tenant
    // data) is treated as a root — never silently drop a category.
    if (cat.parentId && byId.has(cat.parentId)) {
      const list = childrenByParent.get(cat.parentId) ?? [];
      list.push(cat);
      childrenByParent.set(cat.parentId, list);
    } else {
      roots.push(cat);
    }
  }

  return roots
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((root) => ({
      ...root,
      children: (childrenByParent.get(root.id) ?? []).slice().sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
      ),
    }));
}

function CategoryIcon({
  category,
  useCase,
  size = "size-8",
}: {
  category: MenuCategory;
  useCase?: string | undefined;
  size?: string;
}) {
  if (category.emoji) {
    return <span className={cn("flex items-center justify-center text-lg", size)}>{category.emoji}</span>;
  }
  return (
    <span className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted", size)}>
      <ImageWithFallback
        src={category.image}
        alt={category.name}
        useCase={useCase}
        width={32}
        height={32}
        className="size-full object-cover"
        loading="lazy"
        iconClassName="size-4"
      />
    </span>
  );
}

export function CategorySidebar({
  categories,
  activeCategory,
  onCategoryChange,
  useCase,
  title = "Shop by Category",
  className,
}: CategorySidebarProps) {
  const tree = useMemo(() => buildTree(categories), [categories]);
  const [openParentId, setOpenParentId] = useState<string | null>(null);
  const [expandedMobile, setExpandedMobile] = useState<Set<string>>(new Set());

  if (tree.length === 0) return null;

  const toggleMobile = (id: string) => {
    setExpandedMobile((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelect = (id: string) => {
    onCategoryChange?.(id);
    setOpenParentId(null);
  };

  return (
    <nav aria-label={title} className={cn("w-full", className)}>
      <h2 className="mb-2 px-1 text-sm font-bold text-foreground">{title}</h2>

      {/* Desktop: vertical list + hover/click flyout */}
      <ul className="hidden md:block">
        {tree.map((parent) => {
          const hasChildren = parent.children.length > 0;
          const isActive = activeCategory === parent.id || parent.children.some((c) => c.id === activeCategory);

          if (!hasChildren) {
            return (
              <li key={parent.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(parent.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm transition-colors",
                    isActive ? "bg-muted font-semibold text-foreground" : "text-foreground hover:bg-muted/50",
                  )}
                >
                  <CategoryIcon category={parent} useCase={useCase} size="size-7" />
                  <span className="flex-1 truncate">{parent.name}</span>
                </button>
              </li>
            );
          }

          return (
            <li key={parent.id}>
              <Popover
                open={openParentId === parent.id}
                onOpenChange={(open) => setOpenParentId(open ? parent.id : null)}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onMouseEnter={() => setOpenParentId(parent.id)}
                    onClick={() => setOpenParentId((cur) => (cur === parent.id ? null : parent.id))}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm transition-colors",
                      isActive ? "bg-muted font-semibold text-foreground" : "text-foreground hover:bg-muted/50",
                    )}
                  >
                    <CategoryIcon category={parent} useCase={useCase} size="size-7" />
                    <span className="flex-1 truncate">{parent.name}</span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  side="right"
                  align="start"
                  sideOffset={4}
                  className="w-64 p-2"
                  onMouseEnter={() => setOpenParentId(parent.id)}
                  onMouseLeave={() => setOpenParentId(null)}
                >
                  <p className="mb-1 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {parent.name}
                  </p>
                  <ul>
                    {parent.children.map((child) => (
                      <li key={child.id}>
                        <button
                          type="button"
                          onClick={() => handleSelect(child.id)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm transition-colors",
                            activeCategory === child.id
                              ? "bg-muted font-semibold text-foreground"
                              : "text-foreground hover:bg-muted/50",
                          )}
                        >
                          <CategoryIcon category={child} useCase={useCase} size="size-6" />
                          <span className="flex-1 truncate">{child.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </PopoverContent>
              </Popover>
            </li>
          );
        })}
      </ul>

      {/* Mobile: drill-in accordion */}
      <ul className="md:hidden">
        {tree.map((parent) => {
          const hasChildren = parent.children.length > 0;
          const isExpanded = expandedMobile.has(parent.id);
          const isActive = activeCategory === parent.id || parent.children.some((c) => c.id === activeCategory);

          return (
            <li key={parent.id} className="border-b border-border/60 last:border-b-0">
              <button
                type="button"
                onClick={() => (hasChildren ? toggleMobile(parent.id) : handleSelect(parent.id))}
                className={cn(
                  "flex min-h-[44px] w-full items-center gap-2.5 px-2 py-2.5 text-left text-sm",
                  isActive ? "font-semibold text-foreground" : "text-foreground",
                )}
                aria-expanded={hasChildren ? isExpanded : undefined}
              >
                <CategoryIcon category={parent} useCase={useCase} size="size-7" />
                <span className="flex-1 truncate">{parent.name}</span>
                {hasChildren && (
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform",
                      isExpanded && "rotate-180",
                    )}
                  />
                )}
              </button>
              {hasChildren && isExpanded && (
                <ul className="ml-9 border-l border-border/60 pb-1">
                  {parent.children.map((child) => (
                    <li key={child.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(child.id)}
                        className={cn(
                          "flex min-h-[40px] w-full items-center gap-2 px-2 py-2 text-left text-sm",
                          activeCategory === child.id
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        <CategoryIcon category={child} useCase={useCase} size="size-5" />
                        <span className="flex-1 truncate">{child.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
