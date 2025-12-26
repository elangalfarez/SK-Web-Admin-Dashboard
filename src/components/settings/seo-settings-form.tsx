// src/components/settings/seo-settings-form.tsx
// Created: SEO and meta tags settings form

"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Search, Globe, Twitter, Share2, Shield } from "lucide-react";
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
import { ImageUploader } from "@/components/shared/image-uploader";
import { getSeoSettings, saveSeoSettings } from "@/actions/settings";
import type { SeoSettings } from "@/lib/validations/settings";

// ============================================================================
// COMPONENT
// ============================================================================

export function SeoSettingsForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState<SeoSettings>({
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    og_title: "",
    og_description: "",
    og_image_url: "",
    og_type: "website",
    twitter_card: "summary_large_image",
    twitter_site: "",
    twitter_creator: "",
    canonical_url: "",
    robots: "index, follow",
    google_site_verification: "",
    bing_site_verification: "",
  });

  // Load settings
  useEffect(() => {
    getSeoSettings().then((result) => {
      if (result.success) {
        setFormData(result.data);
      }
      setIsLoading(false);
    });
  }, []);

  // Update field
  const updateField = <K extends keyof SeoSettings>(
    field: K,
    value: SeoSettings[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await saveSeoSettings(formData);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  // Character count helpers
  const getTitleStatus = (length: number) => {
    if (length === 0) return { color: "text-muted-foreground", text: "Not set" };
    if (length <= 60) return { color: "text-success", text: "Good" };
    if (length <= 70) return { color: "text-warning", text: "Acceptable" };
    return { color: "text-destructive", text: "Too long" };
  };

  const getDescStatus = (length: number) => {
    if (length === 0) return { color: "text-muted-foreground", text: "Not set" };
    if (length >= 120 && length <= 160) return { color: "text-success", text: "Good" };
    if (length < 120) return { color: "text-warning", text: "Too short" };
    return { color: "text-destructive", text: "Too long" };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-6 w-32 animate-pulse rounded bg-muted" />
                <div className="h-10 w-full animate-pulse rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const titleStatus = getTitleStatus(formData.meta_title?.length || 0);
  const descStatus = getDescStatus(formData.meta_description?.length || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Engine Optimization
          </CardTitle>
          <CardDescription>
            Control how your site appears in search results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Meta Title */}
          <div className="space-y-2">
            <Label htmlFor="meta_title">Meta Title</Label>
            <Input
              id="meta_title"
              value={formData.meta_title}
              onChange={(e) => updateField("meta_title", e.target.value)}
              placeholder="Supermal Karawaci - Premier Shopping Destination"
            />
            <div className="flex items-center justify-between text-xs">
              <span className={cn(titleStatus.color)}>
                {formData.meta_title?.length || 0}/70 characters • {titleStatus.text}
              </span>
            </div>
          </div>

          {/* Meta Description */}
          <div className="space-y-2">
            <Label htmlFor="meta_description">Meta Description</Label>
            <Textarea
              id="meta_description"
              value={formData.meta_description}
              onChange={(e) => updateField("meta_description", e.target.value)}
              placeholder="Discover the best shopping, dining, and entertainment at Supermal Karawaci..."
              rows={3}
            />
            <div className="flex items-center justify-between text-xs">
              <span className={cn(descStatus.color)}>
                {formData.meta_description?.length || 0}/160 characters • {descStatus.text}
              </span>
              <span className="text-muted-foreground">Aim for 120-160 characters</span>
            </div>
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label htmlFor="meta_keywords">Keywords</Label>
            <Input
              id="meta_keywords"
              value={formData.meta_keywords}
              onChange={(e) => updateField("meta_keywords", e.target.value)}
              placeholder="shopping mall, tangerang, karawaci, retail, entertainment"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated keywords (less important for modern SEO)
            </p>
          </div>

          {/* Canonical URL */}
          <div className="space-y-2">
            <Label htmlFor="canonical_url">Canonical URL</Label>
            <Input
              id="canonical_url"
              type="url"
              value={formData.canonical_url}
              onChange={(e) => updateField("canonical_url", e.target.value)}
              placeholder="https://supermalkarawaci.co.id"
            />
            <p className="text-xs text-muted-foreground">
              The preferred URL for your homepage
            </p>
          </div>

          {/* Robots */}
          <div className="space-y-2">
            <Label htmlFor="robots">Robots Directive</Label>
            <Select
              value={formData.robots}
              onValueChange={(value) => updateField("robots", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select robots directive" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="index, follow">Index, Follow (Default)</SelectItem>
                <SelectItem value="index, nofollow">Index, No Follow</SelectItem>
                <SelectItem value="noindex, follow">No Index, Follow</SelectItem>
                <SelectItem value="noindex, nofollow">No Index, No Follow</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Open Graph */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Open Graph (Facebook, LinkedIn)
          </CardTitle>
          <CardDescription>
            Control how your site appears when shared on social media
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* OG Title */}
            <div className="space-y-2">
              <Label htmlFor="og_title">OG Title</Label>
              <Input
                id="og_title"
                value={formData.og_title}
                onChange={(e) => updateField("og_title", e.target.value)}
                placeholder="Leave empty to use meta title"
              />
            </div>

            {/* OG Type */}
            <div className="space-y-2">
              <Label htmlFor="og_type">OG Type</Label>
              <Select
                value={formData.og_type}
                onValueChange={(value) => updateField("og_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="business.business">Business</SelectItem>
                  <SelectItem value="place">Place</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* OG Description */}
          <div className="space-y-2">
            <Label htmlFor="og_description">OG Description</Label>
            <Textarea
              id="og_description"
              value={formData.og_description}
              onChange={(e) => updateField("og_description", e.target.value)}
              placeholder="Leave empty to use meta description"
              rows={2}
            />
          </div>

          {/* OG Image */}
          <div className="space-y-2">
            <Label>OG Image</Label>
            <ImageUploader
              value={formData.og_image_url}
              onChange={(url) => updateField("og_image_url", url)}
              bucket="settings"
              path="og-images"
              aspectRatio="video"
              maxSize={2}
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 1200×630 pixels for best display on social platforms
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Twitter Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Twitter className="h-5 w-5" />
            Twitter Card
          </CardTitle>
          <CardDescription>
            Control how your site appears on Twitter/X
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Card Type */}
            <div className="space-y-2">
              <Label htmlFor="twitter_card">Card Type</Label>
              <Select
                value={formData.twitter_card}
                onValueChange={(value: "summary" | "summary_large_image") =>
                  updateField("twitter_card", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select card type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary_large_image">Large Image</SelectItem>
                  <SelectItem value="summary">Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Site Handle */}
            <div className="space-y-2">
              <Label htmlFor="twitter_site">Site Handle</Label>
              <Input
                id="twitter_site"
                value={formData.twitter_site}
                onChange={(e) => updateField("twitter_site", e.target.value)}
                placeholder="@supermalkarawaci"
              />
            </div>

            {/* Creator Handle */}
            <div className="space-y-2">
              <Label htmlFor="twitter_creator">Creator Handle</Label>
              <Input
                id="twitter_creator"
                value={formData.twitter_creator}
                onChange={(e) => updateField("twitter_creator", e.target.value)}
                placeholder="@supermalkarawaci"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Site Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Site Verification
          </CardTitle>
          <CardDescription>
            Verify ownership with search engines
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Google */}
            <div className="space-y-2">
              <Label htmlFor="google_site_verification">
                <Globe className="mr-1 inline h-3 w-3" />
                Google Search Console
              </Label>
              <Input
                id="google_site_verification"
                value={formData.google_site_verification}
                onChange={(e) => updateField("google_site_verification", e.target.value)}
                placeholder="Verification code"
              />
            </div>

            {/* Bing */}
            <div className="space-y-2">
              <Label htmlFor="bing_site_verification">
                <Globe className="mr-1 inline h-3 w-3" />
                Bing Webmaster Tools
              </Label>
              <Input
                id="bing_site_verification"
                value={formData.bing_site_verification}
                onChange={(e) => updateField("bing_site_verification", e.target.value)}
                placeholder="Verification code"
              />
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
