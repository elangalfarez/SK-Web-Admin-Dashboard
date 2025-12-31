// src/components/blog/blog-table.tsx
// Created: Blog posts data table with actions

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Star,
  Globe,
  GlobeLock,
  FileText,
  FolderOpen,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/lib/utils/format-date";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deletePost, togglePostPublish } from "@/actions/blog";
import type { PostWithCategory } from "@/types/database";

// ============================================================================
// TYPES
// ============================================================================

interface BlogTableProps {
  data: PostWithCategory[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// ============================================================================
// POST ROW
// ============================================================================

interface PostRowProps {
  post: PostWithCategory;
  onDelete: (id: string) => void;
}

function PostRow({ post, onDelete }: PostRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleTogglePublish = () => {
    startTransition(async () => {
      const result = await togglePostPublish(post.id, !post.is_published);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div
      className={cn(
        "group flex items-start gap-4 border-b border-border p-4 last:border-0 transition-colors hover:bg-muted/50",
        isPending && "opacity-50 pointer-events-none"
      )}
    >
      {/* Featured Image */}
      <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
        {post.image_url ? (
          <img
            src={post.image_url}
            alt={post.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FileText className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}
        {post.is_featured && (
          <div className="absolute left-1 top-1">
            <Star className="h-4 w-4 fill-primary text-primary" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              href={`/blog/${post.id}`}
              className="font-medium hover:text-primary hover:underline line-clamp-1"
            >
              {post.title}
            </Link>
            {post.summary && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                {post.summary}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {post.category && (
                <span className="flex items-center gap-1">
                  <FolderOpen className="h-3.5 w-3.5" />
                  <span
                    className="px-1.5 py-0.5 rounded text-xs"
                    style={{
                      backgroundColor: post.category.accent_color ? `${post.category.accent_color}20` : undefined,
                      color: post.category.accent_color || undefined,
                    }}
                  >
                    {post.category.name}
                  </span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {post.publish_at
                  ? formatRelativeDate(post.publish_at)
                  : formatRelativeDate(post.created_at)}
              </span>
            </div>
          </div>

          {/* Badges */}
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={post.is_published ? "published" : "draft"}>
              {post.is_published ? "Published" : "Draft"}
            </Badge>
          </div>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {post.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{post.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/blog/${post.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/blog/${post.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleTogglePublish}>
              {post.is_published ? (
                <>
                  <GlobeLock className="mr-2 h-4 w-4" />
                  Unpublish
                </>
              ) : (
                <>
                  <Globe className="mr-2 h-4 w-4" />
                  Publish
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(post.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ============================================================================
// PAGINATION
// ============================================================================

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
}

function Pagination({ page, totalPages, total, perPage }: PaginationProps) {
  const router = useRouter();
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", String(newPage));
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3">
      <p className="text-sm text-muted-foreground">
        Showing {start} to {end} of {total} posts
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </Button>
        <span className="text-sm">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BlogTable({ data, total, page, perPage, totalPages }: BlogTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const result = await deletePost(deleteId);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">No posts found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Get started by creating your first blog post.
        </p>
        <Button asChild className="mt-4">
          <Link href="/blog/create">Create Post</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card">
        {/* Table Header */}
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-medium">
            {total} post{total !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Table Body */}
        <div>
          {data.map((post) => (
            <PostRow
              key={post.id}
              post={post}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            perPage={perPage}
          />
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
