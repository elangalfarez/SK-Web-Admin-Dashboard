// src/app/(dashboard)/blog/page.tsx
// Created: Blog posts listing page with filtering

import { Suspense } from "react";
import Link from "next/link";
import { Plus, FolderOpen } from "lucide-react";
import { PageHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { RequirePermission } from "@/components/providers/auth-provider";
import { BlogTable } from "@/components/blog/blog-table";
import { BlogFilters } from "@/components/blog/blog-filters";
import { getPosts } from "@/actions/blog";

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ============================================================================
// LOADING SKELETON
// ============================================================================

function BlogTableSkeleton() {
  return (
    <div className="rounded-lg border border-border">
      <div className="p-4">
        <div className="h-10 w-64 animate-pulse rounded bg-muted" />
      </div>
      <div className="border-t border-border">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border p-4 last:border-0">
            <div className="h-20 w-32 animate-pulse rounded bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// BLOG CONTENT
// ============================================================================

interface BlogContentProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

async function BlogContent({ searchParams }: BlogContentProps) {
  // Parse filters from URL
  const page = Number(searchParams.page) || 1;
  const perPage = Number(searchParams.perPage) || 10;
  const status = (searchParams.status as string) || "all";
  const search = searchParams.search as string | undefined;
  const featured = searchParams.featured === "true" ? true : undefined;
  const categoryId = searchParams.category as string | undefined;

  // Fetch posts
  const result = await getPosts({
    page,
    perPage,
    status: status as "all" | "draft" | "published",
    search,
    featured,
    categoryId,
    sortBy: "created_at",
    sortOrder: "desc",
  });

  if (!result.success) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-destructive">Failed to load posts: {result.error}</p>
      </div>
    );
  }

  return (
    <BlogTable
      data={result.data.data}
      total={result.data.total}
      page={result.data.page}
      perPage={result.data.perPage}
      totalPages={result.data.totalPages}
    />
  );
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog Posts"
        description="Manage blog posts and articles"
        actions={
          <div className="flex items-center gap-2">
            <RequirePermission module="posts" action="view">
              <Button variant="outline" asChild>
                <Link href="/blog/categories">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Categories
                </Link>
              </Button>
            </RequirePermission>
            <RequirePermission module="posts" action="create">
              <Button asChild>
                <Link href="/blog/create">
                  <Plus className="mr-2 h-4 w-4" />
                  New Post
                </Link>
              </Button>
            </RequirePermission>
          </div>
        }
      />

      {/* Filters */}
      <BlogFilters />

      {/* Table */}
      <Suspense fallback={<BlogTableSkeleton />}>
        <BlogContent searchParams={params} />
      </Suspense>
    </div>
  );
}
