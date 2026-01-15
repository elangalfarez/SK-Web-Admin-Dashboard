// src/app/(dashboard)/homepage/whats-on/page.tsx
// Created: What's On feed management page

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WhatsOnManager } from "@/components/homepage/whats-on-manager";
import { getCurrentSession } from "@/actions/auth";
import { checkUserPermission } from "@/lib/supabase/permission-check";

export const metadata: Metadata = {
  title: "What's On - Homepage",
};

export default async function WhatsOnPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const hasPermission = await checkUserPermission(
    session.userId,
    "whats_on",
    "view"
  );

  if (!hasPermission) {
    redirect("/");
  }

  return <WhatsOnManager />;
}
