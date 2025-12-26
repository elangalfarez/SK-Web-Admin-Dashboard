// src/app/(dashboard)/settings/page.tsx
// Created: General settings page

import type { Metadata } from "next";
import { GeneralSettingsForm } from "@/components/settings/general-settings-form";

export const metadata: Metadata = {
  title: "General Settings",
};

export default function GeneralSettingsPage() {
  return <GeneralSettingsForm />;
}
