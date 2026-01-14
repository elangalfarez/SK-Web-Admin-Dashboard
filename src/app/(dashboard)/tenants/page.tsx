// src/app/(dashboard)/tenants/page.tsx
// Created: Tenants listing page with filtering

import { Suspense } from "react";
import Link from "next/link";
import { Plus, FolderOpen } from "lucide-react";
import { PageHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { RequirePermission } from "@/components/providers/auth-provider";
import { TenantsTable } from "@/components/tenants/tenants-table";
import { TenantsFilters } from "@/components/tenants/tenants-filters";
import { getTenantsList } from "@/actions/tenants";

// ============================================================================
// LOADING SKELETON
// ============================================================================

function TenantsTableSkeleton() {
  return (
    <div className="rounded-lg border border-border">
      <div className="p-4">
        <div className="h-10 w-64 animate-pulse rounded bg-muted" />
      </div>
      <div className="border-t border-border">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border p-4 last:border-0">
            <div className="h-14 w-14 animate-pulse rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// TENANTS CONTENT
// ============================================================================

interface TenantsContentProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

async function TenantsContent({ searchParams }: TenantsContentProps) {
  // Parse filters from URL
  const page = Number(searchParams.page) || 1;
  const perPage = Number(searchParams.perPage) || 10;
  const status = (searchParams.status as string) || "all";
  const search = searchParams.search as string | undefined;
  const categoryId = searchParams.category as string | undefined;
  const floor = searchParams.floor as string | undefined;
  const featured = searchParams.featured === "true" ? true : undefined;
  const newTenant = searchParams.new === "true" ? true : undefined;

  // Fetch tenants
  const result = await getTenantsList({
    page,
    perPage,
    status: status as "all" | "active" | "inactive",
    search,
    categoryId,
    floor,
    featured,
    newTenant,
    sortBy: "name",
    sortOrder: "asc",
  });

  if (!result.success) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-destructive">Failed to load tenants: {result.error}</p>
      </div>
    );
  }

  return (
    <TenantsTable
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

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenants"
        description="Manage mall tenants and stores"
        actions={
          <div className="flex items-center gap-2">
            <RequirePermission module="tenant_categories" action="view">
              <Button variant="outline" asChild>
                <Link href="/tenants/categories">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Categories
                </Link>
              </Button>
            </RequirePermission>
            <RequirePermission module="tenants" action="create">
              <Button asChild>
                <Link href="/tenants/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Tenant
                </Link>
              </Button>
            </RequirePermission>
          </div>
        }
      />

      {/* Filters */}
      <TenantsFilters />

      {/* Table */}
      <Suspense fallback={<TenantsTableSkeleton />}>
        <TenantsContent searchParams={params} />
      </Suspense>
    </div>
  );
}
