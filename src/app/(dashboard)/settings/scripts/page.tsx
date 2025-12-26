// src/app/(dashboard)/settings/scripts/page.tsx
// Created: Custom scripts settings page

import type { Metadata } from "next";
import { ScriptsManager } from "@/components/settings/scripts-manager";

export const metadata: Metadata = {
  title: "Custom Scripts",
};

export default function ScriptsSettingsPage() {
  return <ScriptsManager />;
}
