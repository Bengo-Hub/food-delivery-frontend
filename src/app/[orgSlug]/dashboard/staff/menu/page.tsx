"use client";

import {
  Edit2,
  Loader2,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { useState } from "react";
import { ImageUpload } from "@/components/ui/image-upload";

import { RequireAuth } from "@/components/auth/require-auth";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useCategories,
  useCreateMenuItem,
  useDeleteMenuItem,
  useMenuItems,
  useUpdateMenuItem,
} from "@/hooks/use-admin";
import { toast } from "@/lib/toast";
import { apiErrorMessage } from "@/lib/api/error-message";

export default function MenuManagementPage() {
  const [editingItem, setEditingItem] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [showAddItem, setShowAddItem] = useState(false);

  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const menuItemParams: Parameters<typeof useMenuItems>[0] = {};
  if (selectedCategory) menuItemParams.categoryId = selectedCategory;
  if (search.trim()) menuItemParams.search = search.trim();
  const { data: items, isLoading: itemsLoading } = useMenuItems(menuItemParams);
  const toggleAvailability = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();

  const handleToggleAvailability = async (sku: string, current: boolean) => {
    try {
      await toggleAvailability.mutateAsync({ sku, data: { isAvailable: !current } });
      toast.success(current ? "Item marked unavailable" : "Item marked available");
    } catch (e) {
      toast.error(await apiErrorMessage(e, "Failed to update item availability"));
    }
  };

  const handleDeleteItem = async (sku: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteItem.mutateAsync(sku);
      toast.success("Item deleted");
    } catch (e) {
      toast.error(await apiErrorMessage(e, "Failed to delete item"));
    }
  };

  return (
    <RequireAuth
      roles={["staff", "admin", "superuser"]}
      roleOperator="or"
      permissions={["ordering.catalog.manage"]}
      permissionOperator="or"
    >
      <SiteShell>
        <div className="mx-auto w-full max-w-6xl px-4 py-6">
          {/* Header */}
          <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                Catalog Management
              </p>
              <h1 className="text-2xl font-bold">Categories & Items</h1>
              <p className="text-sm text-muted-foreground">
                Manage your catalog categories and items
              </p>
            </div>
            <div className="flex gap-2">
              {/* Category create/edit/delete is intentionally omitted here:
                  categories are owned by the upstream inventory/catalog service
                  and ordering-backend only exposes read-only category endpoints
                  (GET /catalog/categories, GET /catalog/admin/categories).
                  TODO: re-add category management once it is wired to the
                  inventory/catalog service. */}
              <Button size="sm" onClick={() => setShowAddItem(!showAddItem)}>
                <Plus className="mr-1 size-3.5" /> Item
              </Button>
            </div>
          </header>

          {/* Add Item Form */}
          {showAddItem && (
            <AddItemForm
              categories={categories ?? []}
              onClose={() => setShowAddItem(false)}
            />
          )}

          {/* Edit Item Form */}
          {editingItem && (
            <EditItemForm
              item={editingItem}
              categories={categories ?? []}
              onClose={() => setEditingItem(null)}
            />
          )}

          {/* Category Filter */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCategory(undefined)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !selectedCategory
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All
            </button>
            {categoriesLoading ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              (categories ?? []).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat.name}
                </button>
              ))
            )}
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search catalog items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Items Grid */}
          {itemsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : !items || items.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <UtensilsCrossed className="size-10 text-muted-foreground" />
                <p className="font-medium">No catalog items found</p>
                <p className="text-sm text-muted-foreground">
                  Add items using the button above.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <Card key={item.id} className={!item.isAvailable ? "opacity-60" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="truncate text-sm">{item.name}</CardTitle>
                        {item.description && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <Badge variant={item.isAvailable ? "default" : "soft"}>
                        {item.isAvailable ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">
                        KES {item.price.toLocaleString()}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() =>
                            handleToggleAvailability(item.sku, item.isAvailable)
                          }
                          title={item.isAvailable ? "Mark unavailable" : "Mark available"}
                        >
                          {item.isAvailable ? (
                            <ToggleRight className="size-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="size-4 text-muted-foreground" />
                          )}
                        </Button>
                         <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          title="Edit"
                          onClick={() => setEditingItem(item)}
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive"
                          onClick={() => handleDeleteItem(item.sku, item.name)}
                          title="Delete"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    {item.preparationTime && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        ~{item.preparationTime} min prep time
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SiteShell>
    </RequireAuth>
  );
}

function AddItemForm({
  onClose,
}: {
  categories: { id: string; name: string }[];
  onClose: () => void;
}) {
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const createItem = useCreateMenuItem();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !price) return;
    try {
      await createItem.mutateAsync({
        sku: sku.trim(),
        basePrice: Number(price),
        isAvailable: true,
        imageUrlOverride: imageUrl || undefined,
      });
      toast.success("Item added to menu");
      onClose();
    } catch (e) {
      toast.error(await apiErrorMessage(e, "Failed to add item — check the SKU is valid in inventory"));
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <p className="mb-3 text-xs text-muted-foreground">
          Items are sourced from inventory. Enter the inventory SKU to add it to your menu.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Inventory SKU
            </label>
            <Input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g., ITEM-001"
              required
            />
          </div>
          <div className="w-28">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Price (KES)
            </label>
            <Input
              type="number"
              min="0"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="850"
              required
            />
          </div>
          <div className="w-40 flex-shrink-0">
            <ImageUpload
              label="Image Override"
              value={imageUrl}
              onChange={setImageUrl}
            />
          </div>
          <Button type="submit" size="sm" disabled={createItem.isPending}>
            {createItem.isPending ? <Loader2 className="mr-1 size-3 animate-spin" /> : null}
            Add
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function EditItemForm({
  item,
  onClose,
}: {
  item: import("@/lib/api/admin").MenuItem;
  categories: { id: string; name: string }[];
  onClose: () => void;
}) {
  const [price, setPrice] = useState((item.basePrice ?? item.price).toString());
  const [imageUrl, setImageUrl] = useState(item.imageUrl || "");
  const updateItem = useUpdateMenuItem();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price) return;
    try {
      await updateItem.mutateAsync({
        sku: item.sku,
        data: {
          basePrice: Number(price),
          imageUrlOverride: imageUrl || undefined,
        },
      });
      toast.success("Catalog item updated");
      onClose();
    } catch (e) {
      toast.error(await apiErrorMessage(e, "Failed to update catalog item"));
    }
  };

  return (
    <Card className="mb-4 border-primary/20 bg-primary/5 shadow-md">
      <CardContent className="pt-4">
        <p className="mb-3 text-xs text-muted-foreground">
          Editing override for <strong>{item.name}</strong> (SKU: {item.sku})
        </p>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div className="w-40 flex-shrink-0">
            <ImageUpload
              label="Image Override"
              value={imageUrl}
              onChange={setImageUrl}
            />
          </div>
          <div className="w-28">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Price (KES)
            </label>
            <Input
              type="number"
              min="0"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="850"
              required
            />
          </div>
          <Button type="submit" size="sm" disabled={updateItem.isPending}>
            {updateItem.isPending ? <Loader2 className="mr-1 size-3 animate-spin" /> : null}
            Update
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
