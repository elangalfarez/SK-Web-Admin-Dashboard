// src/app/(dashboard)/users/page.tsx
// Created: Admin users management page

import type { Metadata } from "next";
import { UsersTable } from "@/components/users";

export const metadata: Metadata = {
  title: "Admin Users",
};

export default function UsersPage() {
  return <UsersTable />;
}
