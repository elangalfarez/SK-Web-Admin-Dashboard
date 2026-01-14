// src/app/(dashboard)/tenants/create/page.tsx
// Created: Create new tenant page

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/header";
import { TenantForm } from "@/components/tenants/tenant-form";
import { getCurrentSession } from "@/actions/auth";
import { checkUserPermission } from "@/lib/supabase/permission-check";

export const metadata: Metadata = {
  title: "Add Tenant",
};

export default async function CreateTenantPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const hasPermission = await checkUserPermission(
    session.userId,
    "tenants",
    "create"
  );

  if (!hasPermission) {
    redirect("/tenants");
  }

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
