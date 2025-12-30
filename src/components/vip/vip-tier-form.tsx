// src/components/vip/vip-tier-form.tsx
// Created: VIP tier form component for create and edit

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Crown, Palette, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createVipTier, updateVipTier } from "@/actions/vip";
import type { VipTier } from "@/types/database";

// ============================================================================
// TYPES
// ============================================================================

interface VipTierFormProps {
  tier?: VipTier;
  mode: "create" | "edit";
}

interface FormData {
  name: string;
  description: string;
  qualification_requirement: string;
  minimum_spend_amount: number;
  minimum_receipt_amount: number | null;
  tier_level: number;
  card_color: string;
  is_active: boolean;
  sort_order: number;
}

// ============================================================================
// PRESET COLORS
// ============================================================================

const presetColors = [
  { name: "Silver", value: "#9ca3af" },
  { name: "Gold", value: "#eab308" },
  { name: "Platinum", value: "#a1a1aa" },
  { name: "Diamond", value: "#06b6d4" },
  { name: "Ruby", value: "#ef4444" },
  { name: "Emerald", value: "#10b981" },
  { name: "Sapphire", value: "#3b82f6" },
  { name: "Amethyst", value: "#8b5cf6" },
  { name: "Obsidian", value: "#18181b" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function VipTierForm({ tier, mode }: VipTierFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: tier?.name || "",
    description: tier?.description || "",
    qualification_requirement: tier?.qualification_requirement || "",
    minimum_spend_amount: tier?.minimum_spend_amount || 0,
    minimum_receipt_amount: tier?.minimum_receipt_amount || null,
    tier_level: tier?.tier_level || 1,
    card_color: tier?.card_color || "#9ca3af",
    is_active: tier?.is_active ?? true,
    sort_order: tier?.sort_order || 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form field
  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (!formData.qualification_requirement.trim()) {
      newErrors.qualification_requirement = "Qualification requirement is required";
    }

    if (formData.tier_level < 1 || formData.tier_level > 10) {
      newErrors.tier_level = "Tier level must be between 1 and 10";
    }

    if (formData.minimum_spend_amount < 0) {
      newErrors.minimum_spend_amount = "Minimum spend cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    startTransition(async () => {
      try {
        const data = new FormData();
        data.set("name", formData.name);
        data.set("description", formData.description);
        data.set("qualification_requirement", formData.qualification_requirement);
        data.set("minimum_spend_amount", String(formData.minimum_spend_amount));
        data.set("minimum_receipt_amount", formData.minimum_receipt_amount ? String(formData.minimum_receipt_amount) : "");
        data.set("tier_level", String(formData.tier_level));
        data.set("card_color", formData.card_color);
        data.set("is_active", String(formData.is_active));
        data.set("sort_order", String(formData.sort_order));

        const result = mode === "create"
          ? await createVipTier(data)
          : await updateVipTier(tier!.id, data);

        if (result.success) {
          toast.success(result.message);
          router.push("/vip");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to save tier");
        }
      } catch (error) {
        toast.error("An error occurred");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button type="submit" disabled={isPending}>
          <Save className="mr-2 h-4 w-4" />
          {isPending ? "Saving..." : mode === "create" ? "Create Tier" : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Tier Information
              </CardTitle>
              <CardDescription>
                Basic details about the VIP tier
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" required>Tier Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="e.g., Gold Member"
                    error={!!errors.name}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                {/* Tier Level */}
                <div className="space-y-2">
                  <Label htmlFor="tier_level" required>Tier Level</Label>
                  <Input
                    id="tier_level"
                    type="number"
                    min={1}
                    max={10}
                    value={formData.tier_level}
                    onChange={(e) => updateField("tier_level", Number(e.target.value))}
                    error={!!errors.tier_level}
                  />
                  {errors.tier_level && (
                    <p className="text-sm text-destructive">{errors.tier_level}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Higher level = more exclusive (1-10)
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" required>Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Describe this VIP tier and its value..."
                  rows={3}
                  error={!!errors.description}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/500 characters
                </p>
              </div>

              {/* Qualification Requirement */}
              <div className="space-y-2">
                <Label htmlFor="qualification_requirement" required>
                  Qualification Requirement
                </Label>
                <Textarea
                  id="qualification_requirement"
                  value={formData.qualification_requirement}
                  onChange={(e) => updateField("qualification_requirement", e.target.value)}
                  placeholder="Describe how customers can qualify for this tier..."
                  rows={3}
                  error={!!errors.qualification_requirement}
                />
                {errors.qualification_requirement && (
                  <p className="text-sm text-destructive">{errors.qualification_requirement}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Spend Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Spend Requirements
              </CardTitle>
              <CardDescription>
                Minimum spending thresholds for this tier
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Minimum Spend */}
                <div className="space-y-2">
                  <Label htmlFor="minimum_spend_amount">
                    Minimum Spend Amount (IDR)
                  </Label>
                  <Input
                    id="minimum_spend_amount"
                    type="number"
                    min={0}
                    step={100000}
                    value={formData.minimum_spend_amount}
                    onChange={(e) => updateField("minimum_spend_amount", Number(e.target.value))}
                    error={!!errors.minimum_spend_amount}
                  />
                  {errors.minimum_spend_amount && (
                    <p className="text-sm text-destructive">{errors.minimum_spend_amount}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Annual spending required to qualify
                  </p>
                </div>

                {/* Minimum Receipt */}
                <div className="space-y-2">
                  <Label htmlFor="minimum_receipt_amount">
                    Minimum Receipt Amount (IDR)
                  </Label>
                  <Input
                    id="minimum_receipt_amount"
                    type="number"
                    min={0}
                    step={50000}
                    value={formData.minimum_receipt_amount || ""}
                    onChange={(e) => updateField("minimum_receipt_amount", e.target.value ? Number(e.target.value) : null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum single transaction amount (optional)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Card Color */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Card Color
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Color Preview */}
              <div
                className="flex h-24 items-center justify-center rounded-xl text-white font-display font-bold text-xl shadow-lg"
                style={{ backgroundColor: formData.card_color }}
              >
                <Crown className="mr-2 h-6 w-6" />
                {formData.name || "VIP Card"}
              </div>

              {/* Preset Colors */}
              <div className="grid grid-cols-3 gap-2">
                {presetColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => updateField("card_color", color.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border p-2 transition-all",
                      formData.card_color === color.value
                        ? "border-primary ring-2 ring-primary ring-offset-2"
                        : "border-border hover:border-muted-foreground"
                    )}
                  >
                    <div
                      className="h-6 w-6 rounded-full"
                      style={{ backgroundColor: color.value }}
                    />
                    <span className="text-xs">{color.name}</span>
                  </button>
                ))}
              </div>

              {/* Custom Color */}
              <div className="space-y-2">
                <Label htmlFor="card_color">Custom Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="card_color"
                    value={formData.card_color}
                    onChange={(e) => updateField("card_color", e.target.value)}
                    placeholder="#000000"
                  />
                  <input
                    type="color"
                    value={formData.card_color}
                    onChange={(e) => updateField("card_color", e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded border border-border"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_active">Active</Label>
                  <p className="text-sm text-muted-foreground">
                    Available for new enrollments
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => updateField("is_active", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  min={0}
                  value={formData.sort_order}
                  onChange={(e) => updateField("sort_order", Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Display order on the VIP page
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
