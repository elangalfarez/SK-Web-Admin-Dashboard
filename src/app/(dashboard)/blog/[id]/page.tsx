// src/app/(dashboard)/blog/[id]/page.tsx
// Created: Blog post detail/view page

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  FileText,
  FolderOpen,
  Calendar,
  Clock,
  Pencil,
  ArrowLeft,
  Globe,
  GlobeLock,
  Star,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPost } from "@/actions/blog";
import { formatDisplayDateTime, formatRelativeDate } from "@/lib/utils/format-date";

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getPost(id);

  if (!result.success || !result.data) {
    return { title: "Post Not Found" };
  }

  return {
    title: result.data.title,
  };
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getPost(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const post = result.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/blog">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-display font-bold line-clamp-2">{post.title}</h1>
              {post.is_featured && (
                <Star className="h-5 w-5 fill-primary text-primary shrink-0" />
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant={post.is_published ? "published" : "draft"}>
                {post.is_published ? (
                  <>
                    <Globe className="mr-1 h-3 w-3" />
                    Published
                  </>
                ) : (
                  <>
                    <GlobeLock className="mr-1 h-3 w-3" />
                    Draft
                  </>
                )}
              </Badge>
              {post.category && (
                <Badge
                  variant="outline"
                  style={{
                    backgroundColor: post.category.color ? `${post.category.color}20` : undefined,
                    borderColor: post.category.color || undefined,
                    color: post.category.color || undefined,
                  }}
                >
                  {post.category.name}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button asChild>
          <Link href={`/blog/${id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Post
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Featured Image */}
          {post.featured_image && (
            <div className="aspect-video overflow-hidden rounded-lg border border-border">
              <img
                src={post.featured_image}
                alt={post.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {/* Excerpt */}
          {post.excerpt && (
            <Card>
              <CardHeader>
                <CardTitle>Excerpt</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{post.excerpt}</p>
              </CardContent>
            </Card>
          )}

          {/* Content */}
          {post.body && (
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: post.body }}
                />
              </CardContent>
            </Card>
          )}

          {/* SEO Preview */}
          {(post.meta_title || post.meta_description) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  SEO Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 rounded-lg border border-border p-4">
                  <p className="text-lg text-primary hover:underline cursor-pointer">
                    {post.meta_title || post.title}
                  </p>
                  <p className="text-sm text-success">
                    supermalkarawaci.co.id/blog/{post.slug}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {post.meta_description || post.excerpt || "No description"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Post Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Post Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {post.category && (
                <div className="flex items-start gap-3">
                  <FolderOpen className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Category</p>
                    <p className="text-sm text-muted-foreground">{post.category.name}</p>
                  </div>
                </div>
              )}
              {post.published_at && (
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Published</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDisplayDateTime(post.published_at)}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {formatRelativeDate(post.updated_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{new Date(post.updated_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slug</span>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  {post.slug}
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
