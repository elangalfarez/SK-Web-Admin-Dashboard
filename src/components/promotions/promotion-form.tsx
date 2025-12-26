// src/components/promotions/promotion-form.tsx
// Created: Promotion form component for create and edit

"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Eye, Store, Calendar, ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SingleImageUploader } from "@/components/shared/image-uploader";
import { createPromotion, updatePromotion, getTenants } from "@/actions/promotions";
import type { PromotionWithTenant, Tenant, PromotionStatus } from "@/types/database";

// ============================================================================
// TYPES
// ============================================================================

interface PromotionFormProps {
  promotion?: PromotionWithTenant;
  mode: "create" | "edit";
}

interface FormData {
  title: string;
  tenant_id: string;
  full_description: string;
  image_url: string | null;
  source_post: string;
  start_date: string;
  end_date: string;
  status: PromotionStatus;
}

// ============================================================================
// STATUS OPTIONS
// ============================================================================

const statusOptions: { value: PromotionStatus; label: string; description: string }[] = [
  { value: "staging", label: "Staging", description: "Draft - not visible to public" },
  { value: "published", label: "Published", description: "Live and visible to public" },
  { value: "expired", label: "Expired", description: "No longer active" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function PromotionForm({ promotion, mode }: PromotionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchTenant, setSearchTenant] = useState("");

  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: promotion?.title || "",
    tenant_id: promotion?.tenant_id || "",
    full_description: promotion?.full_description || "",
    image_url: promotion?.image_url || null,
    source_post: promotion?.source_post || "",
    start_date: promotion?.start_date ? promotion.start_date.slice(0, 10) : "",
    end_date: promotion?.end_date ? promotion.end_date.slice(0, 10) : "",
    status: promotion?.status || "staging",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch tenants on mount
  useEffect(() => {
    getTenants().then((result) => {
      if (result.success) {
        setTenants(result.data);
      }
    });
  }, []);

  // Filter tenants by search
  const filteredTenants = tenants.filter((tenant) =>
    tenant.name.toLowerCase().includes(searchTenant.toLowerCase()) ||
    tenant.tenant_code.toLowerCase().includes(searchTenant.toLowerCase())
  );

  // Get selected tenant
  const selectedTenant = tenants.find((t) => t.id === formData.tenant_id);

  // Update form field
  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
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

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }

    if (!formData.tenant_id) {
      newErrors.tenant_id = "Please select a tenant";
    }

    if (formData.end_date && formData.start_date && formData.end_date < formData.start_date) {
      newErrors.end_date = "End date must be after start date";
    }

    if (formData.source_post && !formData.source_post.startsWith("http")) {
      newErrors.source_post = "Please enter a valid URL";
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
        // Create FormData object
        const data = new FormData();
        data.set("title", formData.title);
        data.set("tenant_id", formData.tenant_id);
        data.set("full_description", formData.full_description);
        data.set("image_url", formData.image_url || "");
        data.set("source_post", formData.source_post || "");
        data.set("start_date", formData.start_date || "");
        data.set("end_date", formData.end_date || "");
        data.set("status", formData.status);

        const result = mode === "create"
          ? await createPromotion(data)
          : await updatePromotion(promotion!.id, data);

        if (result.success) {
          toast.success(result.message);
          router.push("/promotions");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to save promotion");
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
        <div className="flex items-center gap-2">
          {promotion && (
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open(`/promotions/${promotion.id}`, "_blank")}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            <Save className="mr-2 h-4 w-4" />
            {isPending ? "Saving..." : mode === "create" ? "Create Promotion" : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Promotion Details</CardTitle>
              <CardDescription>
                Basic information about the promotion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" required>Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Enter promotion title"
                  error={!!errors.title}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="full_description">Description</Label>
                <Textarea
                  id="full_description"
                  value={formData.full_description}
                  onChange={(e) => updateField("full_description", e.target.value)}
                  placeholder="Describe the promotion, terms & conditions, etc."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.full_description.length}/2000 characters
                </p>
              </div>

              {/* Source Post */}
              <div className="space-y-2">
                <Label htmlFor="source_post" className="flex items-center gap-1">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Source URL
                </Label>
                <Input
                  id="source_post"
                  type="url"
                  value={formData.source_post}
                  onChange={(e) => updateField("source_post", e.target.value)}
                  placeholder="https://instagram.com/p/..."
                  error={!!errors.source_post}
                />
                {errors.source_post && (
                  <p className="text-sm text-destructive">{errors.source_post}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Link to the original post (Instagram, Facebook, etc.)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Image */}
          <Card>
            <CardHeader>
              <CardTitle>Promotion Image</CardTitle>
              <CardDescription>
                Upload a promotional image or banner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SingleImageUploader
                value={formData.image_url}
                onChange={(url) => updateField("image_url", url)}
                bucket="PROMOTIONS"
                folder="promotions"
                aspectRatio="video"
                placeholder="Upload promotion image"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tenant Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Tenant
              </CardTitle>
              <CardDescription>
                Select the tenant offering this promotion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={formData.tenant_id}
                onValueChange={(value) => updateField("tenant_id", value)}
              >
                <SelectTrigger className={cn(errors.tenant_id && "border-destructive")}>
                  <SelectValue placeholder="Select a tenant" />
                </SelectTrigger>
                <SelectContent>
                  <div className="sticky top-0 bg-popover p-2 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search tenants..."
                        value={searchTenant}
                        onChange={(e) => setSearchTenant(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {filteredTenants.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        No tenants found
                      </div>
                    ) : (
                      filteredTenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          <span className="flex items-center gap-2">
                            {tenant.logo_url ? (
                              <img
                                src={tenant.logo_url}
                                alt=""
                                className="h-6 w-6 rounded object-cover"
                              />
                            ) : (
                              <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                                <Store className="h-3 w-3 text-muted-foreground" />
                              </div>
                            )}
                            <span>{tenant.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({tenant.tenant_code})
                            </span>
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </div>
                </SelectContent>
              </Select>
              {errors.tenant_id && (
                <p className="text-sm text-destructive">{errors.tenant_id}</p>
              )}

              {/* Selected tenant preview */}
              {selectedTenant && (
                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  {selectedTenant.logo_url ? (
                    <img
                      src={selectedTenant.logo_url}
                      alt={selectedTenant.name}
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                      <Store className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{selectedTenant.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedTenant.tenant_code} • {selectedTenant.main_floor}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Date Range */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Validity Period
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => updateField("start_date", e.target.value)}
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => updateField("end_date", e.target.value)}
                  error={!!errors.end_date}
                />
                {errors.end_date && (
                  <p className="text-sm text-destructive">{errors.end_date}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statusOptions.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                      formData.status === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={option.value}
                      checked={formData.status === option.value}
                      onChange={() => updateField("status", option.value)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
