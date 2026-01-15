// src/app/(dashboard)/settings/seo/page.tsx
// Created: SEO settings page

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SeoSettingsForm } from "@/components/settings/seo-settings-form";
import { getCurrentSession } from "@/actions/auth";
import { checkUserPermission } from "@/lib/supabase/permission-check";

export const metadata: Metadata = {
  title: "SEO Settings",
};

export default async function SeoSettingsPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const hasPermission = await checkUserPermission(
    session.userId,
    "seo_settings",
    "view"
  );

  if (!hasPermission) {
    redirect("/");
  }

  return <SeoSettingsForm />;
}
