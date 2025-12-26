// src/app/(dashboard)/contacts/page.tsx
// Created: Contacts listing page with filtering and stats

import { Suspense } from "react";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { ContactsFilters } from "@/components/contacts/contacts-filters";
import { ContactsStats } from "@/components/contacts/contacts-stats";
import { getContacts } from "@/actions/contacts";
import type { EnquiryType } from "@/types/database";

// ============================================================================
// LOADING SKELETON
// ============================================================================

function ContactsTableSkeleton() {
  return (
    <div className="rounded-lg border border-border">
      <div className="p-4">
        <div className="h-10 w-64 animate-pulse rounded bg-muted" />
      </div>
      <div className="border-t border-border">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-start gap-4 border-b border-border p-4 last:border-0"
          >
            <div className="h-4 w-4 animate-pulse rounded bg-muted" />
            <div className="h-2 w-2 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
            </div>
            <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg border border-border p-4">
          <div className="space-y-2">
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            <div className="h-8 w-16 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// CONTACTS CONTENT
// ============================================================================

interface ContactsContentProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

async function ContactsContent({ searchParams }: ContactsContentProps) {
  // Parse filters from URL
  const page = Number(searchParams.page) || 1;
  const perPage = Number(searchParams.perPage) || 10;
  const status = (searchParams.status as "all" | "read" | "unread") || "all";
  const search = searchParams.search as string | undefined;
  const enquiryType = searchParams.type as EnquiryType | "all" | undefined;
  const startDate = searchParams.startDate as string | undefined;
  const endDate = searchParams.endDate as string | undefined;

  // Fetch contacts
  const result = await getContacts({
    page,
    perPage,
    status,
    search,
    enquiryType: enquiryType || "all",
    startDate,
    endDate,
    sortBy: "submitted_date",
    sortOrder: "desc",
  });

  if (!result.success) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-destructive">
          Failed to load contacts: {result.error}
        </p>
      </div>
    );
  }

  return (
    <ContactsTable
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

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description="Manage contact form submissions"
        actions={
          <Button variant="outline" disabled>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        }
      />

      {/* Stats */}
      <Suspense fallback={<StatsSkeleton />}>
        <ContactsStats />
      </Suspense>

      {/* Filters */}
      <ContactsFilters />

      {/* Table */}
      <Suspense fallback={<ContactsTableSkeleton />}>
        <ContactsContent searchParams={params} />
      </Suspense>
    </div>
  );
}
