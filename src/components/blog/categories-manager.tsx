// src/components/blog/categories-manager.tsx
// Created: Category management component with CRUD

"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, FolderOpen, Palette } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generateSlug } from "@/lib/utils/slug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/actions/blog";
import type { BlogCategory } from "@/types/database";

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
// CATEGORY FORM
// ============================================================================

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  color: string;
}

interface CategoryFormProps {
  category?: BlogCategory;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

function CategoryForm({ category, onSubmit, onCancel, isPending }: CategoryFormProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: category?.name || "",
    slug: category?.slug || "",
    description: category?.description || "",
    color: category?.color || presetColors[0],
  });
  const [autoSlug, setAutoSlug] = useState(!category);

  // Auto-generate slug
  useEffect(() => {
    if (autoSlug && formData.name) {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(formData.name),
      }));
    }
  }, [formData.name, autoSlug]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.set("name", formData.name);
    data.set("slug", formData.slug);
    data.set("description", formData.description);
    data.set("color", formData.color);
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="cat-name" required>Name</Label>
        <Input
          id="cat-name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Category name"
          required
        />
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="cat-slug" required>Slug</Label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoSlug}
              onChange={(e) => setAutoSlug(e.target.checked)}
              className="h-4 w-4"
            />
            Auto-generate
          </label>
        </div>
        <Input
          id="cat-slug"
          value={formData.slug}
          onChange={(e) => {
            setAutoSlug(false);
            setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase() }));
          }}
          placeholder="category-slug"
          required
        />
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

export function CategoriesManager() {
  const router = useRouter();
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<BlogCategory | null>(null);

  // Fetch categories
  const fetchCategories = async () => {
    setIsLoading(true);
    const result = await getCategories();
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
      const result = await createCategory(formData);
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
      const result = await updateCategory(editingCategory.id, formData);
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
      const result = await deleteCategory(deletingCategory.id);
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
            Categories
          </CardTitle>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Category</DialogTitle>
                <DialogDescription>
                  Add a new category for organizing blog posts.
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
              <p className="text-sm">Create your first category to organize posts.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: category.color || "#6b7280" }}
                    />
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-muted-foreground">
                        /{category.slug}
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
        <DialogContent>
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
              Are you sure you want to delete &ldquo;{deletingCategory?.name}&rdquo;? 
              Posts in this category will become uncategorized.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingCategory(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
