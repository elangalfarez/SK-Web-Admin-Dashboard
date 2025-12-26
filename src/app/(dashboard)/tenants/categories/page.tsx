// src/app/(dashboard)/tenants/categories/page.tsx
// Created: Tenant categories management page

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { TenantCategoriesManager } from "@/components/tenants/tenant-categories-manager";

export const metadata: Metadata = {
  title: "Tenant Categories",
};

export default function TenantCategoriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/tenants">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          title="Tenant Categories"
          description="Organize tenants by store type"
          className="mb-0"
        />
      </div>
      
      <div className="max-w-2xl">
        <TenantCategoriesManager />
      </div>
    </div>
  );
}
