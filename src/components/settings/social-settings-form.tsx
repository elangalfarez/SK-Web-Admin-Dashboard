// src/components/settings/social-settings-form.tsx
// Created: Social media links settings form

"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Share2,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSocialSettings, saveSocialSettings } from "@/actions/settings";
import type { SocialSettings } from "@/lib/validations/settings";

// ============================================================================
// TIKTOK ICON
// ============================================================================

function TiktokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SocialSettingsForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState<SocialSettings>({
    facebook_url: "",
    instagram_url: "",
    twitter_url: "",
    youtube_url: "",
    tiktok_url: "",
    linkedin_url: "",
    whatsapp_number: "",
  });

  // Load settings
  useEffect(() => {
    getSocialSettings().then((result) => {
      if (result.success) {
        setFormData(result.data);
      }
      setIsLoading(false);
    });
  }, []);

  // Update field
  const updateField = <K extends keyof SocialSettings>(
    field: K,
    value: SocialSettings[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await saveSocialSettings(formData);
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
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Social Media Links
          </CardTitle>
          <CardDescription>
            Connect your social media profiles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Facebook */}
            <div className="space-y-2">
              <Label htmlFor="facebook_url" className="flex items-center gap-2">
                <Facebook className="h-4 w-4 text-[#1877F2]" />
                Facebook
              </Label>
              <Input
                id="facebook_url"
                type="url"
                value={formData.facebook_url}
                onChange={(e) => updateField("facebook_url", e.target.value)}
                placeholder="https://facebook.com/supermalkarawaci"
              />
            </div>

            {/* Instagram */}
            <div className="space-y-2">
              <Label htmlFor="instagram_url" className="flex items-center gap-2">
                <Instagram className="h-4 w-4 text-[#E4405F]" />
                Instagram
              </Label>
              <Input
                id="instagram_url"
                type="url"
                value={formData.instagram_url}
                onChange={(e) => updateField("instagram_url", e.target.value)}
                placeholder="https://instagram.com/supermalkarawaci"
              />
            </div>

            {/* Twitter/X */}
            <div className="space-y-2">
              <Label htmlFor="twitter_url" className="flex items-center gap-2">
                <Twitter className="h-4 w-4" />
                Twitter / X
              </Label>
              <Input
                id="twitter_url"
                type="url"
                value={formData.twitter_url}
                onChange={(e) => updateField("twitter_url", e.target.value)}
                placeholder="https://twitter.com/supermalkarawaci"
              />
            </div>

            {/* YouTube */}
            <div className="space-y-2">
              <Label htmlFor="youtube_url" className="flex items-center gap-2">
                <Youtube className="h-4 w-4 text-[#FF0000]" />
                YouTube
              </Label>
              <Input
                id="youtube_url"
                type="url"
                value={formData.youtube_url}
                onChange={(e) => updateField("youtube_url", e.target.value)}
                placeholder="https://youtube.com/@supermalkarawaci"
              />
            </div>

            {/* TikTok */}
            <div className="space-y-2">
              <Label htmlFor="tiktok_url" className="flex items-center gap-2">
                <TiktokIcon className="h-4 w-4" />
                TikTok
              </Label>
              <Input
                id="tiktok_url"
                type="url"
                value={formData.tiktok_url}
                onChange={(e) => updateField("tiktok_url", e.target.value)}
                placeholder="https://tiktok.com/@supermalkarawaci"
              />
            </div>

            {/* LinkedIn */}
            <div className="space-y-2">
              <Label htmlFor="linkedin_url" className="flex items-center gap-2">
                <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                LinkedIn
              </Label>
              <Input
                id="linkedin_url"
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => updateField("linkedin_url", e.target.value)}
                placeholder="https://linkedin.com/company/supermalkarawaci"
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div className="space-y-2">
            <Label htmlFor="whatsapp_number" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              WhatsApp Number
            </Label>
            <Input
              id="whatsapp_number"
              value={formData.whatsapp_number}
              onChange={(e) => updateField("whatsapp_number", e.target.value)}
              placeholder="6281234567890"
            />
            <p className="text-xs text-muted-foreground">
              Enter number with country code, no + or spaces (e.g., 6281234567890)
            </p>
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
