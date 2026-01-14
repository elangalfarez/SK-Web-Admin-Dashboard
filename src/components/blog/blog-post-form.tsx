// src/components/blog/blog-post-form.tsx
// Created: Blog post form component for create and edit

"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Eye, Search } from "lucide-react";
import { toast } from "sonner";
import { generateSlug } from "@/lib/utils/slug";
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
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { TagInput } from "@/components/shared/tag-input";
import { createPost, updatePost, getCategories, getPostTags } from "@/actions/blog";
import type { PostWithCategory, BlogCategory } from "@/types/database";

// ============================================================================
// TYPES
// ============================================================================

interface BlogPostFormProps {
  post?: PostWithCategory;
  mode: "create" | "edit";
}

interface FormData {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  featured_image: string | null;
  category_id: string | null;
  tags: string[];
  is_published: boolean;
  is_featured: boolean;
  meta_title: string;
  meta_description: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BlogPostForm({ post, mode }: BlogPostFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: post?.title || "",
    slug: post?.slug || "",
    excerpt: post?.summary || "",
    body: post?.body_html || "",
    featured_image: post?.image_url || null,
    category_id: post?.category_id || null,
    tags: post?.tags || [],
    is_published: post?.is_published || false,
    is_featured: post?.is_featured || false,
    meta_title: post?.title || "", // Use title as fallback for meta_title
    meta_description: post?.summary || "", // Use summary as fallback for meta_description
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoSlug, setAutoSlug] = useState(!post);

  // Fetch categories and tags on mount
  useEffect(() => {
    getCategories().then((result) => {
      if (result.success) {
        setCategories(result.data);
      }
    });

    getPostTags().then((result) => {
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
        data.set("slug", formData.slug);
        data.set("excerpt", formData.excerpt);
        data.set("body", formData.body);
        data.set("featured_image", formData.featured_image || "");
        data.set("category_id", formData.category_id || "");
        data.set("tags", JSON.stringify(formData.tags));
        data.set("is_published", String(formData.is_published));
        data.set("is_featured", String(formData.is_featured));
        data.set("meta_title", formData.meta_title);
        data.set("meta_description", formData.meta_description);

        const result = mode === "create"
          ? await createPost(data)
          : await updatePost(post!.id, data);

        if (result.success) {
          toast.success(result.message);
          // Refresh the router cache first, then navigate
          router.refresh();
          // Use a small delay to ensure refresh completes before navigation
          setTimeout(() => {
            router.push("/blog");
          }, 100);
        } else {
          toast.error(result.error || "Failed to save post");
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
          {post && (
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            <Save className="mr-2 h-4 w-4" />
            {isPending ? "Saving..." : mode === "create" ? "Publish Post" : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Post Content</CardTitle>
              <CardDescription>
                Write your blog post content
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
                  placeholder="Enter post title"
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
                  placeholder="post-url-slug"
                  error={!!errors.slug}
                />
                {errors.slug && (
                  <p className="text-sm text-destructive">{errors.slug}</p>
                )}
              </div>

              {/* Excerpt */}
              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => updateField("excerpt", e.target.value)}
                  placeholder="Brief summary of the post"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.excerpt.length}/300 characters
                </p>
              </div>

              {/* Body */}
              <div className="space-y-2">
                <Label>Content</Label>
                <RichTextEditor
                  value={formData.body}
                  onChange={(value) => updateField("body", value)}
                  placeholder="Write your post content..."
                  minHeight="400px"
                />
              </div>
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                SEO Settings
              </CardTitle>
              <CardDescription>
                Optimize your post for search engines
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
                  placeholder={formData.title || "Enter meta title"}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.meta_title.length}/70 characters (recommended)
                </p>
              </div>

              {/* Meta Description */}
              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => updateField("meta_description", e.target.value)}
                  placeholder={formData.excerpt || "Enter meta description"}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.meta_description.length}/160 characters (recommended)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
            </CardHeader>
            <CardContent>
              <SingleImageUploader
                value={formData.featured_image}
                onChange={(url) => updateField("featured_image", url)}
                bucket="POSTS"
                folder="blog"
                aspectRatio="video"
                placeholder="Upload featured image"
              />
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardHeader>
              <CardTitle>Category</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.category_id || "none"}
                onValueChange={(value) => updateField("category_id", value === "none" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <span className="flex items-center gap-2">
                        {category.accent_color && (
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: category.accent_color }}
                          />
                        )}
                        {category.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>
                Add tags to help categorize the post
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
                    Make this post visible on the website
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
