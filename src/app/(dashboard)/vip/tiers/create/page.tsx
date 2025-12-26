// src/app/(dashboard)/vip/tiers/create/page.tsx
// Created: Create new VIP tier page

import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/header";
import { VipTierForm } from "@/components/vip/vip-tier-form";

export const metadata: Metadata = {
  title: "Create VIP Tier",
};

export default function CreateVipTierPage() {
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
