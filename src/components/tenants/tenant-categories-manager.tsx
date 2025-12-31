// src/components/tenants/tenant-categories-manager.tsx
// Created: Tenant category management component with CRUD

"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, Pencil, Trash2, FolderOpen, Palette, GripVertical, Store } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getTenantCategories,
  createTenantCategory,
  updateTenantCategory,
  deleteTenantCategory,
} from "@/actions/tenants";
import type { TenantCategory } from "@/types/database";

// ============================================================================
// PRESET COLORS
// ============================================================================

const presetColors = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6b7280", // gray
];

// ============================================================================
// ICON OPTIONS
// ============================================================================

const iconOptions = [
  "store",
  "utensils",
  "shirt",
  "shoe",
  "gem",
  "laptop",
  "smartphone",
  "gamepad-2",
  "baby",
  "scissors",
  "heart",
  "gift",
  "coffee",
  "music",
  "book",
  "camera",
  "palette",
  "dumbbell",
  "plane",
  "car",
];

// ============================================================================
// CATEGORY FORM
// ============================================================================

interface CategoryFormData {
  name: string;
  display_name: string;
  icon: string;
  color: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

interface CategoryFormProps {
  category?: TenantCategory;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

function CategoryForm({ category, onSubmit, onCancel, isPending }: CategoryFormProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: category?.name || "",
    display_name: category?.display_name || "",
    icon: category?.icon || "store",
    color: category?.color || presetColors[0],
    description: category?.description || "",
    sort_order: category?.sort_order || 0,
    is_active: category?.is_active ?? true,
  });

  // Auto-generate name from display_name
  useEffect(() => {
    if (!category && formData.display_name) {
      setFormData((prev) => ({
        ...prev,
        name: formData.display_name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      }));
    }
  }, [formData.display_name, category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.set("name", formData.name);
    data.set("display_name", formData.display_name);
    data.set("icon", formData.icon);
    data.set("color", formData.color);
    data.set("description", formData.description);
    data.set("sort_order", String(formData.sort_order));
    data.set("is_active", String(formData.is_active));
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Display Name */}
      <div className="space-y-2">
        <Label htmlFor="cat-display-name" required>Display Name</Label>
        <Input
          id="cat-display-name"
          value={formData.display_name}
          onChange={(e) => setFormData((prev) => ({ ...prev, display_name: e.target.value }))}
          placeholder="e.g., Fashion & Apparel"
          required
        />
      </div>

      {/* Slug Name */}
      <div className="space-y-2">
        <Label htmlFor="cat-name" required>Slug Name</Label>
        <Input
          id="cat-name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value.toLowerCase() }))}
          placeholder="e.g., fashion-apparel"
          required
        />
        <p className="text-xs text-muted-foreground">
          Lowercase with hyphens only, used in URLs
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="cat-desc">Description</Label>
        <Textarea
          id="cat-desc"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description"
          rows={2}
        />
      </div>

      {/* Sort Order */}
      <div className="space-y-2">
        <Label htmlFor="cat-sort">Sort Order</Label>
        <Input
          id="cat-sort"
          type="number"
          value={formData.sort_order}
          onChange={(e) => setFormData((prev) => ({ ...prev, sort_order: Number(e.target.value) }))}
          min={0}
        />
      </div>

      {/* Color */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1">
          <Palette className="h-3.5 w-3.5" />
          Color
        </Label>
        <div className="flex flex-wrap gap-2">
          {presetColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, color }))}
              className={cn(
                "h-8 w-8 rounded-full transition-all",
                formData.color === color
                  ? "ring-2 ring-offset-2 ring-foreground scale-110"
                  : "hover:scale-105"
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <Input
          value={formData.color}
          onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
          placeholder="#000000"
          className="mt-2"
        />
      </div>

      {/* Icon */}
      <div className="space-y-2">
        <Label>Icon</Label>
        <div className="flex flex-wrap gap-2">
          {iconOptions.slice(0, 10).map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, icon }))}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg border transition-all text-sm",
                formData.icon === icon
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-muted-foreground"
              )}
            >
              {icon.slice(0, 2).toUpperCase()}
            </button>
          ))}
        </div>
        <Input
          value={formData.icon}
          onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
          placeholder="Icon name (e.g., store)"
          className="mt-2"
        />
      </div>

      {/* Active */}
      <div className="flex items-center justify-between">
        <Label htmlFor="cat-active">Active</Label>
        <Switch
          id="cat-active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : category ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TenantCategoriesManager() {
  const [categories, setCategories] = useState<TenantCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TenantCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<TenantCategory | null>(null);

  // Fetch categories
  const fetchCategories = async () => {
    setIsLoading(true);
    const result = await getTenantCategories();
    if (result.success) {
      setCategories(result.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle create
  const handleCreate = async (formData: FormData) => {
    startTransition(async () => {
      const result = await createTenantCategory(formData);
      if (result.success) {
        toast.success(result.message);
        setShowCreateDialog(false);
        fetchCategories();
      } else {
        toast.error(result.error);
      }
    });
  };

  // Handle update
  const handleUpdate = async (formData: FormData) => {
    if (!editingCategory) return;

    startTransition(async () => {
      const result = await updateTenantCategory(editingCategory.id, formData);
      if (result.success) {
        toast.success(result.message);
        setEditingCategory(null);
        fetchCategories();
      } else {
        toast.error(result.error);
      }
    });
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingCategory) return;

    startTransition(async () => {
      const result = await deleteTenantCategory(deletingCategory.id);
      if (result.success) {
        toast.success(result.message);
        setDeletingCategory(null);
        fetchCategories();
      } else {
        toast.error(result.error);
      }
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Tenant Categories
          </CardTitle>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Category</DialogTitle>
                <DialogDescription>
                  Add a new category for organizing tenants.
                </DialogDescription>
              </DialogHeader>
              <CategoryForm
                onSubmit={handleCreate}
                onCancel={() => setShowCreateDialog(false)}
                isPending={isPending}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-2">No categories yet</p>
              <p className="text-sm">Create your first category to organize tenants.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={cn(
                    "flex items-center justify-between py-3",
                    !category.is_active && "opacity-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: category.color || "#6b7280" }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{category.display_name}</p>
                        {category.tenant_count > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Store className="h-3 w-3" />
                            {category.tenant_count}
                          </span>
                        )}
                        {!category.is_active && (
                          <span className="text-xs text-muted-foreground">(Inactive)</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {category.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setEditingCategory(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeletingCategory(category)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category details.
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              category={editingCategory}
              onSubmit={handleUpdate}
              onCancel={() => setEditingCategory(null)}
              isPending={isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deletingCategory?.display_name}&rdquo;? 
              {deletingCategory?.tenant_count && deletingCategory.tenant_count > 0 ? (
                <span className="block mt-2 text-destructive">
                  This category has {deletingCategory.tenant_count} tenant(s). 
                  You must move them to another category first.
                </span>
              ) : (
                " This action cannot be undone."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingCategory(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending || (deletingCategory?.tenant_count || 0) > 0}
            >
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
