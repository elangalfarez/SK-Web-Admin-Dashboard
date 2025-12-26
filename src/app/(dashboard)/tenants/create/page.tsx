// src/app/(dashboard)/tenants/create/page.tsx
// Created: Create new tenant page

import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/header";
import { TenantForm } from "@/components/tenants/tenant-form";

export const metadata: Metadata = {
  title: "Add Tenant",
};

export default function CreateTenantPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Tenant"
        description="Add a new store to the mall directory"
      />
      <TenantForm mode="create" />
    </div>
  );
}
