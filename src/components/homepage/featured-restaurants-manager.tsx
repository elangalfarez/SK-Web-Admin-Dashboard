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
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getFeaturedRestaurants,
  createFeaturedRestaurant,
  updateFeaturedRestaurant,
  deleteFeaturedRestaurant,
  toggleFeaturedRestaurantStatus,
  reorderFeaturedRestaurants,
  getRestaurantOptions,
} from "@/actions/homepage";
import type { FeaturedRestaurantWithTenant } from "@/actions/homepage";

// ============================================================================
// TYPES
// ============================================================================

interface FormData {
  tenant_id: string;
  featured_description: string;
  highlight_text: string;
  sort_order: number;
  is_active: boolean;
}

const defaultFormData: FormData = {
  tenant_id: "",
  featured_description: "",
  highlight_text: "",
  sort_order: 0,
  is_active: true,
};

// ============================================================================
// SORTABLE ITEM COMPONENT
// ============================================================================

interface SortableItemProps {
  restaurant: FeaturedRestaurantWithTenant;
  index: number;
  isPending: boolean;
  onToggleStatus: (restaurant: FeaturedRestaurantWithTenant) => void;
  onEdit: (restaurant: FeaturedRestaurantWithTenant) => void;
  onDelete: (restaurant: FeaturedRestaurantWithTenant) => void;
}

function SortableRestaurantItem({
  restaurant,
  index,
  isPending,
  onToggleStatus,
  onEdit,
  onDelete,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: restaurant.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border p-3 bg-card transition-all",
        !restaurant.is_active && "opacity-50",
        isDragging && "opacity-50 scale-105 shadow-lg z-50 ring-2 ring-primary"
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "flex items-center justify-center cursor-grab active:cursor-grabbing",
          "hover:bg-muted rounded p-2 transition-colors",
          isPending && "cursor-not-allowed opacity-50"
        )}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Logo */}
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
        {restaurant.tenant?.logo_url ? (
          <img
            src={restaurant.tenant.logo_url}
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
            {restaurant.tenant?.name || "Unknown Restaurant"}
          </p>
          {!restaurant.is_active && (
            <Badge variant="inactive" className="text-xs">
              Disabled
            </Badge>
          )}
          {restaurant.highlight_text && (
            <Badge variant="default" className="text-xs">
              <Star className="mr-1 h-3 w-3" />
              {restaurant.highlight_text}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            Order: {index + 1}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onToggleStatus(restaurant)}
          disabled={isPending}
        >
          {restaurant.is_active ? (
            <PowerOff className="h-4 w-4" />
          ) : (
            <Power className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onEdit(restaurant)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(restaurant)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

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
        featured_description: restaurant.featured_description || "",
        highlight_text: restaurant.highlight_text || "",
        sort_order: restaurant.sort_order,
        is_active: restaurant.is_active,
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
    setLoadingOptions(true);
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
        {loadingOptions ? (
          <div className="flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
            Loading restaurants...
          </div>
        ) : (
          <SearchableSelect
            value={formData.tenant_id}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, tenant_id: value }))
            }
            options={restaurantOptions.map((r) => ({
              id: r.id,
              label: r.name,
              image: r.logo_url || undefined,
            }))}
            placeholder="Select restaurant"
            searchPlaceholder="Search restaurants..."
            emptyText="No restaurants found"
            disabled={!!restaurant}
          />
        )}
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
  const [activeId, setActiveId] = useState<string | null>(null);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<FeaturedRestaurantWithTenant | null>(
    null
  );
  const [deletingItem, setDeletingItem] = useState<FeaturedRestaurantWithTenant | null>(
    null
  );

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag (prevents accidental drags)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    const newItems = arrayMove(items, oldIndex, newIndex);

    // Optimistically update UI
    setItems(newItems);

    // Save to backend
    const orderData = newItems.map((item, index) => ({
      id: item.id,
      sort_order: index,
    }));

    startTransition(async () => {
      const result = await reorderFeaturedRestaurants(orderData);
      if (!result.success) {
        toast.error(result.error);
        fetchItems(); // Revert on error
      } else {
        toast.success("Order updated successfully");
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

  const activeItem = activeId ? items.find((item) => item.id === activeId) : null;

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
              Highlight restaurants on the homepage (max 6 recommended) - Drag to reorder
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <SortableRestaurantItem
                      key={item.id}
                      restaurant={item}
                      index={index}
                      isPending={isPending}
                      onToggleStatus={handleToggleStatus}
                      onEdit={setEditingItem}
                      onDelete={setDeletingItem}
                    />
                  ))}
                </div>
              </SortableContext>

              {/* Drag Overlay for better visual feedback */}
              <DragOverlay>
                {activeItem ? (
                  <div className="flex items-center gap-3 rounded-lg border border-border p-3 bg-card shadow-2xl ring-2 ring-primary rotate-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                      {activeItem.tenant?.logo_url ? (
                        <img
                          src={activeItem.tenant.logo_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {activeItem.tenant?.name || "Unknown Restaurant"}
                      </p>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
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
