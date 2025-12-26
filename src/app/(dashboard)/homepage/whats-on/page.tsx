// src/app/(dashboard)/homepage/whats-on/page.tsx
// Created: What's On feed management page

import type { Metadata } from "next";
import { WhatsOnManager } from "@/components/homepage/whats-on-manager";

export const metadata: Metadata = {
  title: "What's On - Homepage",
};

export default function WhatsOnPage() {
  return <WhatsOnManager />;
}
