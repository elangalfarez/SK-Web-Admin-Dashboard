// src/components/vip/vip-benefits-manager.tsx
// Created: VIP benefits management component with CRUD

"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Gift, GripVertical, Check, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  getVipBenefits,
  createVipBenefit,
  updateVipBenefit,
  deleteVipBenefit,
} from "@/actions/vip";
import type { VipBenefit } from "@/types/database";

// ============================================================================
// ICON OPTIONS
// ============================================================================

const iconOptions = [
  { value: "gift", label: "Gift" },
  { value: "percent", label: "Discount" },
  { value: "car", label: "Parking" },
  { value: "coffee", label: "Coffee" },
  { value: "ticket", label: "Ticket" },
  { value: "crown", label: "Crown" },
  { value: "star", label: "Star" },
  { value: "heart", label: "Heart" },
  { value: "zap", label: "Priority" },
  { value: "shield", label: "Shield" },
  { value: "sparkles", label: "Sparkles" },
  { value: "gem", label: "Gem" },
];

// ============================================================================
// BENEFIT FORM
// ============================================================================

interface BenefitFormData {
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
}

interface BenefitFormProps {
  benefit?: VipBenefit;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

function BenefitForm({ benefit, onSubmit, onCancel, isPending }: BenefitFormProps) {
  const [formData, setFormData] = useState<BenefitFormData>({
    name: benefit?.name || "",
    description: benefit?.description || "",
    icon: benefit?.icon || "gift",
    is_active: benefit?.is_active ?? true,
    sort_order: benefit?.sort_order || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.set("name", formData.name);
    data.set("description", formData.description);
    data.set("icon", formData.icon);
    data.set("is_active", String(formData.is_active));
    data.set("sort_order", String(formData.sort_order));
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="benefit-name" required>Benefit Name</Label>
        <Input
          id="benefit-name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Free Parking"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="benefit-desc">Description</Label>
        <Textarea
          id="benefit-desc"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the benefit details..."
          rows={2}
        />
      </div>

      {/* Icon */}
      <div className="space-y-2">
        <Label>Icon</Label>
        <div className="flex flex-wrap gap-2">
          {iconOptions.map((icon) => (
            <button
              key={icon.value}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, icon: icon.value }))}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all",
                formData.icon === icon.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-muted-foreground"
              )}
            >
              <Gift className="h-4 w-4" />
              {icon.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Order */}
      <div className="space-y-2">
        <Label htmlFor="benefit-sort">Sort Order</Label>
        <Input
          id="benefit-sort"
          type="number"
          min={0}
          value={formData.sort_order}
          onChange={(e) => setFormData((prev) => ({ ...prev, sort_order: Number(e.target.value) }))}
        />
      </div>

      {/* Active */}
      <div className="flex items-center justify-between">
        <Label htmlFor="benefit-active">Active</Label>
        <Switch
          id="benefit-active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : benefit ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function VipBenefitsManager() {
  const router = useRouter();
  const [benefits, setBenefits] = useState<VipBenefit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<VipBenefit | null>(null);
  const [deletingBenefit, setDeletingBenefit] = useState<VipBenefit | null>(null);

  // Fetch benefits
  const fetchBenefits = async () => {
    setIsLoading(true);
    const result = await getVipBenefits();
    if (result.success) {
      setBenefits(result.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBenefits();
  }, []);

  // Handle create
  const handleCreate = async (formData: FormData) => {
    startTransition(async () => {
      const result = await createVipBenefit(formData);
      if (result.success) {
        toast.success(result.message);
        setShowCreateDialog(false);
        fetchBenefits();
      } else {
        toast.error(result.error);
      }
    });
  };

  // Handle update
  const handleUpdate = async (formData: FormData) => {
    if (!editingBenefit) return;

    startTransition(async () => {
      const result = await updateVipBenefit(editingBenefit.id, formData);
      if (result.success) {
        toast.success(result.message);
        setEditingBenefit(null);
        fetchBenefits();
      } else {
        toast.error(result.error);
      }
    });
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingBenefit) return;

    startTransition(async () => {
      const result = await deleteVipBenefit(deletingBenefit.id);
      if (result.success) {
        toast.success(result.message);
        setDeletingBenefit(null);
        fetchBenefits();
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
            <Gift className="h-5 w-5" />
            VIP Benefits Library
          </CardTitle>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Benefit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Benefit</DialogTitle>
                <DialogDescription>
                  Add a new benefit that can be assigned to VIP tiers.
                </DialogDescription>
              </DialogHeader>
              <BenefitForm
                onSubmit={handleCreate}
                onCancel={() => setShowCreateDialog(false)}
                isPending={isPending}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {benefits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-2">No benefits yet</p>
              <p className="text-sm">Create your first benefit to assign to VIP tiers.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {benefits.map((benefit) => (
                <div
                  key={benefit.id}
                  className={cn(
                    "flex items-center justify-between py-3",
                    !benefit.is_active && "opacity-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Gift className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{benefit.name}</p>
                        {!benefit.is_active && (
                          <Badge variant="inactive" className="text-xs">Inactive</Badge>
                        )}
                      </div>
                      {benefit.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {benefit.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setEditingBenefit(benefit)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeletingBenefit(benefit)}
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
      <Dialog open={!!editingBenefit} onOpenChange={() => setEditingBenefit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Benefit</DialogTitle>
            <DialogDescription>
              Update benefit details.
            </DialogDescription>
          </DialogHeader>
          {editingBenefit && (
            <BenefitForm
              benefit={editingBenefit}
              onSubmit={handleUpdate}
              onCancel={() => setEditingBenefit(null)}
              isPending={isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingBenefit} onOpenChange={() => setDeletingBenefit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Benefit</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingBenefit?.name}"? 
              This benefit must not be assigned to any tiers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingBenefit(null)}>
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
