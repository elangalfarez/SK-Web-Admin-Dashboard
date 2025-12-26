// src/app/(dashboard)/promotions/page.tsx
// Created: Promotions listing page with filtering

import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { PromotionsTable } from "@/components/promotions/promotions-table";
import { PromotionsFilters } from "@/components/promotions/promotions-filters";
import { getPromotions } from "@/actions/promotions";

// ============================================================================
// LOADING SKELETON
// ============================================================================

function PromotionsTableSkeleton() {
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
// PROMOTIONS CONTENT
// ============================================================================

interface PromotionsContentProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

async function PromotionsContent({ searchParams }: PromotionsContentProps) {
  // Parse filters from URL
  const page = Number(searchParams.page) || 1;
  const perPage = Number(searchParams.perPage) || 10;
  const status = (searchParams.status as string) || "all";
  const search = searchParams.search as string | undefined;
  const tenantId = searchParams.tenant as string | undefined;

  // Fetch promotions
  const result = await getPromotions({
    page,
    perPage,
    status: status as "all" | "staging" | "published" | "expired",
    search,
    tenantId,
    sortBy: "created_at",
    sortOrder: "desc",
  });

  if (!result.success) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-destructive">Failed to load promotions: {result.error}</p>
      </div>
    );
  }

  return (
    <PromotionsTable
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

export default async function PromotionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promotions"
        description="Manage tenant promotions and offers"
        actions={
          <Button asChild>
            <Link href="/promotions/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Promotion
            </Link>
          </Button>
        }
      />

      {/* Filters */}
      <PromotionsFilters />

      {/* Table */}
      <Suspense fallback={<PromotionsTableSkeleton />}>
        <PromotionsContent searchParams={params} />
      </Suspense>
    </div>
  );
}
