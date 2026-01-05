// src/components/homepage/whats-on-manager.tsx
// Created: What's On feed management component

"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Power,
  PowerOff,
  Calendar,
  Store,
  FileText,
  Percent,
  Sparkles,
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
  getWhatsOnItems,
  createWhatsOnItem,
  updateWhatsOnItem,
  deleteWhatsOnItem,
  toggleWhatsOnStatus,
  reorderWhatsOnItems,
  getReferenceOptions,
} from "@/actions/homepage";
import type { WhatsOnResolved } from "@/actions/homepage";
import type { WhatsOnContentType } from "@/types/database";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface FormData {
  content_type: WhatsOnContentType;
  reference_id: string;
  custom_title: string;
  custom_description: string;
  custom_image_url: string;
  custom_link_url: string;
  sort_order: number;
  is_active: boolean;
  override_start_date: string;
  override_end_date: string;
}

const defaultFormData: FormData = {
  content_type: "event",
  reference_id: "",
  custom_title: "",
  custom_description: "",
  custom_image_url: "",
  custom_link_url: "",
  sort_order: 0,
  is_active: true,
  override_start_date: "",
  override_end_date: "",
};

const contentTypeConfig: Record<
  WhatsOnContentType,
  { label: string; icon: typeof Calendar; color: string }
> = {
  event: { label: "Event", icon: Calendar, color: "bg-blue-500" },
  tenant: { label: "Tenant", icon: Store, color: "bg-green-500" },
  post: { label: "Blog Post", icon: FileText, color: "bg-purple-500" },
  promotion: { label: "Promotion", icon: Percent, color: "bg-orange-500" },
  custom: { label: "Custom", icon: Sparkles, color: "bg-pink-500" },
};

// ============================================================================
// SORTABLE ITEM COMPONENT
// ============================================================================

interface SortableItemProps {
  item: WhatsOnResolved;
  index: number;
  config: { label: string; icon: typeof Calendar; color: string };
  isPending: boolean;
  onToggleStatus: (item: WhatsOnResolved) => void;
  onEdit: (item: WhatsOnResolved) => void;
  onDelete: (item: WhatsOnResolved) => void;
}

