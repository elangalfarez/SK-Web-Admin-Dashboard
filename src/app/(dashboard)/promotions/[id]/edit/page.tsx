// src/app/(dashboard)/promotions/[id]/edit/page.tsx
// Created: Edit promotion page

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/header";
import { PromotionForm } from "@/components/promotions/promotion-form";
import { getPromotion } from "@/actions/promotions";

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getPromotion(id);

  if (!result.success || !result.data) {
    return { title: "Promotion Not Found" };
  }

  return {
    title: `Edit: ${result.data.title}`,
  };
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function EditPromotionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getPromotion(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Promotion"
        description={`Editing: ${result.data.title}`}
      />
      <PromotionForm promotion={result.data} mode="edit" />
    </div>
  );
}
