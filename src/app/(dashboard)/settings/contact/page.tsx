// src/app/(dashboard)/settings/contact/page.tsx
// Created: Contact settings page

import type { Metadata } from "next";
import { ContactSettingsForm } from "@/components/settings/contact-settings-form";

export const metadata: Metadata = {
  title: "Contact Settings",
};

export default function ContactSettingsPage() {
  return <ContactSettingsForm />;
}
