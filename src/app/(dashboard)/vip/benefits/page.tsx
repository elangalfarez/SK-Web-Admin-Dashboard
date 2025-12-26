// src/app/(dashboard)/vip/benefits/page.tsx
// Created: VIP benefits management page

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { VipBenefitsManager } from "@/components/vip/vip-benefits-manager";

export const metadata: Metadata = {
  title: "VIP Benefits",
};

export default function VipBenefitsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vip">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          title="Benefits Library"
          description="Manage benefits that can be assigned to VIP tiers"
          className="mb-0"
        />
      </div>
      
      <div className="max-w-2xl">
        <VipBenefitsManager />
      </div>
    </div>
  );
}
