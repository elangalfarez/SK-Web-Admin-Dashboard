// src/components/tenants/tenant-form.tsx
// Created: Tenant form component for create and edit

"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Eye, Store, Building2, Phone, FolderOpen, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SingleImageUploader } from "@/components/shared/image-uploader";
import { OperatingHoursEditor } from "./operating-hours-editor";
import { createTenant, updateTenant, getTenantCategories, getMallFloors } from "@/actions/tenants";
import type { TenantWithCategory } from "@/actions/tenants";
import type { TenantCategory, OperatingHours, MallFloor } from "@/types/database";

// ============================================================================
// TYPES
// ============================================================================

interface TenantFormProps {
  tenant?: TenantWithCategory;
  mode: "create" | "edit";
}

interface FormData {
  tenant_code: string;
  name: string;
  category_id: string;
  description: string;
  main_floor: string;
  operating_hours: OperatingHours | null;
  phone: string;
  logo_url: string | null;
  banner_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_new_tenant: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TenantForm({ tenant, mode }: TenantFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<TenantCategory[]>([]);
  const [floors, setFloors] = useState<MallFloor[]>([]);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    tenant_code: tenant?.tenant_code || "",
    name: tenant?.name || "",
    category_id: tenant?.category_id || "",
    description: tenant?.description || "",
    main_floor: tenant?.main_floor || "",
    operating_hours: tenant?.operating_hours || null,
    phone: tenant?.phone || "",
    logo_url: tenant?.logo_url || null,
    banner_url: tenant?.banner_url || null,
    is_active: tenant?.is_active ?? true,
    is_featured: tenant?.is_featured ?? false,
    is_new_tenant: tenant?.is_new_tenant ?? false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch categories and floors on mount
  useEffect(() => {
    getTenantCategories().then((result) => {
      if (result.success) {
        setCategories(result.data);
      }
    });

    getMallFloors().then((result) => {
      if (result.success) {
        setFloors(result.data);
      }
    });
  }, []);

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

    if (!formData.tenant_code.trim()) {
      newErrors.tenant_code = "Tenant code is required";
    } else if (!/^[A-Z0-9-]+$/.test(formData.tenant_code.toUpperCase())) {
      newErrors.tenant_code = "Tenant code must be uppercase alphanumeric with dashes";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.category_id) {
      newErrors.category_id = "Please select a category";
    }

    if (!formData.main_floor) {
      newErrors.main_floor = "Please select a floor";
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
        data.set("tenant_code", formData.tenant_code.toUpperCase());
        data.set("name", formData.name);
        data.set("category_id", formData.category_id);
        data.set("description", formData.description);
        data.set("main_floor", formData.main_floor);
        data.set("operating_hours", JSON.stringify(formData.operating_hours || {}));
        data.set("phone", formData.phone);
        data.set("logo_url", formData.logo_url || "");
        data.set("banner_url", formData.banner_url || "");
        data.set("is_active", String(formData.is_active));
        data.set("is_featured", String(formData.is_featured));
        data.set("is_new_tenant", String(formData.is_new_tenant));

        const result = mode === "create"
          ? await createTenant(data)
          : await updateTenant(tenant!.id, data);

        if (result.success) {
          toast.success(result.message);
          router.push("/tenants");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to save tenant");
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
          {tenant && (
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open(`/tenants/${tenant.id}`, "_blank")}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            <Save className="mr-2 h-4 w-4" />
            {isPending ? "Saving..." : mode === "create" ? "Create Tenant" : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                General tenant details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tenant Code */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tenant_code" required>Tenant Code</Label>
                  <Input
                    id="tenant_code"
                    value={formData.tenant_code}
                    onChange={(e) => updateField("tenant_code", e.target.value.toUpperCase())}
                    placeholder="e.g., STORE-001"
                    error={!!errors.tenant_code}
                    className="uppercase"
                  />
                  {errors.tenant_code && (
                    <p className="text-sm text-destructive">{errors.tenant_code}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="e.g., +62 21 1234567"
                  />
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" required>Store Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Enter store name"
                  error={!!errors.name}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Describe the store, products, services..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/2000 characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Location & Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Location & Hours</CardTitle>
              <CardDescription>
                Store location and operating schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category & Floor */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Category */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1" required>
                    <FolderOpen className="h-3.5 w-3.5" />
                    Category
                  </Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => updateField("category_id", value)}
                  >
                    <SelectTrigger className={cn(errors.category_id && "border-destructive")}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <span className="flex items-center gap-2">
                            {category.color && (
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                            )}
                            {category.display_name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category_id && (
                    <p className="text-sm text-destructive">{errors.category_id}</p>
                  )}
                </div>

                {/* Floor */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1" required>
                    <Building2 className="h-3.5 w-3.5" />
                    Floor
                  </Label>
                  <Select
                    value={formData.main_floor}
                    onValueChange={(value) => updateField("main_floor", value)}
                  >
                    <SelectTrigger className={cn(errors.main_floor && "border-destructive")}>
                      <SelectValue placeholder="Select floor" />
                    </SelectTrigger>
                    <SelectContent>
                      {floors.map((floor) => (
                        <SelectItem key={floor.id} value={floor.floor_code}>
                          {floor.floor_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.main_floor && (
                    <p className="text-sm text-destructive">{errors.main_floor}</p>
                  )}
                </div>
              </div>

              {/* Operating Hours */}
              <OperatingHoursEditor
                value={formData.operating_hours}
                onChange={(hours) => updateField("operating_hours", hours)}
              />
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
              <CardDescription>
                Store logo and banner image
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Logo */}
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <SingleImageUploader
                    value={formData.logo_url}
                    onChange={(url) => updateField("logo_url", url)}
                    bucket="TENANTS"
                    folder="logos"
                    aspectRatio="square"
                    placeholder="Upload logo"
                  />
                </div>

                {/* Banner */}
                <div className="space-y-2">
                  <Label>Banner</Label>
                  <SingleImageUploader
                    value={formData.banner_url}
                    onChange={(url) => updateField("banner_url", url)}
                    bucket="TENANTS"
                    folder="banners"
                    aspectRatio="video"
                    placeholder="Upload banner"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Active toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_active">Active</Label>
                  <p className="text-sm text-muted-foreground">
                    Show tenant in directory
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => updateField("is_active", checked)}
                />
              </div>

              {/* Featured toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  <div>
                    <Label htmlFor="is_featured">Featured</Label>
                    <p className="text-sm text-muted-foreground">
                      Highlight in featured sections
                    </p>
                  </div>
                </div>
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => updateField("is_featured", checked)}
                />
              </div>

              {/* New tenant toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-info" />
                  <div>
                    <Label htmlFor="is_new_tenant">New Tenant</Label>
                    <p className="text-sm text-muted-foreground">
                      Show "New" badge
                    </p>
                  </div>
                </div>
                <Switch
                  id="is_new_tenant"
                  checked={formData.is_new_tenant}
                  onCheckedChange={(checked) => updateField("is_new_tenant", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {(formData.logo_url || formData.name) && (
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  {formData.logo_url ? (
                    <img
                      src={formData.logo_url}
                      alt={formData.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                      <Store className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {formData.name || "Store Name"}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {formData.tenant_code || "CODE"} • {formData.main_floor || "Floor"}
                    </p>
                  </div>
                  {formData.is_new_tenant && (
                    <Badge variant="info" className="shrink-0">New</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </form>
  );
}

// Import Badge for preview card
import { Badge } from "@/components/ui/badge";
