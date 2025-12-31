// src/components/homepage/featured-restaurants-manager.tsx
// Created: Featured restaurants management component

"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Power,
  PowerOff,
  UtensilsCrossed,
  Calendar,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SingleImageUploader } from "@/components/shared/image-uploader";
import {
  getFeaturedRestaurants,
  createFeaturedRestaurant,
  updateFeaturedRestaurant,
  deleteFeaturedRestaurant,
  toggleFeaturedRestaurantStatus,
  reorderFeaturedRestaurants,
  getRestaurantOptions,
} from "@/actions/homepage";
import { formatDate } from "@/lib/utils/format-date";
import type { FeaturedRestaurantWithTenant } from "@/actions/homepage";

// ============================================================================
// TYPES
// ============================================================================

interface FormData {
  tenant_id: string;
  featured_image_url: string;
  featured_description: string;
  highlight_text: string;
  sort_order: number;
  is_active: boolean;
  start_date: string;
  end_date: string;
}

const defaultFormData: FormData = {
  tenant_id: "",
  featured_image_url: "",
  featured_description: "",
  highlight_text: "",
  sort_order: 0,
  is_active: true,
  start_date: "",
  end_date: "",
};

// ============================================================================
// RESTAURANT FORM
// ============================================================================

interface RestaurantFormProps {
  restaurant?: FeaturedRestaurantWithTenant;
  onSubmit: (formData: globalThis.FormData) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

function RestaurantForm({
  restaurant,
  onSubmit,
  onCancel,
  isPending,
}: RestaurantFormProps) {
  const [formData, setFormData] = useState<FormData>(() => {
    if (restaurant) {
      return {
        tenant_id: restaurant.tenant_id,
        featured_image_url: restaurant.featured_image_url || "",
        featured_description: restaurant.featured_description || "",
        highlight_text: restaurant.highlight_text || "",
        sort_order: restaurant.sort_order,
        is_active: restaurant.is_active,
        start_date: restaurant.start_date || "",
        end_date: restaurant.end_date || "",
      };
    }
    return defaultFormData;
  });

  const [restaurantOptions, setRestaurantOptions] = useState<
    { id: string; name: string; logo_url: string | null }[]
  >([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Load restaurant options
  useEffect(() => {
    getRestaurantOptions().then((result) => {
      if (result.success) {
        setRestaurantOptions(result.data);
      }
      setLoadingOptions(false);
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new globalThis.FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.set(key, String(value));
    });
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Restaurant Selection */}
      <div className="space-y-2">
        <Label htmlFor="tenant_id" required>Restaurant</Label>
        <Select
          value={formData.tenant_id}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, tenant_id: value }))
          }
          disabled={loadingOptions || !!restaurant}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={loadingOptions ? "Loading..." : "Select restaurant"}
            />
          </SelectTrigger>
          <SelectContent>
            {restaurantOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                <span className="flex items-center gap-2">
                  {option.logo_url ? (
                    <img
                      src={option.logo_url}
                      alt=""
                      className="h-6 w-6 rounded object-cover"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                      <UtensilsCrossed className="h-3 w-3" />
                    </div>
                  )}
                  {option.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {restaurant && (
          <p className="text-xs text-muted-foreground">
            Restaurant cannot be changed. Delete and create new if needed.
          </p>
        )}
      </div>

      {/* Highlight Text */}
      <div className="space-y-2">
        <Label htmlFor="highlight_text">Highlight Badge</Label>
        <Input
          id="highlight_text"
          value={formData.highlight_text}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, highlight_text: e.target.value }))
          }
          placeholder="e.g., New, Best Seller, 20% Off"
          maxLength={50}
        />
        <p className="text-xs text-muted-foreground">
          Short text shown as a badge on the card
        </p>
      </div>

      {/* Featured Description */}
      <div className="space-y-2">
        <Label htmlFor="featured_description">Featured Description</Label>
        <Textarea
          id="featured_description"
          value={formData.featured_description}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              featured_description: e.target.value,
            }))
          }
          placeholder="Special description for the featured section"
          rows={2}
          maxLength={300}
        />
        <p className="text-xs text-muted-foreground">
          {formData.featured_description.length}/300 characters
        </p>
      </div>

      {/* Featured Image */}
      <div className="space-y-2">
        <Label>Featured Image</Label>
        <SingleImageUploader
          value={formData.featured_image_url}
          onChange={(url: string | null) =>
            setFormData((prev) => ({ ...prev, featured_image_url: url || "" }))
          }
          bucket="GENERAL"
          folder="homepage/restaurants"
          aspectRatio="video"
        />
        <p className="text-xs text-muted-foreground">
          Optional. Uses restaurant logo if not provided.
        </p>
      </div>

      {/* Visibility Dates */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="start_date">
            <Calendar className="mr-1 inline h-3 w-3" />
            Start Date
          </Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, start_date: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">
            <Calendar className="mr-1 inline h-3 w-3" />
            End Date
          </Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, end_date: e.target.value }))
            }
          />
        </div>
      </div>

      {/* Active Toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <Label htmlFor="is_active">Active</Label>
          <p className="text-sm text-muted-foreground">Show on homepage</p>
        </div>
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({ ...prev, is_active: checked }))
          }
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : restaurant ? "Update" : "Add"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FeaturedRestaurantsManager() {
  const [items, setItems] = useState<FeaturedRestaurantWithTenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<FeaturedRestaurantWithTenant | null>(
    null
  );
  const [deletingItem, setDeletingItem] = useState<FeaturedRestaurantWithTenant | null>(
    null
  );

  // Fetch items
  const fetchItems = async () => {
    setIsLoading(true);
    const result = await getFeaturedRestaurants();
    if (result.success) {
      setItems(result.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Handle create
  const handleCreate = async (formData: globalThis.FormData) => {
    startTransition(async () => {
      const result = await createFeaturedRestaurant(formData);
      if (result.success) {
        toast.success(result.message);
        setShowCreateDialog(false);
        fetchItems();
      } else {
        toast.error(result.error);
      }
    });
  };

  // Handle update
  const handleUpdate = async (formData: globalThis.FormData) => {
    if (!editingItem) return;

    startTransition(async () => {
      const result = await updateFeaturedRestaurant(editingItem.id, formData);
      if (result.success) {
        toast.success(result.message);
        setEditingItem(null);
        fetchItems();
      } else {
        toast.error(result.error);
      }
    });
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingItem) return;

    startTransition(async () => {
      const result = await deleteFeaturedRestaurant(deletingItem.id);
      if (result.success) {
        toast.success(result.message);
        setDeletingItem(null);
        fetchItems();
      } else {
        toast.error(result.error);
      }
    });
  };

  // Handle toggle status
  const handleToggleStatus = (item: FeaturedRestaurantWithTenant) => {
    startTransition(async () => {
      const result = await toggleFeaturedRestaurantStatus(item.id, !item.is_active);
      if (result.success) {
        toast.success(result.message);
        fetchItems();
      } else {
        toast.error(result.error);
      }
    });
  };

  // Move item up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    saveOrder(newItems);
  };

  // Move item down
  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    saveOrder(newItems);
  };

  // Save new order
  const saveOrder = async (newItems: FeaturedRestaurantWithTenant[]) => {
    setItems(newItems);
    const orderData = newItems.map((item, index) => ({
      id: item.id,
      sort_order: index,
    }));

    startTransition(async () => {
      const result = await reorderFeaturedRestaurants(orderData);
      if (!result.success) {
        toast.error(result.error);
        fetchItems(); // Revert on error
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
          <div>
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5" />
              Featured Restaurants
            </CardTitle>
            <CardDescription>
              Highlight restaurants on the homepage (max 6 recommended)
            </CardDescription>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Restaurant
          </Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UtensilsCrossed className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-2">No featured restaurants</p>
              <p className="text-sm">Add restaurants to highlight on the homepage.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => {
                const image =
                  item.featured_image_url || item.tenant?.logo_url;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border border-border p-3",
                      !item.is_active && "opacity-50"
                    )}
                  >
                    {/* Drag Handle & Order */}
                    <div className="flex flex-col items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0 || isPending}
                      >
                        <span className="sr-only">Move up</span>
                        <svg className="h-3 w-3" viewBox="0 0 10 6">
                          <path d="M1 5L5 1L9 5" stroke="currentColor" fill="none" />
                        </svg>
                      </Button>
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === items.length - 1 || isPending}
                      >
                        <span className="sr-only">Move down</span>
                        <svg className="h-3 w-3" viewBox="0 0 10 6">
                          <path d="M1 1L5 5L9 1" stroke="currentColor" fill="none" />
                        </svg>
                      </Button>
                    </div>

                    {/* Image */}
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {image ? (
                        <img
                          src={image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {item.tenant?.name || "Unknown Restaurant"}
                        </p>
                        {item.highlight_text && (
                          <Badge variant="success" className="text-xs">
                            <Star className="mr-1 h-3 w-3" />
                            {item.highlight_text}
                          </Badge>
                        )}
                        {!item.is_active && (
                          <Badge variant="inactive" className="text-xs">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {item.featured_description || "No description"}
                      </p>
                      {(item.start_date || item.end_date) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.start_date && formatDate(item.start_date)}
                          {item.start_date && item.end_date && " - "}
                          {item.end_date && formatDate(item.end_date)}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleToggleStatus(item)}
                        disabled={isPending}
                      >
                        {item.is_active ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditingItem(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeletingItem(item)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Featured Restaurant</DialogTitle>
            <DialogDescription>
              Select a restaurant to feature on the homepage.
            </DialogDescription>
          </DialogHeader>
          <RestaurantForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateDialog(false)}
            isPending={isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Featured Restaurant</DialogTitle>
            <DialogDescription>
              Update the featured settings.
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <RestaurantForm
              restaurant={editingItem}
              onSubmit={handleUpdate}
              onCancel={() => setEditingItem(null)}
              isPending={isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Featured Restaurant</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove "{deletingItem?.tenant?.name}" from
              the featured section?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingItem(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
