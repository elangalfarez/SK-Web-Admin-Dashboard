// src/app/(dashboard)/settings/social/page.tsx
// Created: Social media settings page

import type { Metadata } from "next";
import { SocialSettingsForm } from "@/components/settings/social-settings-form";

export const metadata: Metadata = {
  title: "Social Media Settings",
};

export default function SocialSettingsPage() {
  return <SocialSettingsForm />;
}
