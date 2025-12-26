// src/components/settings/analytics-settings-form.tsx
// Created: Analytics and tracking settings form

"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, BarChart3, Code } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalyticsSettings, saveAnalyticsSettings } from "@/actions/settings";
import type { AnalyticsSettings } from "@/lib/validations/settings";

// ============================================================================
// COMPONENT
// ============================================================================

export function AnalyticsSettingsForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState<AnalyticsSettings>({
    google_analytics_id: "",
    google_tag_manager_id: "",
    meta_pixel_id: "",
    tiktok_pixel_id: "",
    hotjar_id: "",
  });

  // Load settings
  useEffect(() => {
    getAnalyticsSettings().then((result) => {
      if (result.success) {
        setFormData(result.data);
      }
      setIsLoading(false);
    });
  }, []);

  // Update field
  const updateField = <K extends keyof AnalyticsSettings>(
    field: K,
    value: AnalyticsSettings[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await saveAnalyticsSettings(formData);
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
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Google Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Google Analytics
          </CardTitle>
          <CardDescription>
            Track website traffic and user behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* GA4 ID */}
            <div className="space-y-2">
              <Label htmlFor="google_analytics_id">Google Analytics 4 ID</Label>
              <Input
                id="google_analytics_id"
                value={formData.google_analytics_id}
                onChange={(e) => updateField("google_analytics_id", e.target.value)}
                placeholder="G-XXXXXXXXXX"
              />
              <p className="text-xs text-muted-foreground">
                Your GA4 Measurement ID (starts with G-)
              </p>
            </div>

            {/* GTM ID */}
            <div className="space-y-2">
              <Label htmlFor="google_tag_manager_id">Google Tag Manager ID</Label>
              <Input
                id="google_tag_manager_id"
                value={formData.google_tag_manager_id}
                onChange={(e) => updateField("google_tag_manager_id", e.target.value)}
                placeholder="GTM-XXXXXXX"
              />
              <p className="text-xs text-muted-foreground">
                Your GTM Container ID (starts with GTM-)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advertising Pixels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Advertising Pixels
          </CardTitle>
          <CardDescription>
            Track conversions from advertising platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Meta Pixel */}
            <div className="space-y-2">
              <Label htmlFor="meta_pixel_id">Meta (Facebook) Pixel ID</Label>
              <Input
                id="meta_pixel_id"
                value={formData.meta_pixel_id}
                onChange={(e) => updateField("meta_pixel_id", e.target.value)}
                placeholder="123456789012345"
              />
              <p className="text-xs text-muted-foreground">
                Your Facebook/Meta Pixel ID (15-16 digit number)
              </p>
            </div>

            {/* TikTok Pixel */}
            <div className="space-y-2">
              <Label htmlFor="tiktok_pixel_id">TikTok Pixel ID</Label>
              <Input
                id="tiktok_pixel_id"
                value={formData.tiktok_pixel_id}
                onChange={(e) => updateField("tiktok_pixel_id", e.target.value)}
                placeholder="XXXXXXXXXX"
              />
              <p className="text-xs text-muted-foreground">
                Your TikTok Pixel ID
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Other Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Other Analytics Tools</CardTitle>
          <CardDescription>
            Additional tracking and analytics services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Hotjar */}
          <div className="space-y-2">
            <Label htmlFor="hotjar_id">Hotjar Site ID</Label>
            <Input
              id="hotjar_id"
              value={formData.hotjar_id}
              onChange={(e) => updateField("hotjar_id", e.target.value)}
              placeholder="1234567"
            />
            <p className="text-xs text-muted-foreground">
              Your Hotjar Site ID for heatmaps and recordings
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Note */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> These tracking codes will be automatically injected into your website. 
          Changes may take a few minutes to appear on the live site. Make sure to test the 
          implementation using the respective platform's debugging tools.
        </p>
      </div>

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
