// src/components/settings/general-settings-form.tsx
// Created: General settings form component

"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Building2, Globe, Image } from "lucide-react";
import { toast } from "sonner";
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
import { getGeneralSettings, saveGeneralSettings } from "@/actions/settings";
import type { GeneralSettings } from "@/lib/validations/settings";

// ============================================================================
// TIMEZONE OPTIONS
// ============================================================================

const timezones = [
  { value: "Asia/Jakarta", label: "WIB (Jakarta)" },
  { value: "Asia/Makassar", label: "WITA (Makassar)" },
  { value: "Asia/Jayapura", label: "WIT (Jayapura)" },
];

const languages = [
  { value: "id", label: "Bahasa Indonesia" },
  { value: "en", label: "English" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function GeneralSettingsForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState<GeneralSettings>({
    site_name: "Supermal Karawaci",
    site_tagline: "",
    site_description: "",
    logo_url: "",
    logo_dark_url: "",
    favicon_url: "",
    default_language: "id",
    timezone: "Asia/Jakarta",
  });

  // Load settings
  useEffect(() => {
    getGeneralSettings().then((result) => {
      if (result.success) {
        setFormData(result.data);
      }
      setIsLoading(false);
    });
  }, []);

  // Update field
  const updateField = <K extends keyof GeneralSettings>(
    field: K,
    value: GeneralSettings[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await saveGeneralSettings(formData);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-6 w-32 animate-pulse rounded bg-muted" />
                <div className="h-10 w-full animate-pulse rounded bg-muted" />
                <div className="h-10 w-full animate-pulse rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Site Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Site Identity
          </CardTitle>
          <CardDescription>
            Basic information about your website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Site Name */}
          <div className="space-y-2">
            <Label htmlFor="site_name" required>Site Name</Label>
            <Input
              id="site_name"
              value={formData.site_name}
              onChange={(e) => updateField("site_name", e.target.value)}
              placeholder="Supermal Karawaci"
            />
          </div>

          {/* Tagline */}
          <div className="space-y-2">
            <Label htmlFor="site_tagline">Tagline</Label>
            <Input
              id="site_tagline"
              value={formData.site_tagline}
              onChange={(e) => updateField("site_tagline", e.target.value)}
              placeholder="Your one-stop shopping destination"
            />
            <p className="text-xs text-muted-foreground">
              A short phrase that describes your site
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="site_description">Site Description</Label>
            <Textarea
              id="site_description"
              value={formData.site_description}
              onChange={(e) => updateField("site_description", e.target.value)}
              placeholder="Describe your mall..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {formData.site_description?.length || 0}/500 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Logo & Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Logo & Branding
          </CardTitle>
          <CardDescription>
            Upload your site logo and favicon
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Logo */}
            <div className="space-y-2">
              <Label>Logo (Light Mode)</Label>
              <SingleImageUploader
                value={formData.logo_url || null}
                onChange={(url) => updateField("logo_url", url || "")}
                bucket="GENERAL"
                folder="logos"
                aspectRatio="video"
                maxSize={1048576}
              />
              <p className="text-xs text-muted-foreground">
                Recommended: PNG or SVG with transparent background
              </p>
            </div>

            {/* Logo Dark */}
            <div className="space-y-2">
              <Label>Logo (Dark Mode)</Label>
              <SingleImageUploader
                value={formData.logo_dark_url || null}
                onChange={(url) => updateField("logo_dark_url", url || "")}
                bucket="GENERAL"
                folder="logos"
                aspectRatio="video"
                maxSize={1048576}
              />
              <p className="text-xs text-muted-foreground">
                Used when dark mode is active
              </p>
            </div>
          </div>

          {/* Favicon */}
          <div className="space-y-2">
            <Label>Favicon</Label>
            <SingleImageUploader
              value={formData.favicon_url || null}
              onChange={(url) => updateField("favicon_url", url || "")}
              bucket="GENERAL"
              folder="favicons"
              aspectRatio="square"
              maxSize={524288}
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 32x32 or 64x64 pixels, PNG or ICO format
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Regional Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Regional Settings
          </CardTitle>
          <CardDescription>
            Language and timezone preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="default_language">Default Language</Label>
              <Select
                value={formData.default_language}
                onValueChange={(value) => updateField("default_language", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => updateField("timezone", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          <Save className="mr-2 h-4 w-4" />
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