function SortableItem({
  item,
  index,
  config,
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
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = config.icon;
  const title =
    item.custom_title ||
    item.reference_data?.title ||
    item.reference_data?.name ||
    "Untitled";
  const image =
    item.custom_image_url ||
    item.reference_data?.image_url ||
    item.reference_data?.logo_url;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border p-3 bg-card transition-all",
        !item.is_active && "opacity-50",
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

      {/* Image */}
      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
        {image && typeof image === 'string' ? (
          <img
            src={image}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Sparkles className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{title}</p>
          {!item.is_active && (
            <Badge variant="inactive" className="text-xs">
              Disabled
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Badge
            variant="outline"
            className="text-xs"
            style={{
              backgroundColor: `${config.color}20`,
              borderColor: config.color,
            }}
          >
            <Icon className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
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
          onClick={() => onToggleStatus(item)}
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
          onClick={() => onEdit(item)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(item)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// ITEM FORM
// ============================================================================

interface ItemFormProps {
  item?: WhatsOnResolved;
  onSubmit: (formData: globalThis.FormData) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

function ItemForm({ item, onSubmit, onCancel, isPending }: ItemFormProps) {
  const [formData, setFormData] = useState<FormData>(() => {
    if (item) {
      return {
        content_type: item.content_type,
        reference_id: item.reference_id || "",
        custom_title: item.custom_title || "",
        custom_description: item.custom_description || "",
        custom_image_url: item.custom_image_url || "",
        custom_link_url: item.custom_link_url || "",
        sort_order: item.sort_order,
        is_active: item.is_active,
        override_start_date: item.override_start_date || "",
        override_end_date: item.override_end_date || "",
      };
    }
    return defaultFormData;
  });

  const [referenceOptions, setReferenceOptions] = useState<
    { id: string; label: string; image?: string }[]
  >([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Load reference options when content type changes
  useEffect(() => {
    if (formData.content_type !== "custom") {
      setLoadingOptions(true);
      getReferenceOptions(formData.content_type).then((result) => {
        if (result.success) {
          setReferenceOptions(result.data);
        }
        setLoadingOptions(false);
      });
    }
  }, [formData.content_type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new globalThis.FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.set(key, String(value));
    });
    onSubmit(data);
  };

  const isCustom = formData.content_type === "custom";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Content Type */}
      <div className="space-y-2">
        <Label htmlFor="content_type" required>Content Type</Label>
        <Select
          value={formData.content_type}
          onValueChange={(value: WhatsOnContentType) =>
            setFormData((prev) => ({
              ...prev,
              content_type: value,
              reference_id: "",
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(contentTypeConfig).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                <span className="flex items-center gap-2">
                  <config.icon className="h-4 w-4" />
                  {config.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reference Selection (for non-custom) */}
      {!isCustom && (
        <div className="space-y-2">
          <Label htmlFor="reference_id" required>
            Select {contentTypeConfig[formData.content_type].label}
          </Label>
          <Select
            value={formData.reference_id}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, reference_id: value }))
            }
            disabled={loadingOptions}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  loadingOptions
                    ? "Loading..."
                    : `Select ${contentTypeConfig[formData.content_type].label.toLowerCase()}`
                }
              />
            </SelectTrigger>
            <SelectContent>
              {referenceOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  <span className="flex items-center gap-2">
                    {option.image && (
                      <img
                        src={option.image}
                        alt=""
                        className="h-6 w-6 rounded object-cover"
                      />
                    )}
                    {option.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Custom Fields */}
      {isCustom && (
        <>
          <div className="space-y-2">
            <Label htmlFor="custom_title" required>Title</Label>
            <Input
              id="custom_title"
              value={formData.custom_title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, custom_title: e.target.value }))
              }
              placeholder="Custom item title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom_description">Description</Label>
            <Textarea
              id="custom_description"
              value={formData.custom_description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  custom_description: e.target.value,
                }))
              }
              placeholder="Brief description"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Image</Label>
            <SingleImageUploader
              value={formData.custom_image_url}
              onChange={(url: string | null) =>
                setFormData((prev) => ({ ...prev, custom_image_url: url || "" }))
              }
              bucket="GENERAL"
              folder="homepage/whats-on"
              aspectRatio="video"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom_link_url">Link URL</Label>
            <Input
              id="custom_link_url"
              type="url"
              value={formData.custom_link_url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, custom_link_url: e.target.value }))
              }
              placeholder="https://..."
            />
          </div>
        </>
      )}

      {/* Date Overrides */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="override_start_date">Start Date Override</Label>
          <Input
            id="override_start_date"
            type="date"
            value={formData.override_start_date}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                override_start_date: e.target.value,
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="override_end_date">End Date Override</Label>
          <Input
            id="override_end_date"
            type="date"
            value={formData.override_end_date}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                override_end_date: e.target.value,
              }))
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
          {isPending ? "Saving..." : item ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function WhatsOnManager() {
  const [items, setItems] = useState<WhatsOnResolved[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<WhatsOnResolved | null>(null);
  const [deletingItem, setDeletingItem] = useState<WhatsOnResolved | null>(null);

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
    const result = await getWhatsOnItems();
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
      const result = await createWhatsOnItem(formData);
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
      const result = await updateWhatsOnItem(editingItem.id, formData);
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
      const result = await deleteWhatsOnItem(deletingItem.id);
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
  const handleToggleStatus = (item: WhatsOnResolved) => {
    startTransition(async () => {
      const result = await toggleWhatsOnStatus(item.id, !item.is_active);
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
      const result = await reorderWhatsOnItems(orderData);
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
              <Sparkles className="h-5 w-5" />
              What's On Feed
            </CardTitle>
            <CardDescription>
              Manage homepage featured content (max 6 items recommended) - Drag to reorder
            </CardDescription>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-2">No items in What's On feed</p>
              <p className="text-sm">Add events, promotions, or custom content.</p>
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
                    <SortableItem
                      key={item.id}
                      item={item}
                      index={index}
                      config={contentTypeConfig[item.content_type]}
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
                    <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                      {(activeItem.custom_image_url ||
                        activeItem.reference_data?.image_url ||
                        activeItem.reference_data?.logo_url) &&
                      typeof (activeItem.custom_image_url ||
                        activeItem.reference_data?.image_url ||
                        activeItem.reference_data?.logo_url) === 'string' ? (
                        <img
                          src={
                            activeItem.custom_image_url ||
                            activeItem.reference_data?.image_url ||
                            activeItem.reference_data?.logo_url ||
                            ''
                          }
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Sparkles className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {activeItem.custom_title ||
                          activeItem.reference_data?.title ||
                          activeItem.reference_data?.name ||
                          "Untitled"}
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
            <DialogTitle>Add What's On Item</DialogTitle>
            <DialogDescription>
              Add content to the homepage What's On feed.
            </DialogDescription>
          </DialogHeader>
          <ItemForm
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
            <DialogTitle>Edit What's On Item</DialogTitle>
            <DialogDescription>
              Update the item settings.
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <ItemForm
              item={editingItem}
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
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this item from the What's On feed?
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
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
