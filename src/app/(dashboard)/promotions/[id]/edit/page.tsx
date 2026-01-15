// src/app/(dashboard)/promotions/[id]/edit/page.tsx
// Created: Edit promotion page

import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/header";
import { PromotionForm } from "@/components/promotions/promotion-form";
import { getPromotion } from "@/actions/promotions";
import { getCurrentSession } from "@/actions/auth";
import { checkUserPermission } from "@/lib/supabase/permission-check";

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
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const hasPermission = await checkUserPermission(
    session.userId,
    "promotions",
    "edit"
  );

  if (!hasPermission) {
    redirect("/promotions");
  }

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
