// src/app/(dashboard)/settings/seo/page.tsx
// Created: SEO settings page

import type { Metadata } from "next";
import { SeoSettingsForm } from "@/components/settings/seo-settings-form";

export const metadata: Metadata = {
  title: "SEO Settings",
};

export default function SeoSettingsPage() {
  return <SeoSettingsForm />;
}
