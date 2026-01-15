// src/app/(dashboard)/users/page.tsx
// Created: Admin users management page

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UsersTable } from "@/components/users";
import { getCurrentSession } from "@/actions/auth";
import { checkUserPermission } from "@/lib/supabase/permission-check";

export const metadata: Metadata = {
  title: "Admin Users",
};

export default async function UsersPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const hasPermission = await checkUserPermission(
    session.userId,
    "admin_users",
    "view"
  );

  if (!hasPermission) {
    redirect("/");
  }

  return <UsersTable />;
}
