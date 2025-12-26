// src/app/(dashboard)/users/roles/page.tsx
// Created: Roles and permissions management page

import type { Metadata } from "next";
import { RolesManager } from "@/components/users";

export const metadata: Metadata = {
  title: "Roles & Permissions",
};

export default function RolesPage() {
  return <RolesManager />;
}
