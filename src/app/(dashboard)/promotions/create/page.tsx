// src/app/(dashboard)/promotions/create/page.tsx
// Created: Create new promotion page

import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/header";
import { PromotionForm } from "@/components/promotions/promotion-form";

export const metadata: Metadata = {
  title: "Add Promotion",
};

export default function CreatePromotionPage() {
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
