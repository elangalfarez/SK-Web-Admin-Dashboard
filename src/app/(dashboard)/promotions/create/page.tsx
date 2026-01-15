// src/app/(dashboard)/promotions/create/page.tsx
// Created: Create new promotion page

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/header";
import { PromotionForm } from "@/components/promotions/promotion-form";
import { getCurrentSession } from "@/actions/auth";
import { checkUserPermission } from "@/lib/supabase/permission-check";

export const metadata: Metadata = {
  title: "Add Promotion",
};

export default async function CreatePromotionPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const hasPermission = await checkUserPermission(
    session.userId,
    "promotions",
    "create"
  );

  if (!hasPermission) {
    redirect("/promotions");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Promotion"
        description="Create a new tenant promotion"
      />
      <PromotionForm mode="create" />
    </div>
  );
}
