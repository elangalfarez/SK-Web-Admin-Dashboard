// src/app/(dashboard)/vip/page.tsx
// Created: VIP management main page

import { Suspense } from "react";
import Link from "next/link";
import { Plus, Gift, Crown } from "lucide-react";
import { PageHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { RequirePermission } from "@/components/providers/auth-provider";
import { VipTiersList } from "@/components/vip/vip-tiers-list";
import { getVipTiersWithBenefits } from "@/actions/vip";

// Force dynamic rendering and no caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ============================================================================
// LOADING SKELETON
// ============================================================================

function VipTiersSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border p-4">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 animate-pulse rounded-xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// VIP TIERS CONTENT
// ============================================================================

async function VipTiersContent() {
  const result = await getVipTiersWithBenefits();

  if (!result.success) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-destructive">Failed to load VIP tiers: {result.error}</p>
      </div>
    );
  }

  const tiers = result.data;

  if (tiers.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <Crown className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">No VIP tiers yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Create your first VIP tier to start building your loyalty program.
        </p>
        <RequirePermission module="dashboard" action="create">
          <Button asChild className="mt-4">
            <Link href="/vip/tiers/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Tier
            </Link>
          </Button>
        </RequirePermission>
      </div>
    );
  }

  return <VipTiersList tiers={tiers} />;
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function VipPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="VIP Cards"
        description="Manage VIP tiers and member benefits"
        actions={
          <div className="flex items-center gap-2">
            <RequirePermission module="dashboard" action="view">
              <Button variant="outline" asChild>
                <Link href="/vip/benefits">
                  <Gift className="mr-2 h-4 w-4" />
                  Benefits Library
                </Link>
              </Button>
            </RequirePermission>
            <RequirePermission module="dashboard" action="create">
              <Button asChild>
                <Link href="/vip/tiers/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Tier
                </Link>
              </Button>
            </RequirePermission>
          </div>
        }
      />

      <Suspense fallback={<VipTiersSkeleton />}>
        <VipTiersContent />
      </Suspense>
    </div>
  );
}
