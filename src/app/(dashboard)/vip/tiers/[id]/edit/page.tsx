// src/app/(dashboard)/vip/tiers/[id]/edit/page.tsx
// Created: Edit VIP tier page

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/header";
import { VipTierForm } from "@/components/vip/vip-tier-form";
import { getVipTier } from "@/actions/vip";

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getVipTier(id);

  if (!result.success || !result.data) {
    return { title: "Tier Not Found" };
  }

  return {
    title: `Edit: ${result.data.name}`,
  };
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function EditVipTierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getVipTier(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit VIP Tier"
        description={`Editing: ${result.data.name}`}
      />
      <VipTierForm tier={result.data} mode="edit" />
    </div>
  );
}
