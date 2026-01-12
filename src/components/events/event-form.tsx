// src/components/events/event-form.tsx
// Created: Event form component for create and edit

"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Save, ArrowLeft, Eye } from "lucide-react";
import { toast } from "sonner";
import { generateSlug } from "@/lib/utils/slug";
import { convertUTCToLocal, convertLocalToUTC, APP_TIMEZONE } from "@/lib/utils/timezone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "@/components/shared/image-uploader";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { TagInput } from "@/components/shared/tag-input";
import { createEvent, updateEvent, getEventTags } from "@/actions/events";
import type { Event } from "@/types/database";

// ============================================================================
// TYPES
// ============================================================================

interface EventFormProps {
  event?: Event;
  mode: "create" | "edit";
}

interface FormData {
  title: string;
  slug: string;
  summary: string;
  body: string;
  start_at: string;
  end_at: string;
  venue: string;
  images: string[];
  tags: string[];
  is_published: boolean;
  is_featured: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EventForm({ event, mode }: EventFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: event?.title || "",
    slug: event?.slug || "",
    summary: event?.summary || "",
    body: event?.body || "",
    // Convert UTC times from database to Asia/Jakarta time for form display
    start_at: event?.start_at ? convertUTCToLocal(event.start_at) : "",
    end_at: event?.end_at ? convertUTCToLocal(event.end_at) : "",
    venue: event?.venue || "",
    images: event?.images || [],
    tags: event?.tags || [],
    is_published: event?.is_published || false,
    is_featured: event?.is_featured || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoSlug, setAutoSlug] = useState(!event);

  // Fetch available tags for autocomplete
  useEffect(() => {
    getEventTags().then((result) => {
      if (result.success) {
        setAvailableTags(result.data);
      }
    });
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (autoSlug && formData.title) {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(formData.title),
      }));
    }
  }, [formData.title, autoSlug]);

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

    if (!formData.slug.trim()) {
      newErrors.slug = "Slug is required";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug)) {
      newErrors.slug = "Slug must be lowercase with hyphens only";
    }

    if (!formData.start_at) {
      newErrors.start_at = "Start date is required";
    }

    if (formData.end_at && formData.start_at && formData.end_at < formData.start_at) {
      newErrors.end_at = "End date must be after start date";
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
        // Transform images array to proper format with url, alt, and caption
        // Check if images are already objects (edit mode) or just strings (create mode)
        const imagesWithMetadata = formData.images.map((item, index) => {
          // If item is already an object with url property, return as-is
          if (typeof item === 'object' && item !== null && 'url' in item) {
            return item;
          }
          // If item is a string (URL), convert to object format
          return {
            url: item,
            alt: formData.title || "Event image",
            caption: index === 0 ? "Cover image" : `Image ${index + 1}`,
          };
        });

        // Create FormData object
        const data = new FormData();
        data.set("title", formData.title);
        data.set("slug", formData.slug);
        data.set("summary", formData.summary);
        data.set("body", formData.body);
        // Convert Asia/Jakarta times to UTC for storage in database
        data.set("start_at", convertLocalToUTC(formData.start_at));
        data.set("end_at", formData.end_at ? convertLocalToUTC(formData.end_at) : "");
        data.set("venue", formData.venue);
        data.set("images", JSON.stringify(imagesWithMetadata));
        data.set("tags", JSON.stringify(formData.tags));
        data.set("is_published", String(formData.is_published));
        data.set("is_featured", String(formData.is_featured));

        const result = mode === "create"
          ? await createEvent(data)
          : await updateEvent(event!.id, data);

        if (result.success) {
          toast.success(result.message);
          router.push("/events");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to save event");
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
          {event && (
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open(`/events/${event.slug}`, "_blank")}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            <Save className="mr-2 h-4 w-4" />
            {isPending ? "Saving..." : mode === "create" ? "Create Event" : "Save Changes"}
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
                Event title, summary, and content
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
                  placeholder="Enter event title"
                  error={!!errors.title}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title}</p>
                )}
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="slug" required>Slug</Label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={autoSlug}
                      onChange={(e) => setAutoSlug(e.target.checked)}
                      className="h-4 w-4"
                    />
                    Auto-generate
                  </label>
                </div>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => {
                    setAutoSlug(false);
                    updateField("slug", e.target.value.toLowerCase());
                  }}
                  placeholder="event-url-slug"
                  error={!!errors.slug}
                />
                {errors.slug && (
                  <p className="text-sm text-destructive">{errors.slug}</p>
                )}
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => updateField("summary", e.target.value)}
                  placeholder="Brief description of the event"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.summary.length}/800 characters
                </p>
              </div>

              {/* Body */}
              <div className="space-y-2">
                <Label>Content</Label>
                <RichTextEditor
                  value={formData.body}
                  onChange={(value) => updateField("body", value)}
                  placeholder="Write detailed event description..."
                  minHeight="300px"
                />
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
              <CardDescription>
                Upload event images. First image will be used as cover.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUploader
                value={formData.images}
                onChange={(images) => updateField("images", images)}
                bucket="EVENTS"
                folder="events"
                maxImages={10}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="start_at" required>Start Date & Time</Label>
                <Input
                  id="start_at"
                  type="datetime-local"
                  value={formData.start_at}
                  onChange={(e) => updateField("start_at", e.target.value)}
                  error={!!errors.start_at}
                />
                <p className="text-xs text-muted-foreground">
                  Timezone: {APP_TIMEZONE} (GMT+7)
                </p>
                {errors.start_at && (
                  <p className="text-sm text-destructive">{errors.start_at}</p>
                )}
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="end_at">End Date & Time</Label>
                <Input
                  id="end_at"
                  type="datetime-local"
                  value={formData.end_at}
                  onChange={(e) => updateField("end_at", e.target.value)}
                  error={!!errors.end_at}
                />
                <p className="text-xs text-muted-foreground">
                  Timezone: {APP_TIMEZONE} (GMT+7)
                </p>
                {errors.end_at && (
                  <p className="text-sm text-destructive">{errors.end_at}</p>
                )}
              </div>

              {/* Venue */}
              <div className="space-y-2">
                <Label htmlFor="venue" className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Venue
                </Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => updateField("venue", e.target.value)}
                  placeholder="e.g., Main Atrium, Level G"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>
                Add tags to help categorize the event
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TagInput
                value={formData.tags}
                onChange={(tags) => updateField("tags", tags)}
                suggestions={availableTags}
                placeholder="Add tag..."
                maxTags={10}
              />
            </CardContent>
          </Card>

          {/* Publishing */}
          <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Publish toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_published">Published</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this event visible on the website
                  </p>
                </div>
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => updateField("is_published", checked)}
                />
              </div>

              {/* Featured toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_featured">Featured</Label>
                  <p className="text-sm text-muted-foreground">
                    Show in featured sections
                  </p>
                </div>
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => updateField("is_featured", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
