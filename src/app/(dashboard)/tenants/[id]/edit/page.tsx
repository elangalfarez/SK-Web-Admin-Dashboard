// src/app/(dashboard)/tenants/[id]/edit/page.tsx
// Created: Edit tenant page

import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/header";
import { TenantForm } from "@/components/tenants/tenant-form";
import { getTenant } from "@/actions/tenants";
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
  const result = await getTenant(id);

  if (!result.success || !result.data) {
    return { title: "Tenant Not Found" };
  }

  return {
    title: `Edit: ${result.data.name}`,
  };
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function EditTenantPage({
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
    "tenants",
    "edit"
  );

  if (!hasPermission) {
    redirect("/tenants");
  }

  const { id } = await params;
  const result = await getTenant(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Tenant"
        description={`Editing: ${result.data.name}`}
      />
      <TenantForm tenant={result.data} mode="edit" />
    </div>
  );
}
