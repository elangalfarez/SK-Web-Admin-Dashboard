// src/app/(dashboard)/vip/tiers/create/page.tsx
// Created: Create new VIP tier page

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/header";
import { VipTierForm } from "@/components/vip/vip-tier-form";
import { getCurrentSession } from "@/actions/auth";
import { checkUserPermission } from "@/lib/supabase/permission-check";

export const metadata: Metadata = {
  title: "Create VIP Tier",
};

export default async function CreateVipTierPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const hasPermission = await checkUserPermission(
    session.userId,
    "dashboard",
    "create"
  );

  if (!hasPermission) {
    redirect("/vip");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create VIP Tier"
        description="Add a new tier to the VIP program"
      />
      <VipTierForm mode="create" />
    </div>
  );
}
