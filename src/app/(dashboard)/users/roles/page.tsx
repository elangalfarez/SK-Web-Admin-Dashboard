// src/app/(dashboard)/users/roles/page.tsx
// Created: Roles and permissions management page

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RolesManager } from "@/components/users";
import { getCurrentSession } from "@/actions/auth";
import { checkUserPermission } from "@/lib/supabase/permission-check";

export const metadata: Metadata = {
  title: "Roles & Permissions",
};

export default async function RolesPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const hasPermission = await checkUserPermission(
    session.userId,
    "admin_roles",
    "manage_roles"
  );

  if (!hasPermission) {
    redirect("/");
  }

  return <RolesManager />;
}
