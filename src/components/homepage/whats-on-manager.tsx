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
  Image as ImageIcon,
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
              value={formData.custom_image_url || null}
              onChange={(url) =>
                setFormData((prev) => ({ ...prev, custom_image_url: url || "" }))
              }
              bucket="homepage"
              folder="whats-on"
              aspectRatio="video"
              maxSize={2 * 1024 * 1024}
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

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<WhatsOnResolved | null>(null);
  const [deletingItem, setDeletingItem] = useState<WhatsOnResolved | null>(null);

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
  const saveOrder = async (newItems: WhatsOnResolved[]) => {
    setItems(newItems);
    const orderData = newItems.map((item, index) => ({
      id: item.id,
      sort_order: index,
    }));

    startTransition(async () => {
      const result = await reorderWhatsOnItems(orderData);
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
              <Sparkles className="h-5 w-5" />
              What's On Feed
            </CardTitle>
            <CardDescription>
              Manage homepage featured content (max 6 items recommended)
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
            <div className="space-y-2">
              {items.map((item, index) => {
                const config = contentTypeConfig[item.content_type];
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
                    <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                      {image ? (
                        <img
                          src={image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
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
