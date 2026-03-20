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
  useCreateCategory,
  useCreateMenuItem,
  useDeleteMenuItem,
  useMenuItems,
  useUpdateMenuItem,
} from "@/hooks/use-admin";
import { toast } from "@/lib/toast";

export default function MenuManagementPage() {
  const [editingItem, setEditingItem] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);

  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const menuItemParams: Parameters<typeof useMenuItems>[0] = {};
  if (selectedCategory) menuItemParams.categoryId = selectedCategory;
  if (search.trim()) menuItemParams.search = search.trim();
  const { data: items, isLoading: itemsLoading } = useMenuItems(menuItemParams);
  const toggleAvailability = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();

  const handleToggleAvailability = async (id: string, current: boolean) => {
    try {
      await toggleAvailability.mutateAsync({ id, data: { isAvailable: !current } });
      toast.success(current ? "Item marked unavailable" : "Item marked available");
    } catch {
      toast.error("Failed to update item availability");
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteItem.mutateAsync(id);
      toast.success("Item deleted");
    } catch {
      toast.error("Failed to delete item");
    }
  };

  return (
    <RequireAuth
      roles={["staff", "admin", "superuser"]}
      roleOperator="or"
      permissions={["catalog:view"]}
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddCategory(!showAddCategory)}
              >
                <Plus className="mr-1 size-3.5" /> Category
              </Button>
              <Button size="sm" onClick={() => setShowAddItem(!showAddItem)}>
                <Plus className="mr-1 size-3.5" /> Item
              </Button>
            </div>
          </header>

          {/* Add Category Form */}
          {showAddCategory && (
            <AddCategoryForm onClose={() => setShowAddCategory(false)} />
          )}

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
                            handleToggleAvailability(item.id, item.isAvailable)
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
                          onClick={() => handleDeleteItem(item.id, item.name)}
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

function AddCategoryForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createCategory = useCreateCategory();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const payload: Parameters<typeof createCategory.mutateAsync>[0] = { name: name.trim() };
      if (description.trim()) payload.description = description.trim();
      await createCategory.mutateAsync(payload);
      toast.success("Category created");
      onClose();
    } catch {
      toast.error("Failed to create category");
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Category Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Dishes"
              required
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Description
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <Button type="submit" size="sm" disabled={createCategory.isPending}>
            {createCategory.isPending ? <Loader2 className="mr-1 size-3 animate-spin" /> : null}
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

function AddItemForm({
  categories,
  onClose,
}: {
  categories: { id: string; name: string }[];
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const createItem = useCreateMenuItem();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId || !price) return;
    try {
      const itemPayload: Parameters<typeof createItem.mutateAsync>[0] = {
        categoryId,
        name: name.trim(),
        price: Number(price),
        imageUrl: imageUrl || undefined,
      };
      if (description.trim()) itemPayload.description = description.trim();
      await createItem.mutateAsync(itemPayload);
      toast.success("Catalog item created");
      onClose();
    } catch {
      toast.error("Failed to create catalog item");
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-40 flex-shrink-0">
              <ImageUpload
                label="Item Photo"
                value={imageUrl}
                onChange={setImageUrl}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Item Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Grilled Chicken"
                required
              />
            </div>
            <div className="w-40">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
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
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Description
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <Button type="submit" size="sm" disabled={createItem.isPending}>
              {createItem.isPending ? <Loader2 className="mr-1 size-3 animate-spin" /> : null}
              Add
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function EditItemForm({
  item,
  categories,
  onClose,
}: {
  item: any;
  categories: { id: string; name: string }[];
  onClose: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [categoryId, setCategoryId] = useState(item.categoryId);
  const [price, setPrice] = useState(item.price.toString());
  const [description, setDescription] = useState(item.description || "");
  const [imageUrl, setImageUrl] = useState(item.imageUrl || "");
  const updateItem = useUpdateMenuItem();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId || !price) return;
    try {
      await updateItem.mutateAsync({
        id: item.id,
        data: {
          categoryId,
          name: name.trim(),
          price: Number(price),
          description: description.trim() || undefined,
          imageUrl: imageUrl || undefined,
        },
      });
      toast.success("Catalog item updated");
      onClose();
    } catch {
      toast.error("Failed to update catalog item");
    }
  };

  return (
    <Card className="mb-4 border-primary/20 bg-primary/5 shadow-md">
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-40 flex-shrink-0">
              <ImageUpload
                label="Item Photo"
                value={imageUrl}
                onChange={setImageUrl}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Item Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Grilled Chicken"
                required
              />
            </div>
            <div className="w-40">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
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
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Description
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <Button type="submit" size="sm" disabled={updateItem.isPending}>
              {updateItem.isPending ? <Loader2 className="mr-1 size-3 animate-spin" /> : null}
              Update
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
