// src/app/(dashboard)/events/page.tsx
// Created: Events listing page with filtering and actions

import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { RequirePermission } from "@/components/providers/auth-provider";
import { EventsTable } from "@/components/events/events-table";
import { EventsFilters } from "@/components/events/events-filters";
import { getEvents } from "@/actions/events";

// ============================================================================
// LOADING SKELETON
// ============================================================================

function EventsTableSkeleton() {
  return (
    <div className="rounded-lg border border-border">
      <div className="p-4">
        <div className="h-10 w-64 animate-pulse rounded bg-muted" />
      </div>
      <div className="border-t border-border">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border p-4 last:border-0">
            <div className="h-16 w-24 animate-pulse rounded bg-muted" />
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
// EVENTS CONTENT
// ============================================================================

interface EventsContentProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

async function EventsContent({ searchParams }: EventsContentProps) {
  // Parse filters from URL
  const page = Number(searchParams.page) || 1;
  const perPage = Number(searchParams.perPage) || 10;
  const status = (searchParams.status as string) || "all";
  const search = searchParams.search as string | undefined;
  const featured = searchParams.featured === "true" ? true : undefined;

  // Fetch events
  const result = await getEvents({
    page,
    perPage,
    status: status as "all" | "draft" | "published" | "upcoming" | "ongoing" | "ended",
    search,
    featured,
    sortBy: "created_at",
    sortOrder: "desc",
  });

  if (!result.success) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-destructive">Failed to load events: {result.error}</p>
      </div>
    );
  }

  return (
    <EventsTable
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

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        description="Manage mall events, exhibitions, and activities"
        actions={
          <RequirePermission module="events" action="create">
            <Button asChild>
              <Link href="/events/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Link>
            </Button>
          </RequirePermission>
        }
      />

      {/* Filters */}
      <EventsFilters />

      {/* Table */}
      <Suspense fallback={<EventsTableSkeleton />}>
        <EventsContent searchParams={params} />
      </Suspense>
    </div>
  );
}
