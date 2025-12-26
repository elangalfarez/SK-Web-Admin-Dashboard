// src/app/(dashboard)/settings/analytics/page.tsx
// Created: Analytics settings page

import type { Metadata } from "next";
import { AnalyticsSettingsForm } from "@/components/settings/analytics-settings-form";

export const metadata: Metadata = {
  title: "Analytics Settings",
};

export default function AnalyticsSettingsPage() {
  return <AnalyticsSettingsForm />;
}
