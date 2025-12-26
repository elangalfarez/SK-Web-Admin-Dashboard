// src/components/settings/contact-settings-form.tsx
// Created: Contact information settings form

"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, MapPin, Phone, Mail, Map } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getContactSettings, saveContactSettings } from "@/actions/settings";
import type { ContactSettings } from "@/lib/validations/settings";

// ============================================================================
// COMPONENT
// ============================================================================

export function ContactSettingsForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState<ContactSettings>({
    address: "",
    city: "Tangerang",
    postal_code: "",
    country: "Indonesia",
    phone_primary: "",
    phone_secondary: "",
    email_general: "",
    email_marketing: "",
    email_leasing: "",
    google_maps_url: "",
    google_maps_embed: "",
    latitude: "",
    longitude: "",
  });

  // Load settings
  useEffect(() => {
    getContactSettings().then((result) => {
      if (result.success) {
        setFormData(result.data);
      }
      setIsLoading(false);
    });
  }, []);

  // Update field
  const updateField = <K extends keyof ContactSettings>(
    field: K,
    value: ContactSettings[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await saveContactSettings(formData);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Physical Address
          </CardTitle>
          <CardDescription>
            Mall location and address information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Street Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="Jl. Boulevard Diponegoro No.105"
              rows={2}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => updateField("city", e.target.value)}
                placeholder="Tangerang"
              />
            </div>

            {/* Postal Code */}
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => updateField("postal_code", e.target.value)}
                placeholder="15811"
              />
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => updateField("country", e.target.value)}
                placeholder="Indonesia"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Numbers & Emails */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contact Information
          </CardTitle>
          <CardDescription>
            Phone numbers and email addresses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Primary Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone_primary">Primary Phone</Label>
              <Input
                id="phone_primary"
                value={formData.phone_primary}
                onChange={(e) => updateField("phone_primary", e.target.value)}
                placeholder="+62 21 5460 8000"
              />
            </div>

            {/* Secondary Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone_secondary">Secondary Phone</Label>
              <Input
                id="phone_secondary"
                value={formData.phone_secondary}
                onChange={(e) => updateField("phone_secondary", e.target.value)}
                placeholder="+62 21 5460 8001"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* General Email */}
            <div className="space-y-2">
              <Label htmlFor="email_general">
                <Mail className="mr-1 inline h-3 w-3" />
                General Inquiries
              </Label>
              <Input
                id="email_general"
                type="email"
                value={formData.email_general}
                onChange={(e) => updateField("email_general", e.target.value)}
                placeholder="info@supermalkarawaci.co.id"
              />
            </div>

            {/* Marketing Email */}
            <div className="space-y-2">
              <Label htmlFor="email_marketing">
                <Mail className="mr-1 inline h-3 w-3" />
                Marketing
              </Label>
              <Input
                id="email_marketing"
                type="email"
                value={formData.email_marketing}
                onChange={(e) => updateField("email_marketing", e.target.value)}
                placeholder="marketing@supermalkarawaci.co.id"
              />
            </div>

            {/* Leasing Email */}
            <div className="space-y-2">
              <Label htmlFor="email_leasing">
                <Mail className="mr-1 inline h-3 w-3" />
                Leasing
              </Label>
              <Input
                id="email_leasing"
                type="email"
                value={formData.email_leasing}
                onChange={(e) => updateField("email_leasing", e.target.value)}
                placeholder="leasing@supermalkarawaci.co.id"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map & Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Map & Coordinates
          </CardTitle>
          <CardDescription>
            Google Maps integration for the contact page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google Maps URL */}
          <div className="space-y-2">
            <Label htmlFor="google_maps_url">Google Maps Link</Label>
            <Input
              id="google_maps_url"
              type="url"
              value={formData.google_maps_url}
              onChange={(e) => updateField("google_maps_url", e.target.value)}
              placeholder="https://maps.google.com/..."
            />
            <p className="text-xs text-muted-foreground">
              Link that opens when visitors click "Get Directions"
            </p>
          </div>

          {/* Embed Code */}
          <div className="space-y-2">
            <Label htmlFor="google_maps_embed">Google Maps Embed Code</Label>
            <Textarea
              id="google_maps_embed"
              value={formData.google_maps_embed}
              onChange={(e) => updateField("google_maps_embed", e.target.value)}
              placeholder='<iframe src="https://www.google.com/maps/embed?..." ...'
              rows={3}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Paste the iframe embed code from Google Maps
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Latitude */}
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                value={formData.latitude}
                onChange={(e) => updateField("latitude", e.target.value)}
                placeholder="-6.2297"
              />
            </div>

            {/* Longitude */}
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                value={formData.longitude}
                onChange={(e) => updateField("longitude", e.target.value)}
                placeholder="106.6186"
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
